# GreenToken — Technical Architecture

> Unit 5 · Developing Smart Contracts and Use Cases
> 21CSE432IT — Blockchain Technology with Hyperledger Fabric

This document describes how GreenToken is actually built, from the files in the repository.
Every statement below is traceable to a source file; file:line references are given where they
pin a fact down.

---

## 1. System in one paragraph

GreenToken turns a geo-stamped planting photo into a transferable carbon token. The business
rules live in exactly one module — `src/core/chaincode.ts` — which imports **no** platform SDK.
That module talks to an interface called `ChaincodeStub`, and each deployment target supplies its
own implementation of it. The result is one smart contract with three hosts: the browser demo, a
Cloudflare Worker + Durable Object, and real Hyperledger Fabric v2.5 chaincode.

```
src/core/chaincode.ts          ← business rules only (no platform imports)
        │
        ├── src/core/ledger.ts            MemoryStub          → browser demo
        ├── worker/src/index.ts           Durable Object      → deployed API
        └── chaincode/src/contract.ts     fabric-shim Context → Hyperledger Fabric
```

`chaincode/src/domain.ts` is a **byte-for-byte copy** of `src/core/chaincode.ts` (verified with
`diff`); `scripts/sync-chaincode.sh` regenerates it, together with `types.ts` and a
Node-flavoured `crypto.ts`.

---

## 2. Repository map

| Path | Contents |
|---|---|
| `src/core/` | Platform-free domain: `chaincode.ts` (rules), `crypto.ts` (primitives), `ledger.ts` (in-browser Fabric-shaped ledger), `types.ts`, `seed.ts`, `store.tsx` (React binding) |
| `src/components/` | React + Vite front end — `Layout.tsx` holds the navigation list; 7 screens |
| `chaincode/` | Fabric v2.5 TypeScript chaincode package — `contract.ts` is the **adapter** only |
| `worker/` | Cloudflare Worker + Durable Object API (`greentoken-api`) |
| `network/` | Fabric `docker-compose.yaml`, `deploy.sh` (package → install → approve → commit), `README.md` |
| `scripts/` | `sync-chaincode.sh` (domain → Fabric package), `verify.mjs` (22 end-to-end browser checks) |
| `ppt/` | Presentation deck and its source (`ppt/slides/slide-NN.js`) |

### 2.1 The real navigation list

`src/components/Layout.tsx:5` — the seven screens a user can reach, in sidebar order:

| Nav id | Label | Icon |
|---|---|---|
| `dashboard` | Dashboard | ◈ |
| `plant` | Plant a Tree | 🌱 |
| `verify` | Verification | ✓ |
| `discover` | Discover & Fund | 🔍 |
| `leaderboard` | Leaderboard | 🏆 |
| `ledger` | Ledger Explorer | ⛓ |
| `invoices` | Invoices | 🧾 |

The same file pins two more facts used throughout this document:

- `ORG_ORDER` → `['PLANTER', 'VERIFIER', 'AUDITOR', 'FUNDER']` (`Layout.tsx:17`) — the order in
  which the identity switcher groups the four consortium members.
- The sidebar footer always shows the channel name **`greentoken-channel`** (`Layout.tsx:83`) and a
  live chain-integrity pill driven by `chainValid` from the store.

---

## 3. The three deployment targets

| Host | Entry point | Stub implementation | Ledger / state | Signing model |
|---|---|---|---|---|
| **Browser demo** | `src/core/ledger.ts` | `MemoryStub` (`ledger.ts:65`) | `Map<string, any>` shared by every stub instance; snapshot persisted to `localStorage` under `greentoken.ledger.v1` (`store.tsx:36`) | The participant's own ECDSA P-256 key signs endorsements and transactions |
| **Cloudflare Worker + Durable Object** | `worker/src/index.ts` | the Durable Object **is** the channel (`GreenTokenChannel`, `index.ts:27`); it stores the same `GreenTokenLedger` under storage key `ledger` | DO storage — one serialised writer, one ordered history | Same participant keys, same domain module |
| **Hyperledger Fabric v2.5** | `chaincode/src/contract.ts` | `FabricStub` (`contract.ts:36`) over `fabric-shim` `Context` | The peer's world state (CouchDB / LevelDB) | Fabric's own MSP endorsement signature; the chaincode does **not** re-sign (`contract.ts:96`) |

The Durable Object name is derived from the channel: `env.GREENTOKEN.idFromName('greentoken-channel')`
(`worker/src/index.ts:195`).

### 3.1 The `ChaincodeStub` contract

`src/core/chaincode.ts:33` — the single interface every host must satisfy:

```ts
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
```

### 3.2 How each host implements it

