# GreenToken — Verifiable Blue-Green Carbon Tokens

> **Unit 5 — Developing Smart Contracts and Use Cases**
> Course: 21CSE432IT · Blockchain Technology with Hyperledger Fabric

Plant a tree, prove it with a geo-stamped photo, mint a tamper-evident carbon token.
Independent verifiers endorse the proof, funders discover real plantings on a map and
fund them with a discounted invoice, and the leaderboard is derived from ledger state
rather than a spreadsheet.

**Live demo:** <https://greentoken-7gc.pages.dev>

**Topics:** `hyperledger-fabric` · `blockchain` · `smart-contracts` · `carbon-tokens` · `react` · `typescript` · `cloudflare` · `21CSE432IT`

[![Live demo](https://img.shields.io/badge/live%20demo-greentoken--7gc.pages.dev-1E8E4E?style=flat-square)](https://greentoken-7gc.pages.dev)
[![Stack](https://img.shields.io/badge/React_18-Vite-3178C6?style=flat-square&logo=react)](https://vitejs.dev)
[![Fabric](https://img.shields.io/badge/chaincode-Hyperledger_Fabric_v2.5-344E41?style=flat-square)](https://hyperledger-fabric.readthedocs.io)
[![Backend](https://img.shields.io/badge/API-Cloudflare_Workers%20%2B%20Durable_Object-F38020?style=flat-square)](https://developers.cloudflare.com/workers/)
[![Mobile](https://img.shields.io/badge/mobile-responsive_360px--1600px-1E8E4E?style=flat-square)](https://greentoken-7gc.pages.dev)

---

## Live demo

**→ <https://greentoken-7gc.pages.dev>**

![GreenToken dashboard — live deployment](https://greentoken-7gc.pages.dev/downloads/live-deploy.png)

Open it on a phone or a laptop — the layout is responsive from 360 px upward and the
whole flow (plant → verify → fund → settle → tamper test) works on a touch screen.

A guided run-of-show with timings, exact click paths, the wording for the tamper
demonstration and answers to the likely viva questions lives in
[`docs/demo-run-of-show.md`](docs/demo-run-of-show.md). A one-page printable version is
in [`dist-deliverables/DEMO-CARD.pdf`](dist-deliverables/DEMO-CARD.pdf).

| | |
|---|---|
| **App (static SPA)** | <https://greentoken-7gc.pages.dev> |
| **Backend API** | <https://greentoken-api.aswathas13.workers.dev/api/health> |
| **Channel** | `greentoken-channel` |
| **Ledger** | 29 blocks · 9 tokens · 170 trees · 4.7 t CO₂ |

---

## Deliverables

Everything below is committed in this repository and downloadable directly from it.

| Deliverable | Download | What it is |
|---|---|---|
| **Presentation deck** | [`.pptx`](https://greentoken-7gc.pages.dev/downloads/GreenToken-Verifiable-Carbon-Tokens-Unit5.pptx) · [PDF](https://greentoken-7gc.pages.dev/downloads/GreenToken-Verifiable-Carbon-Tokens-Unit5.pdf) | 21 slides · the full Unit 5 pitch, built on the white-and-green theme |
| **Study guide** | [PDF](https://greentoken-7gc.pages.dev/downloads/GreenToken-Fabric-Guide.pdf) | 30 pages · Fabric from first principles, the architecture, the demo script and 20 viva Q&A with answers |
| **Diagram pack** | [PDF](https://greentoken-7gc.pages.dev/downloads/GreenToken-Fabric-Diagrams.pdf) | 15 pages · 13 full-page diagrams mapping the project onto Fabric — the components, the six-phase lifecycle, endorsement and quorum, ledger anatomy, tamper localisation, and the honest scope |
| **Case study report** | [PDF](https://greentoken-7gc.pages.dev/downloads/GreenToken-Case-Study-21CSE435T.pdf) · [DOCX](https://greentoken-7gc.pages.dev/downloads/GreenToken-Case-Study-21CSE435T.docx) | 38 pages · the full departmental case-study format — title page, declaration, certificate, acknowledgements, abstract, contents, ten numbered chapters, evidence register, references |
| **First-principles course** | [PDF](https://greentoken-7gc.pages.dev/downloads/Hyperledger-Fabric-First-Principles.pdf) | 15 pages · Hyperledger Fabric taught from the ground up in the Feynman mould — start from what breaks, rebuild each idea, and land inside our own contract |
| **Demo card** | [PDF](https://greentoken-7gc.pages.dev/downloads/DEMO-CARD.pdf) | One printable page · the whole demo on a card to hold during the presentation |
| **Run of show** | [`docs/demo-run-of-show.md`](docs/demo-run-of-show.md) | Timed script with exact click paths and the wording for the tamper demonstration |
| **Live demo** | <https://greentoken-7gc.pages.dev> | The running application — plant → verify → fund → settle → tamper test |

The deck, the study guide, the diagram pack, the case study report and the demo
card are served straight from the live deployment, so the links above never rot. The **same bytes are also committed in
this repository** as `.b64` files under `dist-deliverables/` — run

```bash
./scripts/restore-deliverables.sh      # decodes them back to .pptx / .pdf
```

to materialise the real files locally, or

```bash
./scripts/fetch-deliverables.sh        # downloads everything + verifies checksums
```

to pull the deliverables *and* the screenshots from the live deployment in one
command.

### The first-principles course

[`Hyperledger-Fabric-First-Principles.pdf`](https://greentoken-7gc.pages.dev/downloads/Hyperledger-Fabric-First-Principles.pdf)
is 15 pages that teach Hyperledger Fabric the way Feynman would: no definition is
given before the problem it solves, and every idea has to survive a plain-language
test.

Each page follows the same four beats — **The question** (what actually goes
wrong), **First principles** (the construction, built from nothing), **The Feynman
check** (can you say it in one sentence?), and **In GreenToken** (the same idea in
our code, with a real number).

| Part | Pages | What it teaches |
|---|---|---|
| The problem | 3 | Four parties, four notebooks, and what actually breaks |
| The cryptography | 4–5 | SHA-256, the hash chain, signatures, Merkle trees — and why you need all four |
| The machinery | 6–9 | The six components, the six-phase lifecycle, endorsement and quorum, privacy |
| Our project | 10 | Every idea above, assembled into GreenToken |
| Beyond | 11–13 | The v2.5 advanced shelf, the honest boundaries, and a one-page revision card |

The spine of the argument: a hash chain gives you **tamper-evidence** — it tells
you *where* history was changed — but not tamper-prevention. Only the signatures
close that gap. Get that one distinction right and the rest of Fabric stops being
a list of components to memorise.

### The case study report

[`GreenToken-Case-Study-21CSE435T.pdf`](https://greentoken-7gc.pages.dev/downloads/GreenToken-Case-Study-21CSE435T.pdf)
is a 38-page case study written to the departmental template for
**21CSE435T — Smart Contracts and Application Development**: the same A4 page
set-up, Times New Roman, justified 1.5-spaced body, blue numbered headings,
dark-headed tables with captions above, captioned figures, a page-numbered
footer, and the full preliminary-pages structure (title page, own-work
declaration, bonafide certificate, acknowledgements, abstract, contents,
lists of figures and tables, abbreviations).

| Chapter | Content |
|---|---|
| 1 | Title identification and case context — the carbon-credit verification gap |
| 2 | One-page abstract, research questions, objectives and methodology |
| 3 | Literature review — consortium ledgers, Fabric architecture, the transaction lifecycle, MRV |
| 4 | Analytical contribution, research gap, alternatives considered, success criteria |
| 5 | Development roadmap and delivery timeline |
| 6 | Architecture and design — the consortium, the contract, the data model, the threat model |
| 7 | Implementation — the three hosts, the front end, the deployment, the test programme |
| 8 | Evaluation framework and validation plan |
| 9 | Results and discussion — measured ledger results, business outcome, scenario analysis, limitations |
| 10 | Conclusions, recommendation and an adoption checklist |
| A | Evidence register and eight review questions |

The Table of Contents, List of Figures and List of Tables are not typed by hand:
the builder renders the document, measures where every section, figure and
table actually falls, and writes those page numbers back into the front
matter — so the contents cannot disagree with the body.

Regenerate it with:

```bash
python3 scripts/build-case-study.py
```

Set your name and register number in the two constants at the top of that
script before regenerating.

### The diagram pack

[`GreenToken-Fabric-Diagrams.pdf`](https://greentoken-7gc.pages.dev/downloads/GreenToken-Fabric-Diagrams.pdf)
is the visual companion to the study guide — thirteen full-page diagrams, one
concept per page, each with a plain-English caption and a **Say it** line for
the viva. It is also the fastest answer to "draw the architecture":

| Page | Diagram |
|---|---|
| 3 | The five Fabric components and how GreenToken uses them |
| 4 | The consortium — four MSPs, one channel, one orderer |
| 5 | The six-phase transaction lifecycle, traced through `VerifyPlanting` |
| 6 | Endorsement and quorum anatomy — two signatures, two organisations |
| 7 | Ledger anatomy — block header, transactions, Merkle root, world state |
| 8 | The hash chain and how a tamper is localised |
| 9 | One contract, three hosts |
| 10 | The token state machine and the end-to-end flow |
| 11 | The eight trust rules, mapped to the code that enforces them |
| 12 | Determinism and private data |
| 13 | Reads versus writes, and what the Gateway does |
| 14 | What is real and what is emulated |
| 15 | One-page revision sheet |

**Screenshots** of every screen (desktop and mobile) are served from
[`/downloads/`](https://greentoken-7gc.pages.dev/downloads/live-deploy.png) and live in
`docs/screenshots/` in the source tree:

![Discover and fund](https://greentoken-7gc.pages.dev/downloads/02-discover-map.png)

![Ledger explorer](https://greentoken-7gc.pages.dev/downloads/09-ledger-explorer.png)

![Mobile dashboard](https://greentoken-7gc.pages.dev/downloads/mobile-dashboard.png)

---

## Design

The interface is a single token-driven system, rebuilt as a **white-and-green light
theme** with a real responsive strategy.

- **One accent hue.** `--accent` (#1E8E4E) carries brand and action. Semantic colours
  (`--danger`, `--warning`, `--info`) appear only where they encode state.
- **Three ink levels.** `--text`, `--text-dim`, `--text-faint` — each clears 4.5:1 on
  the surface it sits on.
- **One spacing scale.** 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 px. Every gap in the app
  resolves to it.
- **Mobile-first.** The desktop sidebar is replaced by a slide-in drawer below 980 px,
  so all seven sections stay reachable at 360 px. Nothing is hidden from the user.
- **Motion with a purpose.** Ambient drift, micro-interactions and a bespoke animated
  SVG hero — all driven by Framer Motion, all gated behind `prefers-reduced-motion`.
- **Tabular numerals** on every figure that changes or aligns in a column.

The theme, spacing and responsive rules live in
[`src/styles.css`](src/styles.css); the motion layer in
[`src/motion/`](src/motion).

---

## What it does

| Stage | What happens | Chaincode function |
|---|---|---|
| **Plant** | A planter submits species, tree count, a GPS coordinate and a photo. The SHA-256 of the photo bytes and of the geo payload are written to the ledger. | `PlantTree` |
| **Verify** | Two independent organisations (State Forest Department + Independent Carbon Auditor) inspect the proof and endorse it with a signature. | `VerifyPlanting` |
| **Mint** | At quorum of two approvals from two *distinct* organisations the token becomes `VERIFIED` and mintable as a transferable credit. | state change |
| **Discover** | Funders browse verified tokens on a map with real coordinates, species and photo hashes. | `SearchTokens` |
| **Fund** | One invoice covers the whole basket; the bulk discount ladder (0/5/10/15%) is applied inside the contract. | `FundTokens` |
| **Settle** | Net funds are released to the planters and recorded on chain. | `SettleFunding` |

Four organisations share one channel:

| MSP | Role | Can |
|---|---|---|
| `PlantersAssociationMSP` | Sahyadri Planters Association | submit planting proofs |
| `ForestDeptMSP` | State Forest Department | endorse / reject proofs |
| `AuditorMSP` | Independent Carbon Auditor | endorse / reject proofs, settle |
| `CorporateFundersMSP` | Corporate Green Funders | fund verified tokens, settle |

---

## Run it locally

```bash
npm install
npm run dev          # http://localhost:5173
```

The demo runs entirely in the browser — no Docker, no external services, no accounts.
State persists in `localStorage`; **Ledger Explorer → Reset demo** reseeds the consortium
from the genesis block.

### Verify it end to end

```bash
npm run build
npx vite preview --port 4173 &
node scripts/verify.mjs      # 22 automated checks in real Chromium
node scripts/contract-rules-check.mjs   # 42 contract-rule checks against src/core
```

`scripts/verify.mjs` drives the actual UI: boots the app, plants a tree, endorses it as
the Forest Department, funds a basket as a funder, tampers with the last block, confirms
the chain detects it, and restores the chain — then screenshots every screen into
`docs/screenshots/`.

`scripts/contract-rules-check.mjs` covers the rules the UI cannot reach: a quorum that
must span two distinct organisations, terminal rejection, one photo per token, a
contract-fixed price and a contract-derived unit count, a status index that never goes
stale, index-backed search, and a planter contact that never reaches the ledger.

---

## Architecture

```
src/            React + Vite + TypeScript front end (7 screens)
src/core/       platform-free domain code — chaincode logic, crypto, ledger
chaincode/      Hyperledger Fabric v2.5 TypeScript chaincode (adapter + shared domain)
worker/         Cloudflare Worker + Durable Object backend
network/        Fabric docker-compose + deploy.sh (install → approve → commit)
ppt/            the presentation deck and its source
```

### One smart contract, three hosts

`src/core/chaincode.ts` contains **only business rules** — it imports no platform SDK.
Each host supplies a thin adapter that implements the same `ChaincodeStub` interface:

| Host | Adapter | Stub |
|---|---|---|
| Browser | `src/core/ledger.ts` | `MemoryStub` over an in-memory world state |
| Cloudflare Worker | `worker/src/index.ts` | Durable Object holding the ordered ledger |
| Hyperledger Fabric | `chaincode/src/contract.ts` | `fabric-shim` `Context` |

After editing `src/core/chaincode.ts`, run `./scripts/sync-chaincode.sh` to copy the
domain into the Fabric package.

### The ledger

Blocks are hash-linked and Merkle-rooted, exactly like Fabric:

```
txHash      = SHA-256(txId | type | payloadHash | timestamp)
merkleRoot  = Merkle(txHashes in block)
blockHash   = SHA-256(prevHash | merkleRoot | number | timestamp)
```

Every block is signed with ECDSA P-256 by the ordering organisation. `verifyChain()`
recomputes every hash from scratch and reports the first block where the recomputed
value disagrees with the stored one — that is the **tamper demo** in the app.

### Cryptography

- **SHA-256** over the photo bytes and over the geo payload — the evidence is fixed at submission.
- **ECDSA P-256** per participant, over endorsements and block headers.
- **Merkle tree** over transaction hashes per block.
- **Hash-linked** block headers, so an edit cascades down the chain.
- **Privacy** — the planter's contact number never reaches the ledger: it is dropped at the chaincode boundary, so it is absent from world state, from the hashed transaction payload and from every read view.

---

## Deploy

### Front end (Cloudflare Pages — already live)

```bash
npm run build
npx wrangler pages deploy dist --project-name greentoken --branch main
# → https://greentoken-7gc.pages.dev
```

The build uses relative asset paths (`base: './'`), so it also works unchanged on
**GitHub Pages** — just publish `dist/` to `gh-pages`.

### API (Cloudflare Workers + Durable Object)

```bash
cd worker
npm install
npx wrangler deploy
```

> Requires a `workers.dev` subdomain. If Cloudflare asks you to register one, open
> **Workers & Pages** in the dashboard once and accept the suggested subdomain.

The Worker exposes:

| Endpoint | Purpose |
|---|---|
| `GET /api/health` | channel status, block height, token count |
| `GET /api/stats` | aggregate network statistics |
| `GET /api/tokens?status=&district=&species=&q=` | filtered token search |
| `GET /api/tokens/:id` | full token provenance |
| `GET /api/leaderboard` | planter ranking derived from ledger state |
| `GET /api/invoices` | invoices with discount breakdown |
| `GET /api/blocks` | the full block chain |
| `GET /api/events` | chaincode event log |
| `GET /api/verify-chain` | full chain integrity verification |
| `POST /api/plant` `/api/verify` `/api/fund` `/api/settle` | chaincode invocations |

### Real Hyperledger Fabric (lab record)

```bash
cd chaincode && npm install && npm run build
cd .. && ./network/deploy.sh
```

`network/deploy.sh` packages the chaincode, installs it on the peer, approves the
definition for each organisation and commits it to the channel.

---

## Unit 5 coverage

| Syllabus item | Implementation |
|---|---|
| UC1 (i) Provenance of goods | `PlantTree` — photo SHA-256 + geo-hash bound to every token |
| UC1 (ii) Visibility | Search + map over every token; read-only ledger for auditors |
| UC1 (iii) Trade / supply chain finance | `FundTokens` + `SettleFunding` move money against verified stock |
| UC1 (iv) Invoice management & discounting | Bulk discount ladder 0/5/10/15% computed in the contract |
| UC2 (i) Digital identity | MSP identities with role attributes; contact kept private |
| UC2 (ii) Record keeping between government entities | Forest Dept, Auditor and Planters share one channel |
| UC2 (iii) PDS / social welfare | Subsidy-style disbursement and entitlement accounting |
| Cryptography, privacy & security | ECDSA signing, hash-linked blocks, role-gated reads |
| Practical: build a network, deploy a contract | Fabric v2.5 chaincode + Cloudflare Durable Object network |

---

## Known limitations

Deliberate, stated scope decisions — not accidents.

- Private data is **not stored**: the contact field is dropped at the chaincode boundary,
  so it is never in world state, in the payload hash or in any read view. A production
  build that needs auditors to *see* the contact should use a real private data collection.
- GPS is trusted on submission; production needs device attestation or a second
  geolocation source.
- CO₂ rates are a static species table, not a measured sequestration model.
- No on-chain governance — the consortium rules are code, not votes.
- The browser demo keeps its own ledger; the Durable Object backend runs the same
  contract but the SPA does not yet point at it by default.

---

## References

- Hyperledger Fabric v2.5 documentation — <https://fabric.readthedocs.io>
- A. Vaziri et al., *Blockchain for Business with Hyperledger Fabric*, 2nd ed.
- A. Kumar, *Hyperledger Fabric In-Depth — Learn, Build and Deploy*
- M. Zand et al., *Hands-On Smart Contract Development with Hyperledger Fabric V2*
- C. Cachter et al., *Blockchain for Business — A Practical Guide for the Next Frontier*
