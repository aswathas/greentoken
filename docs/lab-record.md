# Lab Record — Practical Component

**Unit 5 — Developing Smart Contracts and Use Cases**
21CSE432IT — Blockchain Technology with Hyperledger Fabric
Project: **GreenToken — Verifiable Blue-Green Carbon Tokens**

---

## 1. Aim

To build and operate a permissioned Hyperledger Fabric v2.5 network for the GreenToken use case,
deploy the shared GreenToken smart contract onto it, and demonstrate that:

1. a four-organisation consortium (planters, a forest department, an independent auditor and
   corporate funders) can share one channel of state;
2. a planting proof becomes a transferable carbon token only after **two independent
   organisations** endorse it;
3. a funding invoice and its bulk discount are computed **inside** the contract;
4. the ledger is tamper-evident, and tampering can be **executed and detected** on demand.

The lab exercises the full Fabric chaincode lifecycle — **package → install → approve (per
organisation) → commit** — and then the transaction lifecycle on top of it.

---

## 2. Prerequisites

| Requirement | Version / detail | Used for |
|---|---|---|
| Docker Engine | 20.10+ | running the Fabric containers |
| Docker Compose | v2 (`docker compose`, not `docker-compose`) | `network/docker-compose.yaml` |
| Hyperledger Fabric binaries | **v2.5** — `peer`, `configtxgen`, `cryptogen`, `configtxlator` | packaging, approving, committing, querying |
| Node.js | ≥ 18 | building the TypeScript chaincode (`chaincode/package.json` engines) |
| npm | 9+ | `chaincode` dependencies (`fabric-shim` ^2.5.4) |
| Disk | ≈ 4 GB free | images, CouchDB volumes, chaincode build output |
| Memory | ≥ 4 GB assigned to Docker | orderer + peer + CouchDB + CA together |

Build the chaincode **before** packaging it — `deploy.sh` does this for you, but the same steps
by hand are:

```bash
cd chaincode && npm install && npm run build && cd ..
```

---

## 3. Network topology

### 3.1 Components

```
                       ┌────────────────────────────────────────────┐
                       │        Docker network "greentoken-net"      │
                       │                                            │
   cryptogen  ──────►  │   ┌──────────────┐   ┌──────────────────┐   │
   configtxgen ──────►  │   │  orderer0    │   │  couchdb         │   │
                       │   │  etcdraft    │◄──┤  (state store)   │   │
                       │   │  :7050       │   │  :5984           │   │
                       │   └──────┬───────┘   └────────▲─────────┘   │
                       │          │                     │             │
                       │   ┌──────┴─────────────────────┴──────┐      │
                       │   │  peer0.greentoken.com               │      │
                       │   │  chaincode: greentoken 1.0.0        │      │
                       │   │  :7051 (chaincode)  :7054 (CA)      │      │
                       │   └─────────────────────────────────────┘      │
                       │   ┌──────────────┐                           │
                       │   │  ca0         │  Fabric CA               │
                       │   │  :7054       │  (enrolment + MSP roots) │
                       │   └──────────────┘                           │
                       │   ┌──────────────┐                           │
                       │   │  cli         │  peer CLI (profile: cli) │
                       │   │  (on demand) │                           │
                       │   └──────────────┘                           │
                       └────────────────────────────────────────────┘

   host mounts:  ./crypto           →  /tmp/hyperledger
                 ./channel-artifacts →  /tmp/hyperledger/channel-artifacts
```

### 3.2 The four member organisations and their MSPs

All four join the single channel **`greentoken-channel`**.

| MSP id | Organisation | Role in the use case | Chaincode actions |
|---|---|---|---|
| `PlantersAssociationMSP` | Sahyadri Planters Association | Creates the planting proof | `PlantTree` |
| `ForestDeptMSP` | State Forest Department | Government verifier; also the **ordering organisation** for this channel | `VerifyPlanting` |
| `AuditorMSP` | Independent Carbon Auditor | Second, independent verifier | `VerifyPlanting`, `SettleFunding` |
| `CorporateFundersMSP` | Corporate Green Funders | Buys verified tokens | `FundTokens`, `SettleFunding` |