| Stub method | Browser `MemoryStub` (`ledger.ts:79`) | Durable Object host | Fabric `FabricStub` (`contract.ts:39`) |
|---|---|---|---|
| `getState` | `Map.get`, `null` when absent | same in-process map | `ctx.stub.getState` → `JSON.parse`, raw string on parse failure, `null` when empty |
| `putState` | `Map.set` | same | `ctx.stub.putState(key, Buffer.from(JSON.stringify(value)))` |
| `getStateByRange` | sorted prefix scan of the map | same | `ctx.stub.getStateByRange(prefix, '', false)` iterated to exhaustion |
| `deleteState` | `Map.delete` | same | `ctx.stub.delState` |
| `emitEvent` | pushes a `ChainEvent` with txId, block number, timestamp | same | `ctx.stub.setEvent(name, Buffer.from(JSON.stringify(payload)))` |
| `getMSPID` | `mspForOrg(caller.org)` (`ledger.ts:160`) | same | `ctx.clientIdentity.getMSPID()` |
| `getAttributeValue` | in-memory attribute map: `name`, `participantId`, `role` | same | `ctx.clientIdentity.getAttributeValue(name)` decoded from bytes |
| `getTxID` | `tx-<hex timestamp>-<counter>` (`ledger.ts:197`) | same | `ctx.stub.getTxID()` |
| `getBlockNumber` | current ledger height | same | `ctx.stub.getBlockNumber()` |
| `getSignerKeys` | the participant's exported JWK pair, or `null` if the org has no participant | same | **always `null`** — Fabric signs at the MSP level |

`getSignerKeys()` returning `null` is what makes one contract work on three hosts: `VerifyPlanting`
falls back to a plain digest when there is no key to sign with (`chaincode.ts:285`).

---

## 4. State key layout

`src/core/chaincode.ts:117` — one `KEY` helper builds every key. The prefix families mirror
Fabric composite keys.

| Key pattern | Value | Written by |
|---|---|---|
| `token:<tokenId>` | full `TreeToken` | `PlantTree`, `VerifyPlanting`, `FundTokens` |
| `token~idx:<tokenId>` | `{ tokenId }` | `PlantTree` |
| `idx:district:<district>:<tokenId>` | `{ tokenId }` | `PlantTree` |
| `idx:status:<status>:<tokenId>` | `{ tokenId }` | `PlantTree` (as `PENDING`), moved on every status change |
| `idx:species:<species>:<tokenId>` | `{ tokenId }` | `PlantTree` |
| `idx:planter:<planterId>:<tokenId>` | `{ tokenId }` | `PlantTree` |
| `invoice:<invoiceId>` | full `FundingInvoice` | `FundTokens`, `SettleFunding` |
| `invoice~idx:<invoiceId>` | `{ invoiceId }` | `FundTokens` |
| `meta:tokenSeq` | number — last issued token sequence | `PlantTree` |
| `meta:invoiceSeq` | number — last issued invoice sequence | `FundTokens` |

**Index maintenance rule.** A status change is always a delete-then-put pair:

```ts
await stub.deleteState(KEY.tokenByStatus('PENDING', token.tokenId));
await stub.putState(KEY.tokenByStatus(token.status, token.tokenId), { tokenId: token.tokenId });
```

(`chaincode.ts:311-312` for verification, `chaincode.ts:404-405` for funding.) The `PENDING` and
`VERIFIED` index entries are deleted; `VERIFIED` and `FUNDED` entries are written.

**Prefix-scan caveat.** `getStateByRange('token:')` also returns `token~idx:` keys and
`getStateByRange('invoice:')` also returns `invoice~idx:` keys, because `token~idx` starts with
`token`. Every read model therefore filters the index rows out explicitly
(`chaincode.ts:492`, `529`, `582`, `616`).

---

## 5. Data models

### 5.1 `TreeToken` — `src/core/types.ts:68`

```ts
export interface TreeToken {
  tokenId: string;            // "GT-000001"
  planterId: string;
  planterName: string;
  planterOrg: string;
  district: string;
  state: string;
  species: string;
  count: number;
  estimatedCo2Kg: number;     // co2For(species, count)
  geo: GeoStamp;
  photo: PhotoProof;
  status: TokenStatus;        // PENDING | VERIFIED | REJECTED | FUNDED
  endorsements: Endorsement[];
  requiredEndorsements: number;
  invoiceId?: string;
  createdAt: string;
  verifiedAt?: string;
  fundedAt?: string;
  // privateContact is NOT part of the persisted token — see 'Privacy' below
}
```

Supporting types:

