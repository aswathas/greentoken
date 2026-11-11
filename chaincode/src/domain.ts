/**
 * GreenToken Chaincode — the smart contract business logic.
 *
 * IMPORTANT: this module contains NO platform-specific code. It talks to a
 * `ChaincodeStub` interface that is satisfied by three different hosts:
 *
 *   1. Browser demo  -> src/core/ledger.ts   (MemoryStub)
 *   2. Cloudflare Worker + Durable Object -> worker/src/stub.ts (DOStub)
 *   3. Real Hyperledger Fabric -> chaincode/src/contract.ts (fabric-shim Context)
 *
 * That means the smart contract you deploy to Fabric is literally the same
 * business logic the demo runs.
 *
 * Roles are enforced through the MSP identity + attributes of the caller,
 * mirroring Fabric's chaincode access control and endorsement policy model.
 */

import {
  type ChaincodeResult,
  type FundingInvoice,
  type GeoStamp,
  type OrgId,
  type PhotoProof,
  type TokenStatus,
  type TreeToken,
} from './types';
import { canonicalize, hashJson, signPayload } from './crypto';

/* ------------------------------------------------------------------ *
 * Stub interface — the contract between logic and platform
 * ------------------------------------------------------------------ */

export interface ChaincodeStub {
  getState(key: string): Promise<any | null>;
  putState(key: string, value: unknown): Promise<void>;
  getStateByRange(prefix: string): Promise<{ key: string; value: any }[]>;
  deleteState(key: string): Promise<void>;
  emitEvent(name: string, payload: unknown): Promise<void>;
  getMSPID(): string;
  getAttributeValue(name: string): string | null;
  getTxID(): string;
  getBlockNumber(): number;
  /** Cryptographic identity of the caller, used to sign endorsements. */
  getSignerKeys(): { publicKey: JsonWebKey; privateKey: JsonWebKey } | null;
}

export interface CallerContext {
  org: OrgId;
  name: string;
  id: string;
  orgName: string;
}

/** MSP id -> organisation role mapping (mirrors the Fabric MSP definitions). */
export const MSP_TO_ORG: Record<string, OrgId> = {
  PlantersAssociationMSP: 'PLANTER',
  ForestDeptMSP: 'VERIFIER',
  CorporateFundersMSP: 'FUNDER',
  AuditorMSP: 'AUDITOR',
};

export const ORG_NAMES: Record<OrgId, string> = {
  PLANTER: 'Sahyadri Planters Association',
  VERIFIER: 'State Forest Department',
  FUNDER: 'Corporate Green Funders',
  AUDITOR: 'Independent Carbon Auditor',
};

/** Short organisation labels used in operator-facing error messages. */
export const ORG_SHORT_NAMES: Record<OrgId, string> = {
  PLANTER: 'Planters Association',
  VERIFIER: 'Forest Department',
  FUNDER: 'Green Funders',
  AUDITOR: 'Carbon Auditor',
};

/** Number of independent endorsements required before a token is mintable. */
export const REQUIRED_ENDORSEMENTS = 2;

/** Annual CO2 sequestration (kg per tree per year) by species. */
export const CARBON_PER_SPECIES: Record<string, number> = {
  Mango: 25,
  Neem: 22,
  Teak: 30,
  Bamboo: 28,
  Gulmohar: 29,
  Peepal: 28,
  Banyan: 33,
  Jamun: 24,
  Eucalyptus: 31,
  Casuarina: 26,
};

/** Default price per token in INR (1 token = 1 verified tree). */
export const BASE_PRICE_INR = 150;

/** Human-readable description of the CO2 estimate formula, shown in the UI. */
export const CO2_RATES_NOTE = 'species rate × trees';

/** Bulk discount ladder — this is the "invoice management discounting" rule. */
export const DISCOUNT_TIERS: { min: number; pct: number }[] = [
  { min: 500, pct: 15 },
  { min: 200, pct: 10 },
  { min: 50, pct: 5 },
  { min: 1, pct: 0 },
];

export function discountForUnits(units: number): number {
  const tier = DISCOUNT_TIERS.find((t) => units >= t.min);
  return tier ? tier.pct : 0;
}

