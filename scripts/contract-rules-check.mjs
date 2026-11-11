/**
 * Contract rules check — exercises the GreenToken smart contract's business
 * rules directly against the compiled domain code (no browser, no UI).
 *
 * `scripts/verify.mjs` drives the demo end to end in Chromium; it cannot
 * easily reach rules that the UI never exposes (a forged unit count, a forged
 * price, a second endorsement from the same organisation, a rejected token
 * being re-reviewed, the same photo backing two tokens). This script does
 * reach them, by driving `src/core/chaincode.ts` through a minimal
 * `ChaincodeStub` — the same interface the browser, the Cloudflare Worker and
 * the Fabric chaincode all implement.
 *
 * Usage:
 *     node scripts/contract-rules-check.mjs
 *
 * Exits non-zero if any rule is broken.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* ------------------------------------------------------------------ *
 * Bundle the platform-free domain so plain Node can import it
 * ------------------------------------------------------------------ */

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'greentoken-rules-'));
const entry = path.join(TMP, 'entry.ts');
fs.writeFileSync(
  entry,
  [
    `export * from '${path.join(ROOT, 'src/core/chaincode.ts').replace(/\\/g, '/')}';`,
    `export * from '${path.join(ROOT, 'src/core/ledger.ts').replace(/\\/g, '/')}';`,
    `export * from '${path.join(ROOT, 'src/core/seed.ts').replace(/\\/g, '/')}';`,
    `export * from '${path.join(ROOT, 'src/core/crypto.ts').replace(/\\/g, '/')}';`,
  ].join('\n'),
);
const bundle = path.join(TMP, 'domain.mjs');
execFileSync(
  path.join(ROOT, 'node_modules/.bin/esbuild'),
  [entry, '--bundle', '--format=esm', '--platform=node', '--log-level=error', `--outfile=${bundle}`],
  { stdio: ['ignore', 'ignore', 'inherit'] },
);
const domain = await import(pathToFileURL(bundle).href);
const {
  PlantTree,
  VerifyPlanting,
  FundTokens,
  GetToken,
  SearchTokens,
  KEY,
  BASE_PRICE_INR,
  GreenTokenLedger,
  buildSeededLedger,
  generateKeyPair,
} = domain;

/* ------------------------------------------------------------------ *
 * Test harness
 * ------------------------------------------------------------------ */

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}

const CALLERS = {
  planter: {
    org: 'PLANTER',
    name: 'Lakshmi Gowda',
    id: 'p-lakshmi',
    orgName: 'Sahyadri Planters Association',
  },
  raghavan: {
    org: 'VERIFIER',
    name: 'Dr. S. Raghavan',
    id: 'v-raghavan',
    orgName: 'State Forest Department',
  },
  desh: {
    org: 'VERIFIER',
    name: 'Anjali Deshmukh',
    id: 'v-desh',
    orgName: 'State Forest Department',
  },
  kapoor: {
    org: 'AUDITOR',
    name: 'Nikhil Kapoor',
    id: 'a-kapoor',
    orgName: 'Independent Carbon Auditor',
  },
  funder: {
    org: 'FUNDER',
    name: 'Aarav Menon',
    id: 'f-tata',
    orgName: 'Corporate Green Funders',
  },
};

const MSP = {
  PLANTER: 'PlantersAssociationMSP',
  VERIFIER: 'ForestDeptMSP',
  FUNDER: 'CorporateFundersMSP',
  AUDITOR: 'AuditorMSP',
};

/** Minimal in-memory ChaincodeStub — records every range scan it performs. */
class TestStub {
  constructor(state, caller) {
    this.state = state;
    this.caller = caller;
    this.scans = [];
    this.events = [];
  }
  async getState(key) {
    return this.state.has(key) ? this.state.get(key) : null;
  }
  async putState(key, value) {
    this.state.set(key, value);
  }
  async deleteState(key) {
    this.state.delete(key);
  }
  async getStateByRange(prefix) {
    this.scans.push(prefix);
    const out = [];
    for (const key of [...this.state.keys()].sort()) {
      if (key.startsWith(prefix)) out.push({ key, value: this.state.get(key) });
    }
    return out;
  }
  async emitEvent(name, payload) {
    this.events.push({ name, payload });
  }
  getMSPID() {
    return MSP[this.caller.org];
  }
  getAttributeValue(name) {
    if (name === 'name') return this.caller.name;
    if (name === 'participantId') return this.caller.id;
    return null;
  }
  getTxID() {
    return `tx-test-${this.caller.id}`;
  }
  getBlockNumber() {
    return 1;
  }
  getSignerKeys() {
    return null;
  }
}