```ts
export interface GeoStamp {                       // types.ts:22
  lat: number; lng: number;
  accuracyMeters: number;
  capturedAt: string;
  geoHash: string;             // SHA-256 of the geo payload
}

export interface PhotoProof {                      // types.ts:31
  sha256: string;              // SHA-256 of the photo
  byteLength: number;
  mimeType: string;
  dataUrl?: string;            // demo thumbnail; in Fabric this would be a private-data asset
}

export interface Endorsement {                    // types.ts:40
  by: string;                  // participant id of the reviewer
  org: OrgId;
  orgName: string;
  verdict: 'APPROVE' | 'REJECT';
  note: string;
  endorsedAt: string;
  signature: string;           // ECDSA P-256 over the endorsement payload
}
```

### 5.2 `FundingInvoice` — `src/core/types.ts:52`

```ts
export interface FundingInvoice {
  invoiceId: string;           // "INV-2026-00001"
  funderId: string;
  funderName: string;
  units: number;
  pricePerToken: number;       // default BASE_PRICE_INR = 150
  discountPct: number;         // 0 | 5 | 10 | 15
  grossAmount: number;
  discountAmount: number;
  netAmount: number;
  tokenIds: string[];
  issuedAt: string;
  settledAt?: string;
  status: 'ISSUED' | 'SETTLED';
}
```

### 5.3 Identifiers and constants (`src/core/chaincode.ts`)

| Constant | Value | Line |
|---|---|---|
| `REQUIRED_ENDORSEMENTS` | `2` | 70 |
| `BASE_PRICE_INR` | `150` | 87 |
| `CO2_RATES_NOTE` | `"species rate × trees"` | 90 |
| `DISCOUNT_TIERS` | `[{500,15},{200,10},{50,5},{1,0}]` | 93 |
| Token id format | `GT-` + 6-digit zero-padded sequence | 193 |
| Invoice id format | `INV-2026-` + 5-digit zero-padded sequence | 382 |
| Channel name | `greentoken-channel` | `ledger.ts:133` |
| Ordering organisation | `ORDERER_ORG = 'VERIFIER'` (Forest Dept MSP) | `ledger.ts:45` |
| Ordering service name | `Consortium Ordering Service` | `ledger.ts:46` |

### 5.4 CO₂ rate table — `chaincode.ts:73` (kg CO₂ per tree per year)

| Species | kg/yr | Species | kg/yr |
|---|---|---|---|
| Mango | 25 | Banyan | 33 |
| Neem | 22 | Jamun | 24 |
| Teak | 30 | Eucalyptus | 31 |
| Bamboo | 28 | Casuarina | 26 |
| Gulmohar | 29 | Peepal | 28 |

`co2For(species, count)` multiplies the rate by the tree count; unknown species fall back to
`20 kg` (`chaincode.ts:106`), although `PlantTree` rejects unknown species before that can happen.

---

## 6. Block, transaction and hash structure

### 6.1 Transaction — `src/core/types.ts:92`

```ts
export interface LedgerTx {
  txId: string;
  type: TxType;               // PlantTree | VerifyPlanting | RejectPlanting | FundTokens | SettleFunding
  actorOrg: OrgId;
  actorName: string;
  payloadHash: string;
  payload: Record<string, unknown>;
  endorsements: { org: OrgId; signature: string }[];
  timestamp: string;
  txHash: string;
  blockNumber: number;
}
```

### 6.2 Block — `src/core/types.ts:108`

```ts
export interface Block {
  number: number;
  prevHash: string;           // "GENESIS" for block #1
  merkleRoot: string;
  txHashes: string[];
  txs: LedgerTx[];
  timestamp: string;
  signature: string;          // ECDSA P-256 by the ordering organisation
  signerOrg: OrgId;           // VERIFIER
  hash: string;
}
```

### 6.3 The hash formulas

```
payloadHash = SHA-256(JSON.stringify(payload))              ledger.ts:216
txHash      = SHA-256(txId | type | payloadHash | timestamp) ledger.ts:237
merkleRoot  = Merkle(txHashes in block)                      ledger.ts:252
blockHash   = SHA-256(prevHash | merkleRoot | number | timestamp)  ledger.ts:254
blockSig    = ECDSA-P256-SHA256({ number, prevHash, root, timestamp })  ledger.ts:255-257
```

Field separator is the pipe character `|`. The genesis sentinel is the literal string `GENESIS`.

The Merkle tree (`crypto.ts:143`) is a standard binary tree over hex leaf strings, hashing
`left + right` as UTF-8 text. An odd node at any level is paired with **itself**. An empty block
hashes the literal `EMPTY_BLOCK`.

### 6.4 One transaction = one block

`appendBlock` is called with a single transaction per invocation (`ledger.ts:242`), so in this
implementation **block height equals transaction count**. The seeded consortium therefore starts
at height 29: 9 `PlantTree` + 15 `VerifyPlanting` (2 each for 7 tokens, 1 rejection) + 5 funding
transactions (2 fund + 2 settle + 1 bulk fund).

### 6.5 Chain verification — `ledger.ts:347`