export function co2For(species: string, count: number): number {
  return (CARBON_PER_SPECIES[species] ?? 20) * count;
}

function nowIso(): string {
  return new Date().toISOString();
}

/* ------------------------------------------------------------------ *
 * Key layout in the world state (mirrors Fabric composite keys)
 * ------------------------------------------------------------------ */

export const KEY = {
  token: (id: string) => `token:${id}`,
  tokenIndex: (id: string) => `token~idx:${id}`,
  invoice: (id: string) => `invoice:${id}`,
  invoiceIndex: (id: string) => `invoice~idx:${id}`,
  tokenByDistrict: (d: string, id: string) => `idx:district:${d}:${id}`,
  tokenByStatus: (s: string, id: string) => `idx:status:${s}:${id}`,
  tokenBySpecies: (s: string, id: string) => `idx:species:${s}:${id}`,
  tokenByPlanter: (p: string, id: string) => `idx:planter:${p}:${id}`,
  /**
   * Photo-hash index — one photo may back at most one token.
   * The key is `idx:photo:<sha256>:<tokenId>`; the prefix helper is what the
   * duplicate check range-scans.
   */
  photoIndex: (hash: string, id: string) => `idx:photo:${hash}:${id}`,
  photoIndexPrefix: (hash: string) => `idx:photo:${hash}:`,
  meta: (k: string) => `meta:${k}`,
};

/* ------------------------------------------------------------------ *
 * Access control
 * ------------------------------------------------------------------ */

function resolveCaller(stub: ChaincodeStub): CallerContext {
  const mspId = stub.getMSPID();
  const org = MSP_TO_ORG[mspId] ?? 'PLANTER';
  const name = stub.getAttributeValue('name') ?? 'Unknown';
  const id = stub.getAttributeValue('participantId') ?? 'unknown';
  return { org, name, id, orgName: ORG_NAMES[org] };
}

function requireOrg(stub: ChaincodeStub, allowed: OrgId[]): ChaincodeResult<CallerContext> {
  const caller = resolveCaller(stub);
  if (!allowed.includes(caller.org)) {
    return {
      ok: false,
      message: `Access denied: ${ORG_NAMES[caller.org]} is not permitted to perform this operation.`,
    };
  }
  return { ok: true, message: '', data: caller };
}

/* ------------------------------------------------------------------ *
 * 1. PlantTree — planter registers a tree with geo-stamp + photo proof
 * ------------------------------------------------------------------ */

export interface PlantTreeInput {
  planterId: string;
  planterName: string;
  planterOrg: string;
  district: string;
  state: string;
  species: string;
  count: number;
  geo: { lat: number; lng: number; accuracyMeters: number; capturedAt: string };
  photo: { sha256: string; byteLength: number; mimeType: string; dataUrl?: string };
  /**
   * The planter's contact number. Accepted for the UI's benefit only — it is
   * dropped at the top of PlantTree and never reaches world state, the
   * transaction payload or any read view.
   */
  privateContact?: string;
}