function makeWorld() {
  const state = new Map();
  const stubFor = (who) => new TestStub(state, CALLERS[who]);
  return { state, stubFor };
}

let photoCounter = 0;
function plantInput(overrides = {}) {
  photoCounter += 1;
  return {
    planterId: CALLERS.planter.id,
    planterName: CALLERS.planter.name,
    planterOrg: CALLERS.planter.orgName,
    district: 'Mandya',
    state: 'Karnataka',
    species: 'Mango',
    count: 12,
    geo: {
      lat: 12.5218,
      lng: 76.8951,
      accuracyMeters: 8,
      capturedAt: new Date('2026-01-05T09:00:00.000Z').toISOString(),
    },
    photo: {
      sha256: `photo-hash-${String(photoCounter).padStart(4, '0')}`,
      byteLength: 2048,
      mimeType: 'image/jpeg',
    },
    ...overrides,
  };
}

async function plant(who, overrides = {}) {
  const world = makeWorld();
  const res = await PlantTree(world.stubFor(who), plantInput(overrides));
  return { ...res, world };
}

/* ------------------------------------------------------------------ *
 * FIX 1 — quorum must span distinct organisations
 * ------------------------------------------------------------------ */

console.log('\n▶ FIX 1 — quorum spans distinct organisations');

{
  // Two different people from the SAME organisation must not mint the token.
  const { world, stubFor } = makeWorld();
  const planted = await PlantTree(stubFor('planter'), plantInput());
  const tokenId = planted.data.tokenId;

  const first = await VerifyPlanting(stubFor('raghavan'), {
    tokenId,
    verdict: 'APPROVE',
    note: 'Forest Department check.',
  });
  const second = await VerifyPlanting(stubFor('desh'), {
    tokenId,
    verdict: 'APPROVE',
    note: 'Second Forest Department check.',
  });
  const token = (await GetToken(stubFor('raghavan'), tokenId)).data;

  check(
    'same-organisation pair is refused',
    second.ok === false && /Forest Department has already reviewed this token/i.test(second.message),
    second.message,
  );
  check(
    'token stays PENDING after two same-org reviews',
    token.status === 'PENDING',
    `status=${token.status}, endorsements=${token.endorsements.length}`,
  );
  check(
    'quorum message names the required organisation count',
    /Quorum requires endorsements from 2 different organisations/i.test(first.message),
    first.message,
  );
}

{
  // Forest Department + Independent Auditor -> VERIFIED.
  const { world, stubFor } = makeWorld();
  const planted = await PlantTree(stubFor('planter'), plantInput());
  const tokenId = planted.data.tokenId;

  await VerifyPlanting(stubFor('raghavan'), { tokenId, verdict: 'APPROVE', note: 'Forest Dept.' });
  const second = await VerifyPlanting(stubFor('kapoor'), {
    tokenId,
    verdict: 'APPROVE',
    note: 'Auditor check.',
  });
  const token = (await GetToken(stubFor('raghavan'), tokenId)).data;

  check('two organisations reach quorum', second.ok === true && token.status === 'VERIFIED', second.message);
  check(
    'quorum counted two distinct organisations',
    new Set(token.endorsements.map((e) => e.org)).size === 2,
    token.endorsements.map((e) => `${e.orgName}:${e.verdict}`).join(', '),
  );
}

