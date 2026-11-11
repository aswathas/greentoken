/**
 * GreenToken — Hyperledger Fabric chaincode (TypeScript, Fabric v2.5).
 *
 * The business logic lives in `chaincode/src/domain.ts`, which is a byte-for-byte
 * copy of the module the browser demo runs (`src/core/chaincode.ts`). This file
 * is only the *adapter*: it binds the Fabric `Context` to the platform-free
 * `ChaincodeStub` interface that the domain code expects.
 *
 * API notes (fabric-contract-api@2.5.8):
 *   - `Context`, `Contract`, `Transaction`, `Object`, `Property` and `Info` are
 *     exported by `fabric-contract-api` — `fabric-shim` only exports the low
 *     level `ChaincodeInterface`/`Shim` API and has no contract decorators.
 *   - `@Transaction()` marks a *write* transaction (tag `SUBMIT`),
 *     `@Transaction(false)` marks a read-only query (tag `EVALUATE`).
 *   - `@Info({...})` is a class decorator that publishes the contract metadata.
 *   - `ctx.stub` is a `fabric-shim-api` `ChaincodeStub`: `getState`/`putState`
 *     deal in `Uint8Array`, a key is removed with `deleteState` (Fabric v2 has
 *     no `delState`) and `getStateByRange` returns an async iterable of
 *     `{key, value}` records.
 *
 * Deploy to a real Fabric network with:
 *   ./network/deploy.sh
 */

import 'reflect-metadata';

import {
  Context,
  Contract,
  Info,
  // Aliased: the decorator is called `Object` upstream, which would shadow the
  // global `Object` (and with it `Object.keys`).
  Object as FabricObject,
  Property,
  Transaction,
} from 'fabric-contract-api';
import type { ChaincodeStub as FabricChaincodeStub } from 'fabric-shim-api';
import {
  ChaincodeStub,
  CallerContext,
  PlantTree,
  VerifyPlanting,
  FundTokens,
  SettleFunding,
  GetToken,
  SearchTokens,
  GetLeaderboard,
  GetStats,
  GetInvoice,
  GetAllInvoices,
  ORG_NAMES,
  MSP_TO_ORG,
} from './domain';
import type { OrgId, TokenStatus } from './types';

/* ------------------------------------------------------------------ *
 * Transaction argument DTOs
 *
 * `fabric-contract-api` derives the JSON schema of a transaction parameter
 * from the *runtime* type of that parameter (`design:paramtypes`). An
 * interface has no runtime representation — it is erased to `Object` — and
 * the `@Transaction()` decorator rejects `Object` parameters outright
 * ("can not process pure Object types"). The DTO classes below therefore
 * give the object-valued transactions a real runtime type (and a JSON
 * schema) while staying structurally identical to the platform-free
 * domain types they are handed to.
 * ------------------------------------------------------------------ */

@FabricObject()
export class GeoStampDTO {
  @Property() lat: number;
  @Property() lng: number;
  @Property() accuracyMeters: number;
  @Property() capturedAt: string;
}

@FabricObject()
export class PhotoProofDTO {
  @Property() sha256: string;
  @Property() byteLength: number;
  @Property() mimeType: string;
  @Property() dataUrl?: string;
}

@FabricObject()
export class PlantTreeDTO {
  @Property() planterId: string;
  @Property() planterName: string;
  @Property() planterOrg: string;
  @Property() district: string;
  @Property() state: string;
  @Property() species: string;
  @Property() count: number;
  @Property() geo: GeoStampDTO;
  @Property() photo: PhotoProofDTO;
  @Property() privateContact: string;
}

@FabricObject()
export class VerifyPlantingDTO {
  @Property() tokenId: string;
  @Property() verdict: 'APPROVE' | 'REJECT';
  @Property() note: string;
}

@FabricObject()
export class FundTokensDTO {
  @Property('tokenIds', 'string[]') tokenIds: string[];
  @Property() units: number;
  @Property() pricePerToken: number;
  @Property() funderId: string;
  @Property() funderName: string;
}