`verifyChain()` recomputes **everything from scratch** and stops at the first disagreement,
reporting `brokenAt` and a human-readable `reason`. The checks, in order, per block:

| # | Check | Failure message |
|---|---|---|
| 1 | `block.prevHash` equals the previous block's hash | "prevHash does not match the previous block hash — the chain was re-pointed." |
| 2 | recomputed `merkleRoot` equals the stored root | "Merkle root mismatch — a transaction inside this block was altered." |
| 3 | `SHA-256(JSON.stringify(tx.payload))` equals the stored `payloadHash` | "payload was altered after endorsement — its stored payload no longer hashes to the signed payloadHash." |
| 4 | recomputed `txHash` equals the stored `txHash` | "hash mismatch — payload was edited after endorsement." |
| 5 | recomputed block hash equals the stored `hash` | "header hash mismatch — the block was tampered with." |

### 6.6 Tamper and restore

- `tamperBlock(blockNumber, 'payload' | 'header')` (`ledger.ts:418`) rewrites either the first
  transaction's payload (adding `TAMPERED: true` and setting `estimatedCo2Kg: 99999`) or the
  block header timestamp.
- `restoreChain()` → `rebuildChainFromTxs()` (`ledger.ts:448`, `458`) restores the pristine
  payloads from an internal `originalPayloads` map, then rebuilds and **re-signs** every block with
  the ordering service key.

---

## 7. Cryptography — four layers

`src/core/crypto.ts` uses the **Web Crypto API only** — no third-party crypto library — so the
same code runs in a browser, in a Worker and in Node 18+.

| Layer | Primitive | What it covers | Where |
|---|---|---|---|
| 1. Evidence hash | SHA-256 over the photo | the image itself stays off-chain; the digest is the proof | `crypto.ts:31`, `crypto.ts:69` |
| 2. Geo hash | SHA-256 over canonical JSON of the geo payload | coordinates are bound to the submission | `chaincode.ts:194` → `hashJson` → `canonicalize` |
| 3. Transaction + Merkle | SHA-256 tx hash, Merkle root per block | any altered transaction breaks the block root | `ledger.ts:237`, `crypto.ts:143` |
| 4. Chained block header | SHA-256 over `prevHash \| merkleRoot \| number \| timestamp`, signed with ECDSA P-256 | an edit cascades down the whole chain | `ledger.ts:254-257` |

**Canonical JSON.** `canonicalize()` (`crypto.ts:51`) sorts object keys recursively before
stringifying, so a hash computed in the browser matches one computed on the server or in
chaincode. `hashJson()` = `SHA-256(canonicalize(value))`.

**Signatures.** `generateKeyPair()` (`crypto.ts:83`) creates an ECDSA P-256 key pair with
`sign`/`verify` usages, exported as JWK. `signPayload(payload, privateKeyJwk)` canonicalises the
payload and signs the UTF-8 bytes; `verifyPayload()` verifies against a public JWK.

**Who signs what**

| Artefact | Signed by | Signature material |
|---|---|---|
| Endorsement on a token | the endorsing participant | participant ECDSA key, or `hashJson({ fabricEndorsement: true, ...payload })` when the host has no key (Fabric) |
| Transaction | the acting participant's org | `signPayload({ txId, type, payloadHash }, participant.privateKey)` (`ledger.ts:221`) |
| Block header | the ordering organisation (Forest Dept / `Consortium Ordering Service`) | `ordererKeys` ECDSA key (`ledger.ts:255`) |

**Private key handling.** `Participant.privateKey` is marked "kept client-side only, never on the
ledger" (`types.ts:130`). `toJSON()` strips it (`ledger.ts:534-538`); `exportState()` — the
`localStorage` / Durable Object snapshot — keeps it so the demo can resume mid-consortium
(`ledger.ts:488-500`).

**Implementation detail — what exactly is hashed.** The field is named `photo.sha256` and the UI
calls it "SHA-256 of the image bytes", but the browser host hashes the **data-URL text**
(`sha256(dataUrl)` in `src/components/PlantTree.tsx:44` and in the seed at
`src/core/seed.ts:162`), while `photo.byteLength` records the size of the original file. The
digest is therefore stable and reproducible for the stored representation — changing one pixel
of the source image changes the digest — but a byte-length/digest comparison against the raw
file would not match. On Fabric the photo would be a private-data asset and the digest would be
computed over the stored bytes.

---

## 8. Identity, roles and permissions

### 8.1 MSP → organisation mapping — `chaincode.ts:55`

| MSP id | Org id | Organisation name |
|---|---|---|
| `PlantersAssociationMSP` | `PLANTER` | Sahyadri Planters Association |
| `ForestDeptMSP` | `VERIFIER` | State Forest Department |
| `CorporateFundersMSP` | `FUNDER` | Corporate Green Funders |
| `AuditorMSP` | `AUDITOR` | Independent Carbon Auditor |