{
  // Legacy state: two approvals from one organisation must never certify.
  const world = makeWorld();
  const planted = await PlantTree(world.stubFor('planter'), plantInput());
  const tokenId = planted.data.tokenId;
  const token = planted.data;
  token.endorsements = [
    { by: 'v-raghavan', org: 'VERIFIER', orgName: 'State Forest Department', verdict: 'APPROVE', note: '', endorsedAt: new Date().toISOString(), signature: 'x' },
    { by: 'v-desh', org: 'VERIFIER', orgName: 'State Forest Department', verdict: 'APPROVE', note: '', endorsedAt: new Date().toISOString(), signature: 'y' },
  ];
  await world.stubFor('planter').putState(KEY.token(tokenId), token);

  const res = await VerifyPlanting(world.stubFor('kapoor'), { tokenId, verdict: 'APPROVE', note: '' });
  check(
    'single-organisation quorum in state is refused',
    res.ok === false && /Quorum requires endorsements from 2 different organisations/i.test(res.message),
    res.message,
  );
}

/* ------------------------------------------------------------------ *
 * FIX 2 — rejection is terminal
 * ------------------------------------------------------------------ */

console.log('\n▶ FIX 2 — rejection is terminal');

{
  const { world, stubFor } = makeWorld();
  const planted = await PlantTree(stubFor('planter'), plantInput());
  const tokenId = planted.data.tokenId;

  const rejected = await VerifyPlanting(stubFor('raghavan'), {
    tokenId,
    verdict: 'REJECT',
    note: 'Photo does not match the parcel.',
  });
  const reReview = await VerifyPlanting(stubFor('kapoor'), { tokenId, verdict: 'APPROVE', note: '' });
  const fund = await FundTokens(stubFor('funder'), {
    tokenIds: [tokenId],
    units: 12,
    pricePerToken: BASE_PRICE_INR,
    funderId: CALLERS.funder.id,
    funderName: CALLERS.funder.name,
  });
  const token = (await GetToken(stubFor('planter'), tokenId)).data;

  check('rejection is recorded', rejected.ok === true && token.status === 'REJECTED', token.status);
  check(
    'rejected token refuses further endorsement',
    reReview.ok === false && /was rejected and cannot be re-reviewed/i.test(reReview.message),
    reReview.message,
  );
  check(
    'rejected token refuses funding',
    fund.ok === false && /only VERIFIED tokens can be funded/i.test(fund.message),
    fund.message,
  );
}

/* ------------------------------------------------------------------ *
 * FIX 3 — one photo, one token
 * ------------------------------------------------------------------ */

console.log('\n▶ FIX 3 — duplicate photo proof is rejected');

{
  const world = makeWorld();
  const hash = 'a-reused-photo-hash';
  const first = await PlantTree(world.stubFor('planter'), plantInput({ photo: { sha256: hash, byteLength: 10, mimeType: 'image/jpeg' } }));
  const second = await PlantTree(world.stubFor('planter'), plantInput({ photo: { sha256: hash, byteLength: 10, mimeType: 'image/jpeg' } }));

  check(
    'duplicate photo is refused',
    second.ok === false && /already been submitted for token GT-\d{6}/i.test(second.message),
    second.message,
  );
  check(
    'photo index entry points at the first token',
    world.state.get(KEY.photoIndex(hash, first.data.tokenId))?.tokenId === first.data.tokenId,
    KEY.photoIndex(hash, first.data.tokenId),
  );
  check(
    'only one token carries that photo',
    [...world.state.keys()].filter((k) => k.startsWith(`idx:photo:${hash}:`)).length === 1,
  );
}

/* ------------------------------------------------------------------ *
 * FIX 4 — funding quantity and price are contract-controlled
 * ------------------------------------------------------------------ */

console.log('\n▶ FIX 4 — funding quantity and price are validated');