The mapping from MSP id to the in-contract organisation role is declared once, in
`src/core/chaincode.ts:55` (`MSP_TO_ORG`), and the Fabric adapter reads the caller's MSP id from
`ctx.clientIdentity.getMSPID()` (`chaincode/src/contract.ts:73`).

### 3.3 Channel configuration

| Property | Value |
|---|---|
| Channel name | `greentoken-channel` |
| Ordering | **etcdraft** (Raft consensus), single-node for the lab |
| Ordering organisation | `ForestDeptMSP` — the ordering service signs every block |
| State database | CouchDB on peer0; the block store itself stays LevelDB on the peer |
| MSPs on the channel | `PlantersAssociationMSP`, `ForestDeptMSP`, `AuditorMSP`, `CorporateFundersMSP` |
| Chaincode | namespace `greentoken`, version `1.0.0`, sequence `1` (`network/deploy.sh`) |

---

## 4. Chaincode lifecycle — step by step

`network/deploy.sh` performs exactly these four steps and can be re-run per sequence number.
The script's defaults are `CHANNEL=greentoken-channel`, `CHAINCODE_NAME=greentoken`,
`CHAINCODE_VERSION=1.0.0`, `SEQUENCE=1`, `PEER_CONN=localhost:7051`,
`ORDERER=localhost:7050`, `PEER_CA=localhost:7054`.

### Step 0 — build

```bash
cd chaincode && npm install && npm run build && cd ..
```

Produces `chaincode/dist/`, which is what gets packaged. `scripts/sync-chaincode.sh` must be run
first if `src/core/chaincode.ts` has changed.

### Step 1 — package

```bash
peer lifecycle chaincode package greentoken.tar.gz \
  --path chaincode/dist \
  --label greentoken:1.0.0
```

The command prints the **PACKAGE_ID**, e.g.

```
Package 'greentoken.tar.gz' created
Package ID: greentoken:1.0.0:8f1c...   <-- keep this
```

> The PACKAGE_ID (not the tarball name) is what `approveformyorg` needs in `--package-id`.
> `network/deploy.sh:52` currently passes the tarball name; capture the real id from the output
> above when running the lab, or adjust the script locally before the demo.

### Step 2 — install on the peer

```bash
peer lifecycle chaincode install greentoken.tar.gz \
  --peer.address localhost:7051 \
  --tlsClientCertPath /tmp/hyperledger/organizations/peerOrganizations/example.com/tls/client.crt \
  --tlsClientKeyPath  /tmp/hyperledger/organizations/peerOrganizations/example.com/tls/client.key \
  --tlsRootCertPath   /tmp/hyperledger/organizations/peerOrganizations/example.com/tls/ca.crt
```

Installation copies the package onto the peer's filesystem. It does **not** make the chaincode
runnable yet — the definition still has to be approved and committed.

### Step 3 — approve the definition, once per organisation

Every member organisation must approve the same definition (name, version, sequence, package id)
before the channel's endorsement policy is satisfied:

```bash
# repeat for PlantersAssociationMSP, ForestDeptMSP, AuditorMSP, CorporateFundersMSP,
# using that org's own client TLS certificate
peer lifecycle chaincode approveformyorg \
  -o localhost:7050 \
  --channelID greentoken-channel \
  --name greentoken \
  --version 1.0.0 \
  --package-id greentoken:1.0.0:<hash> \
  --sequence 1 \
  --tlsClientCertPath /tmp/hyperledger/organizations/peerOrganizations/<org>/tls/client.crt \
  --tlsClientKeyPath  /tmp/hyperledger/organizations/peerOrganizations/<org>/tls/client.key \
  --tlsRootCertPath   /tmp/hyperledger/organizations/peerOrganizations/<org>/tls/ca.crt
```

`network/deploy.sh:47` loops over `example.com` only — on the four-MSP consortium, run the
approval once per org, each with that org's certificate.

### Step 4 — commit