`resolveCaller()` (`chaincode.ts:133`) maps the caller's MSP id to an org, then reads the
`name` and `participantId` attributes. **If the MSP id is unknown, the caller is treated as
`PLANTER`** (`?? 'PLANTER'`) — a fail-open default worth noting in a review.

### 8.2 Permission matrix (as enforced by the code)

| Function | PLANTER | VERIFIER (Forest Dept) | AUDITOR | FUNDER |
|---|:---:|:---:|:---:|:---:|
| `PlantTree` | ✅ | ❌ | ❌ | ❌ |
| `VerifyPlanting` | ❌ | ✅ | ✅ | ❌ |
| `FundTokens` | ❌ | ❌ | ❌ | ✅ |
| `SettleFunding` | ❌ | ❌ | ✅ | ✅ |
| `GetToken` / `SearchTokens` / `GetLeaderboard` / `GetStats` / `GetInvoice` / `GetAllInvoices` | ✅ | ✅ | ✅ | ✅ |

Source: `requireOrg(stub, [...])` calls at `chaincode.ts:173` (`['PLANTER']`), `261`
(`['VERIFIER','AUDITOR']`), `351` (`['FUNDER']`), `437` (`['FUNDER','AUDITOR']`).

Two consequences that the project README and the slide deck get wrong — see
[§12 Discrepancies](#12-discrepancies-between-the-readme-the-deck-and-the-code):

- **The Forest Department cannot settle.** `SettleFunding` admits `FUNDER` and `AUDITOR` only.
- **Reads are not role-gated.** Every read model is callable by any channel member; the browser
  read stub even defaults to the `AUDITOR` identity (`ledger.ts:303`).

A denied call returns `{ ok: false, message: "Access denied: <org> is not permitted to perform
this operation." }` (`chaincode.ts:146`). The UI merely hides the button — the contract is the
enforcement point.

### 8.3 The quorum rule

`REQUIRED_ENDORSEMENTS = 2` (`chaincode.ts:70`). A token flips to `VERIFIED` when the number of
`APPROVE` endorsements reaches the required count (`chaincode.ts:305`). Two further rules apply:

- One endorsement per participant — a second endorsement from the same `participantId` is
  rejected (`chaincode.ts:270`).
- Any `REJECT` verdict sets the status to `REJECTED` immediately and closes the token
  (`chaincode.ts:302-304`). There is no un-reject path.

### 8.4 Privacy

`privateContact` is **never written to shared state at all**. It is stripped from the
`PlantTree` input before anything is hashed, stored or emitted, so it is not part of
the token, not returned by any read function, and not part of the transaction hash:
`readableToken()` in `src/components/TokenDetail.tsx:188` rebuilds the token without the contact
field and adds `privateFieldsWithheld: ['planterContact']`. In the current implementation this is
emulated privacy — the field is still written into world state — and the README lists this as a
known limitation. A production Fabric build should use a private data collection.

---

## 9. Chaincode function flows

All four write functions live in `src/core/chaincode.ts` and are exposed by all three hosts.

### 9.1 `PlantTree(input)` → write — `chaincode.ts:169`

```
1. requireOrg(stub, ['PLANTER'])
2. validate:
     species must be a key of CARBON_PER_SPECIES  → "Unknown species "<x>". Not in the carbon registry."
     count ≥ 1                                    → "Tree count must be at least 1."
     geo.lat and geo.lng must be finite          → "A valid geo-stamp (lat/lng) is required as proof of planting."
     photo.sha256 must be present                 → "A photo with a SHA-256 content hash is required as proof."
3. sequence := meta:tokenSeq (default 0); meta:tokenSeq := sequence + 1
   tokenId := "GT-" + pad6(sequence + 1)
4. geoHash := hashJson(input.geo)                     // SHA-256 of canonical geo JSON
   estimatedCo2Kg := co2For(species, count)
5. build TreeToken { status: 'PENDING', endorsements: [], requiredEndorsements: 2, createdAt: now }
6. write 6 keys: token:, token~idx:, idx:district:, idx:status:PENDING:, idx:species:, idx:planter:
7. emitEvent('PlantTree', { tokenId, planter, district, species, count, geoHash, photoHash, estimatedCo2Kg })
8. return "Token GT-0000NN created and awaiting verification."
```

### 9.2 `VerifyPlanting(input)` → write — `chaincode.ts:257`

```
1. requireOrg(stub, ['VERIFIER','AUDITOR'])
2. load token                                  → "Token <id> not found."
3. if status === 'FUNDED'                      → "Token is already funded and settled; verification is closed."
4. if an endorsement by this participant exists → "<name> has already reviewed this token."
5. endorsementPayload := { tokenId, verdict, note, org, at }
   signature := signer ? signPayload(payload, privateKey)
                        : hashJson({ fabricEndorsement: true, ...payload })   // Fabric path
6. push endorsement { by, org, orgName, verdict, note, endorsedAt, signature }
7. status change:
     verdict === 'REJECT'                                   → 'REJECTED'
     APPROVE count ≥ requiredEndorsements                  → 'VERIFIED'
8. re-index: delete idx:status:PENDING:<id>; put idx:status:<newStatus>:<id>
9. emitEvent('VerifyPlanting', { tokenId, verifier, verdict, status, approvals, required })
10. message:
      VERIFIED  → "Quorum reached — token <id> is VERIFIED and mintable."
      REJECTED  → "Token <id> rejected by <orgName>."
      otherwise → "Endorsement recorded (<n>/<required>)."
```

### 9.3 `FundTokens(input)` → write — `chaincode.ts:347`

```
1. requireOrg(stub, ['FUNDER'])
2. tokenIds must be non-empty                   → "Select at least one verified token to fund."
3. for each id: load token                      → "Token <id> not found."
               status must be 'VERIFIED'         → "Token <id> is <status> — only VERIFIED tokens can be funded."
4. units          := input.units ?? tokens.length
   pricePerToken  := input.pricePerToken ?? BASE_PRICE_INR (150)
   discountPct    := discountForUnits(units)   // first tier with units >= tier.min
   grossAmount    := units * pricePerToken
   discountAmount := round(grossAmount * discountPct / 100)
   netAmount      := grossAmount - discountAmount
5. invoiceSeq := meta:invoiceSeq (default 0); invoiceId := "INV-2026-" + pad5(seq+1)
6. build invoice { status: 'ISSUED', issuedAt: now }
7. for each token: status := 'FUNDED'; invoiceId; fundedAt; re-index VERIFIED → FUNDED
8. write invoice:<id> and invoice~idx:<id>
9. emitEvent('FundTokens', { invoiceId, funder, units, grossAmount, discountPct, discountAmount, netAmount, tokenIds })
10. return "Invoice <id> issued — <n> token(s), <p>% bulk discount applied."
```

The discount ladder is resolved **inside the contract** (`DISCOUNT_TIERS`, `discountForUnits`).
The client sends `units` and `pricePerToken`; it cannot choose a percentage.

### 9.4 `SettleFunding(invoiceId)` → write — `chaincode.ts:433`

```
1. requireOrg(stub, ['FUNDER','AUDITOR'])
2. load invoice                                 → "Invoice <id> not found."
3. if status === 'SETTLED'                      → "Invoice <id> is already settled."
4. invoice.status := 'SETTLED'; invoice.settledAt := now; write invoice:<id>
5. emitEvent('SettleFunding', { invoiceId, netAmount, beneficiaries: tokenIds.length })
6. return "Invoice <id> settled. ₹<netAmount> released to planters."
```

Tokens stay in the `FUNDED` state after settlement — settlement is a property of the invoice.
The leaderboard only credits `fundsReceived` for `SETTLED` invoices (`chaincode.ts:551`).

### 9.5 Read models

| Function | Behaviour | Line |
|---|---|---|
| `GetToken(tokenId)` | point read of `token:<id>` | 463 |
| `SearchTokens(input)` | status filter uses the `idx:status:` range scan; otherwise a `token:` scan with the index rows filtered out. Then filters by `district`, `species`, `planterId`, and a case-insensitive substring over `tokenId planterName district species state`. Sorted by `createdAt` descending | 477 |
| `GetLeaderboard()` | aggregates non-`REJECTED` tokens per planter (token count, trees, kg CO₂), then adds `fundsReceived` from `SETTLED` invoices as `round(netAmount / tokenIds.length)` per token. Sorted by kg CO₂, then token count | 524 |
| `GetStats()` | counts per status, total CO₂ and trees over non-rejected tokens, total funding over settled invoices, `blockHeight` from `stub.getBlockNumber()` | 580 |
| `GetInvoice(id)` | point read of `invoice:<id>` | 605 |
| `GetAllInvoices()` | `invoice:` scan minus index rows, sorted by `issuedAt` descending | 614 |

---

## 10. Events

| Event | Emitted by | Payload |
|---|---|---|
| `PlantTree` | `PlantTree` | `tokenId, planter, district, species, count, geoHash, photoHash, estimatedCo2Kg` |
| `VerifyPlanting` | `VerifyPlanting` | `tokenId, verifier, verdict, status, approvals, required` |
| `FundTokens` | `FundTokens` | `invoiceId, funder, units, grossAmount, discountPct, discountAmount, netAmount, tokenIds` |
| `SettleFunding` | `SettleFunding` | `invoiceId, netAmount, beneficiaries` |
| `Init` | Fabric `initStub` only | `{ channel: <channel id> }` |

Every event carries `txId`, `blockNumber` and `timestamp` in the browser/DO hosts
(`ledger.ts:95-103`). The dashboard feed and the SSE stream both consume them; the Worker
exposes `/api/events/stream` (Server-Sent Events, 2.5 s poll of the Durable Object,
`worker/src/index.ts:206`).

---

## 11. Host-specific behaviour

### 11.1 Browser host — `src/core/ledger.ts`

- `GreenTokenLedger` owns `blocks`, `events`, `participants`, `state`, `txCounter` and
  `originalPayloads`.
- `buildTx()` (`ledger.ts:184`) is the transaction pipeline: build the stub → run the chaincode
  function → drain events → **if the function returns `ok: false`, the transaction is discarded
  and no block is appended** (`ledger.ts:210-214`) — exactly how a Fabric endorsement failure
  behaves.
- The signing key used for a transaction is the participant of the acting org
  (`participantByOrg`, `ledger.ts:178`).
- `exportState()` / `fromJSON()` (re)hydrate the whole ledger, including participant private
  keys, so a page refresh resumes mid-consortium.
- `Reset demo` in the Ledger Explorer (`src/components/LedgerExplorer.tsx:118`) clears the
  `localStorage` key and rebuilds the seeded consortium from genesis.
- **Block-height nuance.** `MemoryStub.getBlockNumber()` returns a field that is never advanced
  (`ledger.ts:68`, `113`), so `GetStats().blockHeight` is `0` on this host. Both front ends
  therefore substitute the real height — the UI in `src/core/store.tsx:112`, the Worker in
  `worker/src/index.ts:78` (`blockHeight: ledger.blocks.length`). On Fabric the value comes from
  the peer and needs no correction.

### 11.2 Durable Object host — `worker/src/index.ts`

- `GreenTokenChannel` is bound as a Durable Object (`worker/wrangler.toml`, class
  `GreenTokenChannel`, `new_sqlite_classes` migration `v1`).
- `load()` restores the ledger from storage key `ledger`, or seeds it with `buildSeededLedger()`
  on first use; `persist()` writes `exportState()` back after every mutating request.
- REST surface:

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | channel name, block count, token count, orderer public key presence |
| GET | `/api/stats` | `GetStats()` |
| GET | `/api/tokens?status=&district=&species=&q=` | `SearchTokens()` |
| GET | `/api/tokens/:id` | `GetToken()` |
| GET | `/api/leaderboard` | `GetLeaderboard()` |
| GET | `/api/invoices` | `GetAllInvoices()` |
| GET | `/api/blocks` | the raw block array |
| GET | `/api/events` | the last 200 events, newest first |
| GET | `/api/verify-chain` | `verifyChain()` |
| GET | `/api/events/stream` | SSE stream of chaincode events |
| POST | `/api/plant` `/api/verify` `/api/fund` `/api/settle` | the four write functions |

- The caller identity on a POST comes from the request body's `actor` object
  (`toCaller()`, `worker/src/index.ts:164`) — the DO host derives the org from `actor.org`
  rather than from an MSP certificate, which is the one place where the DO host is *not* a
  cryptographic identity provider.
- `/api/stats` overrides `blockHeight` with `ledger.blocks.length` for the same reason as the
  browser host (see §11.1).

### 11.3 Fabric host — `chaincode/src/contract.ts`

- `FabricStub` wraps the `fabric-shim` `Context`.
- `GreenTokenContract` exposes `initStub`, the four writes, the six reads and `WhoAmI`
  (echoes the caller's MSP-derived identity — `contract.ts:186`).
- Write functions throw `new Error(res.message)` when the domain function refuses, which is how
  a Fabric endorsement failure surfaces to the client.
- The shim entry point exports `contracts = { greentoken: createContract() }` and
  `info = { title: 'greentoken', version: '1.0.0', description: 'Verifiable blue-green carbon tokens' }`
  (`contract.ts:196-201`) — the chaincode namespace must therefore be `greentoken`, which is the
  default in `network/deploy.sh` (`CHAINCODE_NAME=greentoken`).
- `initStub` seeds `meta:tokenSeq` and `meta:invoiceSeq` with `0` and emits an `Init` event
  carrying the channel id (`contract.ts:115-119`).

### 11.4 Keeping the three hosts identical — `scripts/sync-chaincode.sh`

1. `cp src/core/types.ts chaincode/src/types.ts`
2. `sed` rewrite of `src/core/crypto.ts` → `chaincode/src/crypto.ts`, replacing the global
   `crypto.subtle` with an explicit `cryptoRef` and generating `chaincode/src/crypto.node.ts`
   (which injects Node's `webcrypto`).
3. `cp src/core/chaincode.ts chaincode/src/domain.ts`

Run it after every change to the domain module.

---

## 12. Discrepancies found during review — and how they were resolved

An independent fact-check compared this document, the deck and the README against the
source. Every discrepancy it found has since been fixed in the code or in the text.

| # | Was | Now |
|---|---|---|
| 1 | `README.md` listed `ForestDeptMSP` as able to settle | `SettleFunding` allows only `FUNDER` and `AUDITOR` — the README row and the deck's permission matrix were both corrected |
| 2 | Deck slide 9 said "All eight write paths funnel through `chaincode.ts`" | There are **four** write functions; the slide now says so |
| 3 | Deck slide 9 listed `GetInvoices()` | The exports are `GetInvoice(id)` and `GetAllInvoices()`; the slide now names them correctly |
| 4 | Deck slide 20 said "Six chaincode functions" | There are **ten** domain functions — four writes and six reads — plus `WhoAmI` on the Fabric adapter |
| 5 | Deck slide 17 said "₹11,550 funder value" | The seeded ledger produces **₹15,525** net across three invoices (₹1,800 + ₹3,750 settled, plus the ₹9,975 bulk invoice); the slide was corrected |
| 6 | Deck slide 11 claimed the planter's phone number was "never hashed into the shared state" while the code wrote it into the token object | `privateContact` is now **stripped before anything is hashed, stored or emitted**. It is not in the token, not returned by any read function, and not in the transaction hash. The claim is now literally true |
| 7 | Quorum counted endorsements, so one organisation could supply both | Quorum now counts **distinct organisations**, and a second review from the same organisation is refused. The seed was re-paired so every verified token has one Forest Dept review and one Auditor review |
| 8 | A rejected token could be re-approved and funded | Rejection is now **terminal** — a rejected token refuses further review and refuses funding |
| 9 | The same photo could back two tokens | `PlantTree` now rejects a duplicate photo hash via a photo-hash index |
| 10 | A caller could declare any `units` or `pricePerToken` to reach a deeper discount | `units` is derived from the basket and a mismatch is refused; the price is a contract constant at ₹150 |
| 11 | The status index went stale (`PENDING → VERIFIED → REJECTED` left a `VERIFIED` entry) | Every status change now deletes the previous index entry first |
| 12 | The district / species / planter indexes were written but never read | `SearchTokens` now range-scans those indexes and intersects the candidate sets |
| 13 | `chaincode/src/contract.ts` imported `Context`/`Contract` from `fabric-shim` | `fabric-shim@2.5.8` does not export them. The adapter now uses `fabric-contract-api@2.5.8`, and the chaincode **compiles and boots** |
| 14 | `network/deploy.sh` passed the tarball name as `--package-id` and approved for one org only | The script captures the real `PACKAGE_ID` and approves for every organisation whose crypto material is present |
| 15 | `src/core/chaincode.ts` header pointed at a non-existent `worker/src/stub.ts` | The header now names the real Durable Object host, `worker/src/index.ts` |
| 16 | The deck cited a fabricated reference and a misattributed book | The references were corrected to Nakul Shah (BPB 2019) and Yannis Kalfoglou (Routledge 2021), and the Fabric docs URL now points at `hyperledger-fabric.readthedocs.io` |

Two behaviours were deliberately **not** changed, because they are the right design for
this use case and are now documented instead of overstated:

- **Reads are open.** `GetToken`, `SearchTokens`, `GetLeaderboard` and `GetStats` perform no
  role check. Visibility is the point of use case 1(ii) — a funder must be able to verify
  what they are buying. Only *writes* are role-gated, and the deck now says exactly that.
- **GPS accuracy is recorded but not thresholded.** `accuracyMeters` is stored and shown to
  reviewers, but the contract imposes no limit; the seeded 320 m rejection is a reviewer's
  judgement, and the deck wording was changed to say so.



---

## 13. Reading the code — quick index

| Question | File | Line |
|---|---|---|
| What are the business rules? | `src/core/chaincode.ts` | 169, 257, 347, 433 |
| How is identity resolved? | `src/core/chaincode.ts` (`resolveCaller`) | 133 |
| What keys exist? | `src/core/chaincode.ts` (`KEY`) | 117 |
| How is a block built? | `src/core/ledger.ts` (`appendBlock`) | 248 |
| How is tampering detected? | `src/core/ledger.ts` (`verifyChain`) | 347 |
| What are the crypto primitives? | `src/core/crypto.ts` | 31, 83, 116, 143 |
| How does Fabric bind to the domain? | `chaincode/src/contract.ts` | 36, 114 |
| How does the Durable Object bind? | `worker/src/index.ts` | 27, 186 |
| What is the seeded consortium? | `src/core/seed.ts` | 22, 87, 136 |
| What does the UI expose? | `src/components/Layout.tsx` | 5 |
| How is the Fabric network deployed? | `network/deploy.sh` | 33-70 |