{
  const world = makeWorld();
  const planted = await PlantTree(world.stubFor('planter'), plantInput({ count: 12 }));
  const tokenId = planted.data.tokenId;
  await VerifyPlanting(world.stubFor('raghavan'), { tokenId, verdict: 'APPROVE', note: '' });
  await VerifyPlanting(world.stubFor('kapoor'), { tokenId, verdict: 'APPROVE', note: '' });

  const wrongUnits = await FundTokens(world.stubFor('funder'), {
    tokenIds: [tokenId],
    units: 500,
    pricePerToken: BASE_PRICE_INR,
    funderId: CALLERS.funder.id,
    funderName: CALLERS.funder.name,
  });
  check(
    'mismatched unit count is refused',
    wrongUnits.ok === false && /Declared 500 units but the basket contains 12 trees/i.test(wrongUnits.message),
    wrongUnits.message,
  );

  const wrongPrice = await FundTokens(world.stubFor('funder'), {
    tokenIds: [tokenId],
    units: 12,
    pricePerToken: 999,
    funderId: CALLERS.funder.id,
    funderName: CALLERS.funder.name,
  });
  check(
    'client-supplied price is refused',
    wrongPrice.ok === false && /Price per token is fixed by the contract at ₹150/i.test(wrongPrice.message),
    wrongPrice.message,
  );

  const good = await FundTokens(world.stubFor('funder'), {
    tokenIds: [tokenId],
    units: 12,
    pricePerToken: BASE_PRICE_INR,
    funderId: CALLERS.funder.id,
    funderName: CALLERS.funder.name,
  });
  check(
    'matching basket is priced by the contract',
    good.ok === true &&
      good.data.units === 12 &&
      good.data.pricePerToken === BASE_PRICE_INR &&
      good.data.netAmount === 12 * BASE_PRICE_INR,
    good.ok ? `net ₹${good.data.netAmount}, ${good.data.discountPct}% discount` : good.message,
  );
}

/* ------------------------------------------------------------------ *
 * FIX 5 — the status index never goes stale
 * ------------------------------------------------------------------ */

console.log('\n▶ FIX 5 — the status index is maintained');

{
  const world = makeWorld();
  const planted = await PlantTree(world.stubFor('planter'), plantInput());
  const tokenId = planted.data.tokenId;
  await VerifyPlanting(world.stubFor('raghavan'), { tokenId, verdict: 'APPROVE', note: '' });
  await VerifyPlanting(world.stubFor('kapoor'), { tokenId, verdict: 'APPROVE', note: '' });

  const pendingGone = !world.state.has(KEY.tokenByStatus('PENDING', tokenId));
  const verifiedThere = world.state.has(KEY.tokenByStatus('VERIFIED', tokenId));

  await FundTokens(world.stubFor('funder'), {
    tokenIds: [tokenId],
    units: 12,
    pricePerToken: BASE_PRICE_INR,
    funderId: CALLERS.funder.id,
    funderName: CALLERS.funder.name,
  });

  const verifiedGone = !world.state.has(KEY.tokenByStatus('VERIFIED', tokenId));
  const fundedThere = world.state.has(KEY.tokenByStatus('FUNDED', tokenId));
  const statusEntries = [...world.state.keys()].filter((k) => k.startsWith(`idx:status:`) && k.endsWith(tokenId));

  check('PENDING index entry removed on verification', pendingGone && verifiedThere);
  check('VERIFIED index entry removed on funding', verifiedGone && fundedThere);
  check('exactly one status index entry per token', statusEntries.length === 1, statusEntries.join(', '));
}

/* ------------------------------------------------------------------ *
 * FIX 6 — the composite-key indexes are read
 * ------------------------------------------------------------------ */

console.log('\n▶ FIX 6 — SearchTokens uses the indexes');