export async function PlantTree(
  stub: ChaincodeStub,
  input: PlantTreeInput,
): Promise<ChaincodeResult<TreeToken>> {
  const auth = requireOrg(stub, ['PLANTER']);
  if (!auth.ok || !auth.data) return { ok: false, message: auth.message };

  // FIX 7 — the planter's contact is private data, and this contract keeps it
  // OUT of the shared state entirely: it is stripped here, before anything is
  // hashed, stored or emitted. Nothing downstream ever sees it.
  const { privateContact: _privateContact, ...safeInput } = input;

  if (!safeInput.species || !(safeInput.species in CARBON_PER_SPECIES)) {
    return { ok: false, message: `Unknown species "${safeInput.species}". Not in the carbon registry.` };
  }
  if (!safeInput.count || safeInput.count < 1) {
    return { ok: false, message: 'Tree count must be at least 1.' };
  }
  if (!Number.isFinite(safeInput.geo?.lat) || !Number.isFinite(safeInput.geo?.lng)) {
    return { ok: false, message: 'A valid geo-stamp (lat/lng) is required as proof of planting.' };
  }
  if (!safeInput.photo?.sha256) {
    return { ok: false, message: 'A photo with a SHA-256 content hash is required as proof.' };
  }

  // FIX 3 — one photo may back only one token. The photo-hash index makes that
  // check a single range scan instead of a full sweep of the token store.
  const photoRows = await stub.getStateByRange(KEY.photoIndexPrefix(safeInput.photo.sha256));
  if (photoRows.length) {
    const owner = photoRows[0].value?.tokenId ?? String(photoRows[0].key).split(':').pop();
    return {
      ok: false,
      message: `This photo has already been submitted for token ${owner}.`,
    };
  }

  const seq = ((await stub.getState(KEY.meta('tokenSeq'))) as number | null) ?? 0;
  const next = seq + 1;
  await stub.putState(KEY.meta('tokenSeq'), next);

  const tokenId = `GT-${String(next).padStart(6, '0')}`;
  const geoHash = await hashJson(safeInput.geo);

  const token: TreeToken = {
    tokenId,
    planterId: safeInput.planterId,
    planterName: safeInput.planterName,
    planterOrg: safeInput.planterOrg,
    district: safeInput.district,
    state: safeInput.state,
    species: safeInput.species,
    count: safeInput.count,
    estimatedCo2Kg: co2For(safeInput.species, safeInput.count),
    geo: {
      lat: safeInput.geo.lat,
      lng: safeInput.geo.lng,
      accuracyMeters: safeInput.geo.accuracyMeters ?? 0,
      capturedAt: safeInput.geo.capturedAt ?? nowIso(),
      geoHash,
    },
    photo: {
      sha256: safeInput.photo.sha256,
      byteLength: safeInput.photo.byteLength,
      mimeType: safeInput.photo.mimeType,
      dataUrl: safeInput.photo.dataUrl,
    },
    status: 'PENDING',
    endorsements: [],
    requiredEndorsements: REQUIRED_ENDORSEMENTS,
    createdAt: nowIso(),
  };

  await stub.putState(KEY.token(tokenId), token);
  await stub.putState(KEY.tokenIndex(tokenId), { tokenId });
  await stub.putState(KEY.tokenByDistrict(token.district, tokenId), { tokenId });
  await stub.putState(KEY.tokenByStatus(token.status, tokenId), { tokenId });
  await stub.putState(KEY.tokenBySpecies(token.species, tokenId), { tokenId });
  await stub.putState(KEY.tokenByPlanter(token.planterId, tokenId), { tokenId });
  // FIX 3 — the photo-hash index entry, written with the token.
  await stub.putState(KEY.photoIndex(token.photo.sha256, tokenId), { tokenId });

  await stub.emitEvent('PlantTree', {
    tokenId,
    planter: safeInput.planterName,
    district: token.district,
    species: token.species,
    count: token.count,
    geoHash,
    photoHash: token.photo.sha256,
    estimatedCo2Kg: token.estimatedCo2Kg,
  });

  return { ok: true, message: `Token ${tokenId} created and awaiting verification.`, data: token };
}

/* ------------------------------------------------------------------ *
 * 2. VerifyPlanting — independent verifier endorses the proof
 * ------------------------------------------------------------------ */

export interface VerifyPlantingInput {
  tokenId: string;
  verdict: 'APPROVE' | 'REJECT';
  note: string;
}