```bash
peer lifecycle chaincode commit \
  -o localhost:7050 \
  --channelID greentoken-channel \
  --name greentoken \
  --version 1.0.0 \
  --sequence 1 \
  --peer.address localhost:7051 \
  --tlsClientCertPath /tmp/hyperledger/organizations/peerOrganizations/example.com/tls/client.crt \
  --tlsClientKeyPath  /tmp/hyperledger/organizations/peerOrganizations/example.com/tls/client.key \
  --tlsRootCertPath   /tmp/hyperledger/organizations/peerOrganizations/example.com/tls/ca.crt
```

Commit writes the definition into the channel's configuration block. Only now does the chaincode
respond to invocations.

### Step 5 — verify the deployment

```bash
peer lifecycle chaincode querycommitted --channelID greentoken-channel
peer chaincode invoke -C greentoken-channel -n greentoken \
  -c '{"Args":["WhoAmI"]}' -o localhost:7050 --tlsClientCertPath ... 
```

`WhoAmI` (`chaincode/src/contract.ts:186`) echoes the caller's MSP-derived identity — it proves
that the MSP attributes (`name`, `participantId`) are wired into the chaincode.

---

## 5. Endorsement policy rationale

### 5.1 The rule the use case needs

A token must be endorsed by **two independent organisations**, and the two acceptable endorsers
are the **State Forest Department** (`ForestDeptMSP`) and the **Independent Carbon Auditor**
(`AuditorMSP`). "Two of {Forest Dept, Independent Auditor}" therefore means *both* — the set has
exactly two members.

### 5.2 Why two, and why from different organisations

| Concern | How the rule answers it |
|---|---|
| A single approver is the original trust problem | No token can be minted on one signature; the funder cannot be the first to approve their own purchase |
| The planter must not be able to manufacture a quorum | Planters have no verify permission at all (`PlantTree`/`VerifyPlanting` are separate role gates) |
| One person must not sign twice for two organisations | The contract rejects a second endorsement from the same `participantId` (`src/core/chaincode.ts:270`) |
| Government and independent audit must both be on record | The two endorsements are separate transactions from separate orgs, each with its own signature on chain |
| A rejection must be final | Any `REJECT` verdict moves the token to `REJECTED`; it can never be funded |

### 5.3 The policy in Fabric terms

At the **application level** the rule lives in the contract:

```ts
export const REQUIRED_ENDORSEMENTS = 2;              // src/core/chaincode.ts:70
```

and is enforced at `src/core/chaincode.ts:305`:

```ts
} else if (token.endorsements.filter((e) => e.verdict === 'APPROVE').length >= token.requiredEndorsements) {
  token.status = 'VERIFIED';
  token.verifiedAt = nowIso();
}
```

At the **platform level** the same rule is expressed as a state-based endorsement policy on the
`token` key:

```
Signature: NOutOf: 2 of ('ForestDeptMSP'.role,'AuditorMSP'.role)
```

With two principals listed, `NOutOf: 2 of` requires both to sign — a write to a token only
commits if the Forest Department *and* the Independent Auditor have endorsed it.

> `network/deploy.sh` commits without an explicit `-- endorsement-policy`, so the channel's
> **default** policy applies on a stock deployment. To make the platform enforce the quorum as
> well, commit the chaincode with the state-based policy above (or set the channel default), and
> keep the in-contract quorum check as the second line of defence.

---

## 6. Reading a block and verifying a hash

### 6.1 Reading a block on the Fabric network

```bash
# list the blocks of the channel
peer channel getinfo -c greentoken-channel

# pull the blocks as a binary file
peer blockstore get <block-number> -o /tmp/blocks/block_<n>.block

# decode it into readable JSON
configtxlator proto -decode Block /tmp/blocks/block_<n>.block \
  | jq '.data.data[0].payload.data.header | {number, previous_hash, data_hash}'
```

In the decoded header you will find three fields worth recording:

| Field | What it commits to |
|---|---|
| `previous_hash` | the hash of the preceding block — the hash-link |
| `data_hash` | the Merkle root over the transaction hashes in this block |
| `payload_hash` / `header` | the hash of the block header itself |

### 6.2 Verifying a hash by hand

The GreenToken block format is defined in `src/core/ledger.ts:248-269`:

```
blockHash = SHA-256(prevHash | merkleRoot | number | timestamp)
```

So for any block you can recompute the header hash yourself:

```bash
# 1. read the four fields from the decoded block
PREV=...        # previous_hash
ROOT=...        # data_hash (Merkle root)
NUM=...         # block number
TS=...          # timestamp, byte-identical to the one in the header

# 2. recompute
echo -n "${PREV}|${ROOT}|${NUM}|${TS}" | sha256sum

# 3. compare with the stored hash
```

The same three-step check applies one level down:

```
txHash     = SHA-256(txId | type | payloadHash | timestamp)
payloadHash = SHA-256(JSON.stringify(payload))
merkleRoot = Merkle(txHashes)
```

The in-product equivalent of this manual check is `verifyChain()` (`src/core/ledger.ts:347`),
which recomputes all of it from scratch on every render and reports the **first** block where the
recomputed value disagrees with the stored one, naming the cause.

### 6.3 Reading a block in the application

**Ledger Explorer** in the left sidebar lists every block with its hash, previous hash, Merkle
root and the ordering service's signature. Expanding a block shows each transaction, its
`payloadHash`, its `txHash` and the organisation that endorsed it.

---

## 7. Demonstrating tampering and its detection

### 7.1 In the application (the demo path)

1. Left sidebar → **Ledger Explorer**.
2. The integrity card at the top reads **"✓ Chain integrity verified"** and reports that every
   block was re-hashed from scratch.
3. Click **"⚠ Tamper with last block"**. The last transaction's payload is rewritten in place
   (`TAMPERED: true`, `estimatedCo2Kg: 99999`) — `src/core/ledger.ts:418`.
4. The card flips to **"⛔ Tampering detected"**, names the first broken block
   (`First broken block: #N`) and explains the reason:
   *"Transaction \<txId\> payload was altered after endorsement — its stored payload no longer
   hashes to the signed payloadHash."*
5. The sidebar chain pill at the bottom-left also flips to **"Chain integrity broken"**.
6. Click **"↺ Restore chain"** — the chain is rebuilt from the pristine stored payloads and
   **re-signed by the ordering service**; the card returns to **"✓ Chain integrity verified"**.

The demo is repeatable: tamper → detect → restore → tamper again.

### 7.2 What the detection actually proves

| Tamper | Broken invariant | Detected at |
|---|---|---|
| Edit a transaction payload after endorsement | `SHA-256(payload) ≠ payloadHash` | `ledger.ts:376` |
| Edit the block header timestamp | recomputed header hash ≠ stored hash | `ledger.ts:398` |
| Re-point a block at a different predecessor | `prevHash` ≠ previous block's hash | `ledger.ts:352` |
| Alter a transaction so the Merkle root breaks | recomputed root ≠ stored root | `ledger.ts:362` |

### 7.3 On a real Fabric network

The equivalent experiment is to change the world state out of band — for example by writing to
the peer's CouchDB directly — and then observe that the peer's *own* validation rejects the
block on the next configuration update, because the block header hash no longer matches its
contents. `peer channel getinfo` and the peer's log both report the failure.

---

## 8. Commands you can run

### 8.1 Local project

```bash
npm install
npm run dev                     # http://localhost:5173
npm run build                   # tsc -b --noCheck && vite build
npm run typecheck               # strict type check
npx vite preview --port 4173 &  # serve the production build
node scripts/verify.mjs         # 22 end-to-end checks in real Chromium
./scripts/sync-chaincode.sh     # copy the domain module into chaincode/src
```

`scripts/verify.mjs` boots the app in Chromium, plants a tree, endorses it as the Forest
Department, funds a basket as a funder, tampers with the last block, confirms the chain detects
it, restores the chain, and screenshots every screen into `docs/screenshots/`.