@FabricObject()
export class SearchTokensDTO {
  @Property() status?: TokenStatus | 'ALL';
  @Property() district?: string;
  @Property() species?: string;
  @Property() planterId?: string;
  @Property() q?: string;
}

/* ------------------------------------------------------------------ *
 * Fabric -> ChaincodeStub adapter
 * ------------------------------------------------------------------ */

class FabricStub implements ChaincodeStub {
  constructor(private ctx: Context) {}

  async getState(key: string) {
    const res = await this.ctx.stub.getState(key);
    if (!res || res.length === 0) return null;
    const text = Buffer.from(res).toString('utf8');
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  async putState(key: string, value: unknown) {
    await this.ctx.stub.putState(key, Buffer.from(JSON.stringify(value)));
  }

  /**
   * `fabric-shim-api` returns an async iterable of `{key, value}` records for
   * the half-open key range `[startKey, endKey)`. The domain layer asks for a
   * *prefix* scan, so the range ends at the prefix followed by U+FFFF — the
   * highest code point, which makes the range cover exactly the keys that
   * start with the prefix (and nothing else).
   */
  async getStateByRange(prefix: string) {
    const out: { key: string; value: any }[] = [];
    const range = this.ctx.stub.getStateByRange(prefix, `${prefix}\uffff`);
    for await (const kv of range) {
      const value = kv.value && kv.value.length ? JSON.parse(Buffer.from(kv.value).toString('utf8')) : null;
      out.push({ key: kv.key, value });
    }
    return out;
  }

  async deleteState(key: string) {
    // Fabric v2 removed the v1 `delState`; the key is removed with `deleteState`.
    await this.ctx.stub.deleteState(key);
  }

  async emitEvent(name: string, payload: unknown) {
    // `setEvent` is synchronous in fabric-shim-api — it stages the event on the
    // transaction proposal, so there is nothing to await.
    this.ctx.stub.setEvent(name, Buffer.from(JSON.stringify(payload)));
  }

  getMSPID(): string {
    return this.ctx.clientIdentity.getMSPID();
  }

  getAttributeValue(name: string): string | null {
    const v = this.ctx.clientIdentity.getAttributeValue(name);
    if (!v) return null;
    return Buffer.from(v).toString();
  }

  getTxID(): string {
    return this.ctx.stub.getTxID();
  }

  getBlockNumber(): number {
    // `fabric-shim` 2.5 does not expose the ledger height to chaincode, so the
    // height is reported as 0 unless the shim in use happens to provide it.
    const stub = this.ctx.stub as FabricChaincodeStub & { getBlockNumber?: () => number };
    return typeof stub.getBlockNumber === 'function' ? stub.getBlockNumber() : 0;
  }

  /**
   * Fabric signs transactions at the MSP level, so the chaincode does not need
   * to sign endorsement payloads itself — the peer's endorsement signature is
   * the cryptographic proof. The stub therefore exposes no signing key.
   */
  getSignerKeys(): null {
    return null;
  }
}

/** Resolve the caller's organisation and display identity from the MSP. */
function callerOf(ctx: Context): CallerContext {
  const mspId = ctx.clientIdentity.getMSPID();
  const org = (MSP_TO_ORG[mspId] ?? 'PLANTER') as OrgId;
  const name = Buffer.from(ctx.clientIdentity.getAttributeValue('name') ?? '').toString() || 'Anonymous';
  const id = Buffer.from(ctx.clientIdentity.getAttributeValue('participantId') ?? '').toString() || 'unknown';
  return { org, name, id, orgName: ORG_NAMES[org] };
}

/* ------------------------------------------------------------------ *
 * Contract
 * ------------------------------------------------------------------ */

@Info({ title: 'greentoken', version: '1.0.0', description: 'Verifiable blue-green carbon tokens' })
export class GreenTokenContract extends Contract {
  constructor() {
    // The contract name is what a client uses to address it
    // (`greentoken:WhoAmI`); the bare function name works too because this is
    // the default contract of the chaincode.
    super('greentoken');
  }