export async function VerifyPlanting(
  stub: ChaincodeStub,
  input: VerifyPlantingInput,
): Promise<ChaincodeResult<TreeToken>> {
  const auth = requireOrg(stub, ['VERIFIER', 'AUDITOR']);
  if (!auth.ok || !auth.data) return { ok: false, message: auth.message };
  const caller = auth.data;

  const token = (await stub.getState(KEY.token(input.tokenId))) as TreeToken | null;
  if (!token) return { ok: false, message: `Token ${input.tokenId} not found.` };

  // FIX 2 — rejection is terminal. A rejected token can never be re-reviewed,
  // re-approved or re-inverted back into the queue.
  if (token.status === 'REJECTED') {
    return {
      ok: false,
      message: `Token ${token.tokenId} was rejected and cannot be re-reviewed.`,
    };
  }
  if (token.status === 'FUNDED') {
    return { ok: false, message: 'Token is already funded and settled; verification is closed.' };
  }
  if (token.status === 'VERIFIED') {
    return {
      ok: false,
      message: `Token ${token.tokenId} is already VERIFIED; verification is closed.`,
    };
  }

  // One review per participant.
  if (token.endorsements.some((e) => e.by === caller.id)) {
    return { ok: false, message: `${caller.name} has already reviewed this token.` };
  }

  // FIX 1 — one review per organisation. Without this a single organisation
  // could manufacture the whole quorum with two of its own officers.
  if (token.endorsements.some((e) => e.org === caller.org)) {
    return {
      ok: false,
      message: `${ORG_SHORT_NAMES[caller.org]} has already reviewed this token.`,
    };
  }

  // FIX 1 — defensive: state written by an older build (or imported from
  // elsewhere) may already hold enough approvals from a single organisation.
  const priorApprovals = token.endorsements.filter((e) => e.verdict === 'APPROVE');
  const priorOrgs = new Set(priorApprovals.map((e) => e.org));
  if (
    priorApprovals.length >= token.requiredEndorsements &&
    priorOrgs.size < token.requiredEndorsements
  ) {
    return {
      ok: false,
      message: `Quorum requires endorsements from ${token.requiredEndorsements} different organisations.`,
    };
  }

  const endorsementPayload = {
    tokenId: token.tokenId,
    verdict: input.verdict,
    note: input.note ?? '',
    org: caller.org,
    at: nowIso(),
  };

  // On Fabric the peer's endorsement is already signed by the organisation's
  // MSP identity, so the chaincode does not re-sign. In the browser demo we
  // hold the participant's ECDSA key and sign the endorsement ourselves.
  const signer = await stub.getSignerKeys();
  const signature = signer
    ? await signPayload(endorsementPayload, signer.privateKey)
    : await hashJson({ fabricEndorsement: true, ...endorsementPayload });

  const endorsement = {
    by: caller.id,
    org: caller.org,
    orgName: caller.orgName,
    verdict: input.verdict,
    note: input.note ?? '',
    endorsedAt: nowIso(),
    signature,
  };

  token.endorsements.push(endorsement);

  const previousStatus = token.status;

  if (input.verdict === 'REJECT') {
    token.status = 'REJECTED';
    token.verifiedAt = nowIso();
  } else {
    // FIX 1 — quorum counts DISTINCT organisations, not endorsements.
    const approvals = token.endorsements.filter((e) => e.verdict === 'APPROVE');
    const approvingOrgs = new Set(approvals.map((e) => e.org));
    if (approvingOrgs.size >= token.requiredEndorsements) {
      token.status = 'VERIFIED';
      token.verifiedAt = nowIso();
    }
  }

  await stub.putState(KEY.token(token.tokenId), token);

  // FIX 5 — always drop the PREVIOUS status index entry, otherwise a token
  // that moves PENDING -> VERIFIED -> REJECTED keeps a stale VERIFIED entry.
  if (previousStatus !== token.status) {
    await stub.deleteState(KEY.tokenByStatus(previousStatus, token.tokenId));
  }
  await stub.putState(KEY.tokenByStatus(token.status, token.tokenId), { tokenId: token.tokenId });

  await stub.emitEvent('VerifyPlanting', {
    tokenId: token.tokenId,
    verifier: caller.orgName,
    verdict: input.verdict,
    status: token.status,
    approvals: token.endorsements.filter((e) => e.verdict === 'APPROVE').length,
    required: token.requiredEndorsements,
    approvingOrgs: [...new Set(token.endorsements.filter((e) => e.verdict === 'APPROVE').map((e) => e.org))],
  });

  return {
    ok: true,
    message:
      token.status === 'VERIFIED'
        ? `Quorum reached — token ${token.tokenId} is VERIFIED and mintable.`
        : token.status === 'REJECTED'
          ? `Token ${token.tokenId} rejected by ${caller.orgName}.`
          : `Endorsement recorded (${token.endorsements.length}/${token.requiredEndorsements}). Quorum requires endorsements from ${token.requiredEndorsements} different organisations.`,
    data: token,
  };
}

/* ------------------------------------------------------------------ *
 * 3. FundTokens — funder buys a basket of verified tokens (invoice)
 * ------------------------------------------------------------------ */