### 8.2 The Durable Object backend (no Docker)

```bash
cd worker && npm install && npx wrangler deploy
```

```bash
curl https://greentoken-api.<subdomain>.workers.dev/api/health
curl https://greentoken-api.<subdomain>.workers.dev/api/stats
curl https://greentoken-api.<subdomain>.workers.dev/api/verify-chain
curl https://greentoken-api.<subdomain>.workers.dev/api/blocks
curl https://greentoken-api.<subdomain>.workers.dev/api/tokens?status=VERIFIED
curl -N https://greentoken-api.<subdomain>.workers.dev/api/events/stream   # SSE
```

### 8.3 Fabric network

```bash
cd network
docker compose up -d orderer0 ca0 peer0 couchdb
docker compose --profile cli up cli        # interactive peer CLI

# inside the CLI container
peer channel join --channelID greentoken-channel \
  --peer.address peer0:7051 \
  --tlsClientCertPath /tmp/hyperledger/organizations/peerOrganizations/example.com/tls/client.crt \
  --tlsClientKeyPath  /tmp/hyperledger/organizations/peerOrganizations/example.com/tls/client.key \
  --tlsRootCertPath   /tmp/hyperledger/organizations/peerOrganizations/example.com/tls/ca.crt

peer channel list
peer lifecycle chaincode querycommitted --channelID greentoken-channel
peer chaincode invoke -C greentoken-channel -n greentoken \
  -c '{"Args":["GetStats"]}' -o orderer0:7050 --tlsClientCertPath ...
```

### 8.4 Deploy the chaincode

```bash
cd chaincode && npm install && npm run build && cd ..
./network/deploy.sh
# or, with overrides:
CHANNEL=greentoken-channel CHAINCODE_NAME=greentoken CHAINCODE_VERSION=1.0.0 \
SEQUENCE=1 PEER_CONN=localhost:7051 ORDERER=localhost:7050 PEER_CA=localhost:7054 \
./network/deploy.sh
```

---

## 9. Note on the demo backend

> **The graded demo runs on the Durable Object backend, not on Fabric.**
> A real Hyperledger Fabric network needs Docker and roughly 4 GB of memory; requiring that of
> every examiner and every visitor is not a reasonable constraint. The demo therefore runs on the
> Cloudflare Worker + Durable Object host (`worker/src/index.ts`), where the Durable Object
> *is* the channel: one ordered ledger, serialised writes, chaincode events — the same shape as
> a Fabric ordering service, with no Docker.
>
> **The SAME domain module backs both.** The business rules live in exactly one file,
> `src/core/chaincode.ts`. The Durable Object host executes that file; the Fabric chaincode
> executes `chaincode/src/domain.ts`, which `scripts/sync-chaincode.sh` generates as a
> byte-for-byte copy (verified with `diff`). The two hosts differ only in the adapter:
> `MemoryStub` versus `fabric-shim`'s `Context`. The browser SPA embeds the same module again
> through `src/core/ledger.ts`.
>
> The Fabric network is real and is shipped — `network/docker-compose.yaml`,
> `network/README.md` and `network/deploy.sh` (package → install → approve → commit) — and is the
> subject of this lab record. What runs in front of an examiner is the same contract on a
> different host.

---

## 10. Observations to write down

Fill these in after running the session; they are the examiner's likely questions.

### 10.1 Deployment

| # | Observation | Your answer |
|---|---|---|
| 1 | Which four MSPs joined `greentoken-channel`, and what may each do? | PlantersAssociationMSP plants; ForestDeptMSP and AuditorMSP verify; CorporateFundersMSP funds. Settlement is admitted to the Auditor and the Funder only. |
| 2 | Why must the chaincode be approved by *every* organisation before commit? | The channel's endorsement policy requires the definition to be approved by the organisations named in it; commit fails until the quorum of approvals is met. |
| 3 | What is the difference between install and commit? | Install places the package on the peer; commit writes the definition into the channel configuration and makes the chaincode invokable. |
| 4 | What does `peer lifecycle chaincode querycommitted` show? | The definition currently committed to the channel: name, version, sequence, endorsement policy, and the approvals collected so far. |
| 5 | What did `WhoAmI` return, and what does it prove? | The caller's org, display name and participant id, resolved from the MSP certificate's attributes — proving identity comes from the MSP, not from the request body. |