{
  const world = makeWorld();
  const a = await PlantTree(world.stubFor('planter'), plantInput({ district: 'Mandya', species: 'Mango' }));
  const b = await PlantTree(world.stubFor('planter'), plantInput({ district: 'Nashik', species: 'Teak' }));

  const stub = world.stubFor('planter');
  stub.scans = [];
  const byDistrict = await SearchTokens(stub, { district: 'Mandya' });
  const scans = [...stub.scans];

  check(
    'district filter scans the district index',
    scans.includes('idx:district:Mandya:'),
    scans.join(', '),
  );
  check(
    'district filter does not fall back to a full scan',
    !scans.includes('token:'),
    scans.join(', '),
  );
  check(
    'district filter returns the right token',
    byDistrict.ok === true &&
      byDistrict.data.length === 1 &&
      byDistrict.data[0].tokenId === a.data.tokenId,
    byDistrict.data.map((t) => t.tokenId).join(', '),
  );

  const stub2 = world.stubFor('planter');
  stub2.scans = [];
  const intersected = await SearchTokens(stub2, { district: 'Nashik', species: 'Teak' });
  check(
    'two filters intersect their index sets',
    intersected.data.length === 1 && intersected.data[0].tokenId === b.data.tokenId,
    intersected.data.map((t) => t.tokenId).join(', '),
  );

  const stub3 = world.stubFor('planter');
  stub3.scans = [];
  const mismatch = await SearchTokens(stub3, { district: 'Nashik', species: 'Mango' });
  check(
    'intersection of two indexes can be empty',
    mismatch.data.length === 0,
    `${mismatch.data.length} token(s)`,
  );

  const stub4 = world.stubFor('planter');
  stub4.scans = [];
  const freeText = await SearchTokens(stub4, { q: 'teak' });
  check(
    'free-text filter still applies in memory',
    freeText.data.length === 1 && freeText.data[0].tokenId === b.data.tokenId,
    freeText.data.map((t) => t.tokenId).join(', '),
  );
}

/* ------------------------------------------------------------------ *
 * FIX 7 — the planter's contact is never shared state
 * ------------------------------------------------------------------ */

console.log('\n▶ FIX 7 — the planter\'s contact never leaves the client');

{
  const CONTACT = '+91 98765 43210';
  const world = makeWorld();
  const planted = await PlantTree(
    world.stubFor('planter'),
    plantInput({ privateContact: CONTACT }),
  );
  const tokenId = planted.data.tokenId;

  const token = (await GetToken(world.stubFor('planter'), tokenId)).data;
  const found = await SearchTokens(world.stubFor('planter'), { q: 'Mango' });
  const stateJson = JSON.stringify([...world.state.entries()]);

  check('GetToken output carries no privateContact', !('privateContact' in token));
  check(
    'GetToken output carries no contact number',
    !JSON.stringify(token).includes('98765 43210'),
  );
  check(
    'SearchTokens output carries no privateContact',
    !JSON.stringify(found.data).includes('privateContact') &&
      !JSON.stringify(found.data).includes('98765 43210'),
  );
  check('world state carries no privateContact', !stateJson.includes('privateContact'));
  check('world state carries no contact number', !stateJson.includes('98765 43210'));
}

{
  // The same guarantee at ledger level: no state entry, no transaction payload,
  // no payload hash input.
  const CONTACT = '+91 98765 43210';
  const ledger = new GreenTokenLedger();
  await ledger.init();
  const keys = await generateKeyPair();
  ledger.addParticipant({
    id: CALLERS.planter.id,
    name: CALLERS.planter.name,
    org: 'PLANTER',
    orgName: CALLERS.planter.orgName,
    role: 'FPO Coordinator',
    publicKey: keys.publicKey,
    privateKey: keys.privateKey,
  });
  await ledger.plantTree(CALLERS.planter, plantInput({ privateContact: CONTACT }));

  const exported = ledger.exportState();
  const stateJson = JSON.stringify(exported.state);
  const payloads = ledger.blocks.flatMap((b) => b.txs.map((t) => t.payload));

  check(
    'ledger world state carries no contact number',
    !stateJson.includes('98765 43210') && !stateJson.includes('privateContact'),
  );
  check(
    'ledger transaction payload carries no contact number',
    payloads.length > 0 &&
      !JSON.stringify(payloads).includes('98765 43210') &&
      !JSON.stringify(payloads).includes('privateContact'),
  );
  check(
    'ledger payload hash is computed over the stripped payload',
    ledger.blocks.every((b) =>
      b.txs.every((t) => !JSON.stringify(t.payload).includes('privateContact')),
    ),
  );
}

/* ------------------------------------------------------------------ *
 * Seed data — quorum pairs, invoices and the rejected token
 * ------------------------------------------------------------------ */