export interface FundTokensInput {
  tokenIds: string[];
  /** Optional client hint — validated against the basket, never trusted. */
  units?: number;
  /** Optional client hint — the price is a contract constant. */
  pricePerToken?: number;
  funderId: string;
  funderName: string;
}

export async function FundTokens(
  stub: ChaincodeStub,
  input: FundTokensInput,
): Promise<ChaincodeResult<FundingInvoice>> {
  const auth = requireOrg(stub, ['FUNDER']);
  if (!auth.ok || !auth.data) return { ok: false, message: auth.message };
  const caller = auth.data;

  if (!input.tokenIds?.length) {
    return { ok: false, message: 'Select at least one verified token to fund.' };
  }

  const tokens: TreeToken[] = [];
  for (const id of input.tokenIds) {
    const t = (await stub.getState(KEY.token(id))) as TreeToken | null;
    if (!t) return { ok: false, message: `Token ${id} not found.` };
    if (t.status !== 'VERIFIED') {
      return {
        ok: false,
        message: `Token ${id} is ${t.status} — only VERIFIED tokens can be funded.`,
      };
    }
    tokens.push(t);
  }

  // FIX 4 — the unit count is DERIVED from the basket. A client that declares
  // more units than the basket really contains would buy a deeper discount
  // tier, so a mismatching declaration is rejected outright.
  const basketUnits = tokens.reduce((sum, t) => sum + t.count, 0);
  if (input.units !== undefined && input.units !== null && input.units !== basketUnits) {
    return {
      ok: false,
      message: `Declared ${input.units} units but the basket contains ${basketUnits} trees.`,
    };
  }
  const units = basketUnits;

  // FIX 4 — the price is a contract constant, never a client input.
  if (
    input.pricePerToken !== undefined &&
    input.pricePerToken !== null &&
    input.pricePerToken !== BASE_PRICE_INR
  ) {
    return {
      ok: false,
      message: `Price per token is fixed by the contract at ₹${BASE_PRICE_INR}.`,
    };
  }
  const pricePerToken = BASE_PRICE_INR;

  // The discount tier follows the VALIDATED unit count.
  const discountPct = discountForUnits(units);
  const grossAmount = units * pricePerToken;
  const discountAmount = Math.round((grossAmount * discountPct) / 100);
  const netAmount = grossAmount - discountAmount;

  const seq = ((await stub.getState(KEY.meta('invoiceSeq'))) as number | null) ?? 0;
  const next = seq + 1;
  await stub.putState(KEY.meta('invoiceSeq'), next);
  const invoiceId = `INV-2026-${String(next).padStart(5, '0')}`;

  const invoice: FundingInvoice = {
    invoiceId,
    funderId: input.funderId || caller.id,
    funderName: input.funderName || caller.name,
    units,
    pricePerToken,
    discountPct,
    grossAmount,
    discountAmount,
    netAmount,
    tokenIds: tokens.map((t) => t.tokenId),
    issuedAt: nowIso(),
    status: 'ISSUED',
  };

  for (const t of tokens) {
    const previousStatus = t.status;
    t.status = 'FUNDED';
    t.invoiceId = invoiceId;
    t.fundedAt = nowIso();
    await stub.putState(KEY.token(t.tokenId), t);
    // FIX 5 — drop the previous status index entry before writing the new one.
    await stub.deleteState(KEY.tokenByStatus(previousStatus, t.tokenId));
    await stub.putState(KEY.tokenByStatus(t.status, t.tokenId), { tokenId: t.tokenId });
  }

  await stub.putState(KEY.invoice(invoiceId), invoice);
  await stub.putState(KEY.invoiceIndex(invoiceId), { invoiceId });

  await stub.emitEvent('FundTokens', {
    invoiceId,
    funder: invoice.funderName,
    units,
    grossAmount,
    discountPct,
    discountAmount,
    netAmount,
    tokenIds: invoice.tokenIds,
  });

  return {
    ok: true,
    message: `Invoice ${invoiceId} issued — ${units} token(s), ${discountPct}% bulk discount applied.`,
    data: invoice,
  };
}

/* ------------------------------------------------------------------ *
 * 4. SettleFunding — funds move to the planters
 * ------------------------------------------------------------------ */