### 10.2 Endorsement and quorum

| # | Observation | Your answer |
|---|---|---|
| 6 | What stops one organisation from approving twice? | The contract rejects a second endorsement from the same participant id (`src/core/chaincode.ts:270`). |
| 7 | What happens to a token on a `REJECT` verdict? | Status becomes `REJECTED`, `verifiedAt` is stamped, the status index is moved, and the token can never be funded. |
| 8 | Which two organisations may verify? | `ForestDeptMSP` (State Forest Department) and `AuditorMSP` (Independent Carbon Auditor) — `requireOrg(stub, ['VERIFIER','AUDITOR'])`. |
| 9 | Is a token fundable while it is still `PENDING`? | No. `FundTokens` rejects the whole basket if any token is not `VERIFIED`. |

### 10.3 Money

| # | Observation | Your answer |
|---|---|---|
| 10 | What discount did the 70-unit bulk purchase get? | 5% — the ladder is `500→15%`, `200→10%`, `50→5%`, `1→0%`, resolved inside `FundTokens`. Gross ₹10,500, discount ₹525, net ₹9,975 at ₹150/token. |
| 11 | Can the client ask for a different discount? | No. The client sends `units` and `pricePerToken`; the percentage comes from `DISCOUNT_TIERS` inside the contract. |
| 12 | Who may settle an invoice? | A funder or the independent auditor. The State Forest Department is **not** permitted to settle — the role gate is `['FUNDER','AUDITOR']`. |

### 10.4 Integrity

| # | Observation | Your answer |
|---|---|---|
| 13 | What exactly did the tamper button change? | The last block's first transaction payload — it adds `TAMPERED: true` and sets `estimatedCo2Kg: 99999`. |
| 14 | How was the tampering detected? | `verifyChain()` recomputes the payload hash, the transaction hash, the Merkle root and the block header hash from scratch and reports the first block where the recomputed value differs from the stored one. |
| 15 | Why does one altered transaction break the whole block? | The Merkle root over the transaction hashes is committed to in the block header, and the header hash is chained into the next block. |
| 16 | Can the tamper be undone? | Yes — `restoreChain()` restores the pristine payloads from an internal copy and re-signs every block with the ordering service key. |

### 10.5 Scope

| # | Observation | Your answer |
|---|---|---|
| 17 | Is the planter's contact number on the shared ledger? | In this build it is written to the token object but withheld from the public read view — emulated privacy. A production Fabric build should use a private data collection. |
| 18 | Where does the CO₂ figure come from? | A static species rate table (10 species, 22–33 kg CO₂ per tree per year) multiplied by the tree count. It is not a measured sequestration model. |
| 19 | Is the GPS coordinate trusted? | Yes, it is trusted on submission. Production would need device attestation or a second geolocation source. |
| 20 | Is the demo the Fabric network? | No — the demo is the Durable Object host, because Fabric needs Docker. The same domain module backs both; see §9. |

---

## 11. Evidence checklist

| Item | Where |
|---|---|
| Compose topology and ports | `network/docker-compose.yaml`, `network/README.md` |
| Certificate and MSP generation | `network/README.md` §3 (`cryptogen`) |
| Channel creation and join | `network/README.md` §4 (`configtxgen`) |
| Chaincode deployment log | `network/deploy.sh` output |
| Block and hash inspection | `peer blockstore get` + `configtxlator proto -decode` (§6.1) |
| Recomputed hash | manual `sha256sum` check (§6.2) |
| Tamper demonstration | screen recording / screenshots of Ledger Explorer (§7.1) |
| Application screenshots | `docs/screenshots/01-dashboard.png` … `12-token-provenance.png` |
| Automated proof | `node scripts/verify.mjs` → 22/22 checks passed |