  /**
   * Seeds the ledger counters. Kept as a plain helper so the logic stays in
   * one place — the Fabric entry point is the `Init` transaction below.
   */
  async initStub(ctx: Context): Promise<void> {
    await ctx.stub.putState('meta:tokenSeq', Buffer.from('0'));
    await ctx.stub.putState('meta:invoiceSeq', Buffer.from('0'));
    ctx.stub.setEvent('Init', Buffer.from(JSON.stringify({ channel: ctx.stub.getChannelID() })));
  }

  /* ---------------- lifecycle ---------------- */

  /** Chaincode instantiation entry point (`--init-arg Init`). */
  @Transaction()
  async Init(ctx: Context): Promise<void> {
    await this.initStub(ctx);
  }

  /* ---------------- writes ---------------- */

  @Transaction()
  async PlantTree(ctx: Context, input: PlantTreeDTO): Promise<string> {
    const stub = new FabricStub(ctx);
    const res = await PlantTree(stub, input);
    if (!res.ok) throw new Error(res.message);
    return JSON.stringify(res.data);
  }

  @Transaction()
  async VerifyPlanting(ctx: Context, input: VerifyPlantingDTO): Promise<string> {
    const stub = new FabricStub(ctx);
    const res = await VerifyPlanting(stub, input);
    if (!res.ok) throw new Error(res.message);
    return JSON.stringify(res.data);
  }

  @Transaction()
  async FundTokens(ctx: Context, input: FundTokensDTO): Promise<string> {
    const stub = new FabricStub(ctx);
    const res = await FundTokens(stub, input);
    if (!res.ok) throw new Error(res.message);
    return JSON.stringify(res.data);
  }

  @Transaction()
  async SettleFunding(ctx: Context, invoiceId: string): Promise<string> {
    const stub = new FabricStub(ctx);
    const res = await SettleFunding(stub, invoiceId);
    if (!res.ok) throw new Error(res.message);
    return JSON.stringify(res.data);
  }

  /* ---------------- reads ---------------- */

  @Transaction(false)
  async GetToken(ctx: Context, tokenId: string): Promise<string> {
    const res = await GetToken(new FabricStub(ctx), tokenId);
    if (!res.ok) throw new Error(res.message);
    return JSON.stringify(res.data);
  }

  @Transaction(false)
  async SearchTokens(ctx: Context, input: SearchTokensDTO): Promise<string> {
    const res = await SearchTokens(new FabricStub(ctx), input);
    return JSON.stringify(res.data ?? []);
  }

  @Transaction(false)
  async GetLeaderboard(ctx: Context): Promise<string> {
    const res = await GetLeaderboard(new FabricStub(ctx));
    return JSON.stringify(res.data ?? []);
  }

  @Transaction(false)
  async GetStats(ctx: Context): Promise<string> {
    const res = await GetStats(new FabricStub(ctx));
    return JSON.stringify(res.data ?? {});
  }

  @Transaction(false)
  async GetInvoice(ctx: Context, invoiceId: string): Promise<string> {
    const res = await GetInvoice(new FabricStub(ctx), invoiceId);
    if (!res.ok) throw new Error(res.message);
    return JSON.stringify(res.data);
  }

  @Transaction(false)
  async GetAllInvoices(ctx: Context): Promise<string> {
    const res = await GetAllInvoices(new FabricStub(ctx));
    return JSON.stringify(res.data ?? []);
  }

  /** Echo the caller's identity — proves the MSP attributes are wired up. */
  @Transaction(false)
  async WhoAmI(ctx: Context): Promise<string> {
    return JSON.stringify(callerOf(ctx));
  }
}

/* ------------------------------------------------------------------ *
 * Exports
 * ------------------------------------------------------------------ */

/** A ready-to-use instance of the contract. */
export const greentokenContract = new GreenTokenContract();

/**
 * Named registry of the contracts in this chaincode.
 *
 * NOTE: the Fabric 2.5 bootstrap (`fabric-shim`'s `ChaincodeFromContract`)
 * creates the contract instances itself and therefore wants an **array of
 * contract classes** — `src/index.ts`, the package entry point, exports that.
 */
export const contracts: { [key: string]: Contract } = {
  greentoken: greentokenContract,
};

export const chains = Object.keys(contracts);