export async function SettleFunding(
  stub: ChaincodeStub,
  invoiceId: string,
): Promise<ChaincodeResult<FundingInvoice>> {
  const auth = requireOrg(stub, ['FUNDER', 'AUDITOR']);
  if (!auth.ok || !auth.data) return { ok: false, message: auth.message };

  const invoice = (await stub.getState(KEY.invoice(invoiceId))) as FundingInvoice | null;
  if (!invoice) return { ok: false, message: `Invoice ${invoiceId} not found.` };
  if (invoice.status === 'SETTLED') {
    return { ok: false, message: `Invoice ${invoiceId} is already settled.` };
  }

  invoice.status = 'SETTLED';
  invoice.settledAt = nowIso();
  await stub.putState(KEY.invoice(invoiceId), invoice);

  await stub.emitEvent('SettleFunding', {
    invoiceId,
    netAmount: invoice.netAmount,
    beneficiaries: invoice.tokenIds.length,
  });

  return { ok: true, message: `Invoice ${invoiceId} settled. ₹${invoice.netAmount} released to planters.`, data: invoice };
}

/* ------------------------------------------------------------------ *
 * Queries — read-only, no ledger mutation
 * ------------------------------------------------------------------ */

export async function GetToken(stub: ChaincodeStub, tokenId: string): Promise<ChaincodeResult<TreeToken>> {
  const token = (await stub.getState(KEY.token(tokenId))) as TreeToken | null;
  if (!token) return { ok: false, message: `Token ${tokenId} not found.` };
  return { ok: true, message: '', data: token };
}

export interface SearchInput {
  status?: TokenStatus | 'ALL';
  district?: string;
  species?: string;
  planterId?: string;
  q?: string;
}

export async function SearchTokens(
  stub: ChaincodeStub,
  input: SearchInput,
): Promise<ChaincodeResult<TreeToken[]>> {
  // FIX 6 — the composite-key indexes are read, not just written. Every
  // equality filter resolves to a range scan over its index; the candidate
  // sets are intersected when several filters are supplied. Only a query with
  // no index-backed filter falls back to a full scan of the token store.
  const indexPrefixes: string[] = [];
  if (input.status && input.status !== 'ALL') indexPrefixes.push(`idx:status:${input.status}:`);
  if (input.district) indexPrefixes.push(`idx:district:${input.district}:`);
  if (input.species) indexPrefixes.push(`idx:species:${input.species}:`);
  if (input.planterId) indexPrefixes.push(`idx:planter:${input.planterId}:`);

  let ids: string[];
  if (indexPrefixes.length) {
    const candidateSets: Set<string>[] = [];
    for (const prefix of indexPrefixes) {
      const rows = await stub.getStateByRange(prefix);
      candidateSets.push(
        new Set(rows.map((r) => r.value?.tokenId ?? String(r.key).split(':').pop())),
      );
    }
    ids = [
      ...candidateSets.reduce(
        (acc, set) => new Set([...acc].filter((id) => set.has(id))),
      ),
    ];
  } else {
    const rows = await stub.getStateByRange('token:');
    ids = rows
      .filter((r) => !r.key.startsWith('token~idx'))
      .map((r) => r.value.tokenId);
  }

  const tokens: TreeToken[] = [];
  for (const id of ids) {
    const t = (await stub.getState(KEY.token(id))) as TreeToken | null;
    if (!t) continue;
    // The index is authoritative for the equality filters; these guards keep
    // the result correct even if an index entry were ever missing.
    if (input.district && t.district !== input.district) continue;
    if (input.species && t.species !== input.species) continue;
    if (input.planterId && t.planterId !== input.planterId) continue;
    if (input.q) {
      const needle = input.q.toLowerCase();
      const hay = `${t.tokenId} ${t.planterName} ${t.district} ${t.species} ${t.state}`.toLowerCase();
      if (!hay.includes(needle)) continue;
    }
    tokens.push(t);
  }
  tokens.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { ok: true, message: '', data: tokens };
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  orgName: string;
  tokens: number;
  co2Kg: number;
  fundsReceived: number;
  trees: number;
}