console.log('\n▶ Seed data');

{
  const ledger = await buildSeededLedger();
  const tokens = await ledger.getAllTokens();
  const invoices = await ledger.getAllInvoicesRaw();

  const verified = tokens.filter((t) => t.status === 'VERIFIED' || t.status === 'FUNDED');
  const badQuorum = verified.filter((t) => {
    const orgs = new Set(t.endorsements.filter((e) => e.verdict === 'APPROVE').map((e) => e.org));
    return orgs.size < 2;
  });
  check(
    'every verified seed token has two distinct reviewing organisations',
    badQuorum.length === 0,
    badQuorum.map((t) => t.tokenId).join(', ') || `${verified.length} token(s) checked`,
  );

  const rejected = tokens.filter((t) => t.status === 'REJECTED');
  check(
    'one seed token is rejected',
    rejected.length === 1,
    rejected.map((t) => `${t.tokenId} (${t.planterName})`).join(', '),
  );
  check(
    'the rejected seed token was rejected by the Forest Department',
    rejected.length === 1 && rejected[0].endorsements.every((e) => e.org === 'VERIFIER'),
    rejected[0]?.endorsements.map((e) => e.orgName).join(', '),
  );
  check(
    'the rejection note states the reviewer\'s judgement, not a threshold rule',
    rejected.length === 1 &&
      !/50 m tolerance/i.test(rejected[0].endorsements[0]?.note ?? '') &&
      /320 m/.test(rejected[0].endorsements[0]?.note ?? ''),
    rejected[0]?.endorsements[0]?.note,
  );

  const nets = invoices.map((i) => i.netAmount).sort((a, b) => a - b);
  check(
    'the individual invoices are still ₹1,800 and ₹3,750',
    invoices.some((i) => i.netAmount === 1800) && invoices.some((i) => i.netAmount === 3750),
    nets.join(', '),
  );
  const bulk = invoices.find((i) => i.units === 70);
  check(
    'the 70-tree bulk purchase still gets the 5% tier',
    !!bulk && bulk.discountPct === 5 && bulk.netAmount === 9975,
    bulk ? `${bulk.units} units, ${bulk.discountPct}% -> ₹${bulk.netAmount}` : 'not found',
  );

  const stateJson = JSON.stringify(ledger.exportState().state);
  check(
    'no seeded phone number reached the ledger',
    !/\+91\s?9\d{9}/.test(stateJson),
  );

  const chain = await ledger.verifyChain();
  check('the seeded chain still verifies', chain.valid, `${chain.blockCount} blocks, ${chain.txCount} txs`);

  // The UI's "generate sample proof" button must not produce a photo that is
  // already on the ledger, or the duplicate-photo rule would reject the demo.
  const seededHashes = new Set(tokens.map((t) => t.photo.sha256));
  const collisions = [];
  for (let tone = 0; tone < 5; tone++) {
    const url = domain.photoDataUrl('Mango', 'Mango · Mandya', tone);
    if (seededHashes.has(await domain.sha256(url))) collisions.push(`tone ${tone}`);
  }
  check(
    'a UI sample photo never collides with a seeded photo',
    collisions.length === 0,
    collisions.join(', ') || '5 tones checked',
  );

  // The seeded photos themselves are reproducible (stable nonce).
  const ledger2 = await buildSeededLedger();
  const hashes2 = (await ledger2.getAllTokens()).map((t) => t.photo.sha256);
  const same = hashes2.length === tokens.length && hashes2.every((h, i) => h === tokens[i].photo.sha256);
  check('the seeded photos are reproducible', same, `${hashes2.length} photo(s)`);
}

/* ------------------------------------------------------------------ *
 * Summary
 * ------------------------------------------------------------------ */

const failed = results.filter((r) => !r.ok);
console.log(`\n${'='.repeat(64)}`);
console.log(`RESULT: ${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) {
  console.log('FAILURES:');
  failed.forEach((f) => console.log(`  x ${f.name} ${f.detail}`));
}
process.exit(failed.length ? 1 : 0);