export async function GetLeaderboard(stub: ChaincodeStub): Promise<ChaincodeResult<LeaderboardEntry[]>> {
  const rows = await stub.getStateByRange('token:');
  const byPlanter = new Map<string, LeaderboardEntry>();

  for (const r of rows) {
    if (r.key.startsWith('token~idx')) continue;
    const t = r.value as TreeToken;
    if (t.status === 'REJECTED') continue;
    const entry = byPlanter.get(t.planterId) ?? {
      id: t.planterId,
      name: t.planterName,
      orgName: t.planterOrg,
      tokens: 0,
      co2Kg: 0,
      fundsReceived: 0,
      trees: 0,
    };
    entry.tokens += 1;
    entry.trees += t.count;
    entry.co2Kg += t.estimatedCo2Kg;
    byPlanter.set(t.planterId, entry);
  }

  const invoices = await stub.getStateByRange('invoice:');
  for (const r of invoices) {
    if (r.key.startsWith('invoice~idx')) continue;
    const inv = r.value as FundingInvoice;
    if (inv.status !== 'SETTLED') continue;
    for (const tokenId of inv.tokenIds) {
      const t = (await stub.getState(KEY.token(tokenId))) as TreeToken | null;
      if (!t) continue;
      const entry = byPlanter.get(t.planterId);
      if (entry) {
        entry.fundsReceived += Math.round(inv.netAmount / inv.tokenIds.length);
      }
    }
  }

  const list = [...byPlanter.values()].sort(
    (a, b) => b.co2Kg - a.co2Kg || b.tokens - a.tokens,
  );
  return { ok: true, message: '', data: list };
}

export interface Stats {
  blockHeight: number;
  totalTokens: number;
  verifiedTokens: number;
  pendingTokens: number;
  fundedTokens: number;
  rejectedTokens: number;
  totalCo2Kg: number;
  totalFunding: number;
  totalTrees: number;
}

export async function GetStats(stub: ChaincodeStub): Promise<ChaincodeResult<Stats>> {
  const rows = await stub.getStateByRange('token:');
  const tokens = rows.filter((r) => !r.key.startsWith('token~idx')).map((r) => r.value as TreeToken);

  const invoices = (await stub.getStateByRange('invoice:'))
    .filter((r) => !r.key.startsWith('invoice~idx'))
    .map((r) => r.value as FundingInvoice);

  const funded = tokens.filter((t) => t.status === 'FUNDED');
  const stats: Stats = {
    blockHeight: stub.getBlockNumber(),
    totalTokens: tokens.length,
    verifiedTokens: tokens.filter((t) => t.status === 'VERIFIED').length,
    pendingTokens: tokens.filter((t) => t.status === 'PENDING').length,
    fundedTokens: funded.length,
    rejectedTokens: tokens.filter((t) => t.status === 'REJECTED').length,
    totalCo2Kg: tokens.filter((t) => t.status !== 'REJECTED').reduce((s, t) => s + t.estimatedCo2Kg, 0),
    totalFunding: invoices
      .filter((i) => i.status === 'SETTLED')
      .reduce((s, i) => s + i.netAmount, 0),
    totalTrees: tokens.filter((t) => t.status !== 'REJECTED').reduce((s, t) => s + t.count, 0),
  };
  return { ok: true, message: '', data: stats };
}

export async function GetInvoice(
  stub: ChaincodeStub,
  invoiceId: string,
): Promise<ChaincodeResult<FundingInvoice>> {
  const inv = (await stub.getState(KEY.invoice(invoiceId))) as FundingInvoice | null;
  if (!inv) return { ok: false, message: `Invoice ${invoiceId} not found.` };
  return { ok: true, message: '', data: inv };
}

export async function GetAllInvoices(stub: ChaincodeStub): Promise<ChaincodeResult<FundingInvoice[]>> {
  const invoices = (await stub.getStateByRange('invoice:'))
    .filter((r) => !r.key.startsWith('invoice~idx'))
    .map((r) => r.value as FundingInvoice)
    .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  return { ok: true, message: '', data: invoices };
}

/** Exposed so hosts can produce a stable payload hash for a transaction. */
export function hashPayload(payload: unknown) {
  return hashJson(canonicalize(payload));
}
