# Presentation Notes — GreenToken

**Deck:** `ppt/slides/output/GreenToken-Verifiable-Carbon-Tokens-Unit5.pptx` (21 slides)
**Live demo:** <https://greentoken-7gc.pages.dev>
**Unit 5 — Developing Smart Contracts and Use Cases** · 21CSE432IT — Blockchain Technology with Hyperledger Fabric

How to use these notes: each slide gives you **3–5 sentences to say**, written to be spoken, not
read. They are deliberately short — the deck carries the detail, you carry the argument. The
long-form click path for the live demo is in [§2](#2-live-demo-click-path), and the five most
likely viva questions with model answers are in [§3](#3-viva-and-exam-questions).

Companion documents: [`demo-run-of-show.md`](./demo-run-of-show.md) (the narrated walkthrough),
[`architecture.md`](./architecture.md) (the technical detail behind every claim),
[`lab-record.md`](./lab-record.md) (the Fabric deployment record).

---

## 0. Pre-flight (2 minutes, before the projector is on)

1. Open the live URL in a **new window**, full screen, bookmarks bar hidden.
2. Switch the identity to **Lakshmi Gowda (Sahyadri Planters Association)** so the first click of
   the demo is legal.
3. Have the **Ledger Explorer** page understood, not pre-loaded — you need the click on
   *Ledger Explorer* to be part of the story.
4. Keep `node scripts/verify.mjs` output handy as the answer to "how do you know it works?"
5. Do **not** open DevTools. If a question needs proof, move to the code, not the console.

Total speaking time: ~18 minutes of slides + ~8 minutes of demo + questions.

---

## 1. Slide-by-slide speaker notes

### Slide 1 — Title

> "Good morning. This is GreenToken: a working application and a working smart contract that turn
> a geo-stamped planting photo into a verifiable, transferable carbon token. The planter is a
> citizen, the endorsers are the State Forest Department and an independent carbon auditor, and
> the buyer is a corporate funder — and all three act on one shared, tamper-evident record.
> Everything you will see today is running code: the live link, the chaincode, and a deployment
> script for a real Hyperledger Fabric network."

Point at the last line of the title slide when you say "one smart contract, three hosts" — you
return to it on slide 7.

---

### Slide 2 — Contents

> "Here is the shape of the talk. I start with the problem, then the solution in one slide, then
> how the project maps onto the Unit 5 use cases. The second half is the substance: the
> architecture, the contract itself, the cryptography, and then a live demo that includes a
> tamper test. I finish with results, deployment and an honest list of limitations."

Do not read the eight headings aloud — they are on the slide. Just signpost that the demo comes
at slide 13.

---

### Slide 3 — The problem

> "Three failures, all of them familiar. First, a paper register is not evidence: a photo, a GPS
> coordinate anyone can edit, and one person's signature are the entire trust model of most
> plantation schemes. Second, the buyer pays for a number, not a tree — they cannot tell whether
> 500 trees were planted, where, or whether the same photo was submitted twice.
> Third, money and impact never meet, because the planter, the verifier and the funder keep
> separate records and reconcile in spreadsheets months later."

Point at the trust-gap strip at the bottom: "One planter self-reports; one verifier approves on
their word alone; the funder pays against a spreadsheet. No shared record, no proof of work, no
audit trail." That strip is the problem statement in one line — deliver it verbatim.

---

### Slide 4 — The solution (comparison table)

> "Here is what the ledger actually changes, dimension by dimension. Evidence goes from a photo
> and a self-reported coordinate to a SHA-256 of the photo and a geo-hash, both fixed at
> submission. Trust goes from one approver's word to two independent organisations signing with
> digital signatures. Identity goes from whatever the spreadsheet says to MSP-backed identity
> with role attributes that the contract enforces. And tampering goes from silently corrected to
> detected and localised to the exact broken block."

Land the line at the bottom of the slide — read it exactly: "Blockchain does not make trees grow.
It makes the claim about a tree checkable."

---

### Slide 5 — GreenToken in one slide (Proof / Trust / Money)

> "Proof: the photo bytes are hashed to SHA-256 and the GPS payload to a geo-hash, and the
> accuracy radius is recorded — 320 metres is rejected, you will see that later. Trust: no single
> organisation can mint a token, because two independent endorsements are required, one from the
> Forest Department and one from the independent auditor, and the role is enforced from the MSP
> attributes inside the contract. Money: funding becomes a ledger transaction — funders browse
> real plantings on a map, one invoice covers the basket, the discount ladder is applied in the
> contract, and settlement releases funds to the planter."

Point at the bottom band: "One token = one tree = one verifiable, transferable, tradeable carbon
credit." Then add: "And a token is only mintable after two independent endorsements — that
quorum rule is in the smart contract, not in the UI."

---

### Slide 6 — Unit 5 coverage

> "This is the syllabus mapping. Use case 1 on provenance, visibility, trade finance and invoice
> management with discounting are all fully implemented and all live in the contract.
> Use case 2 on digital identity and record keeping between government entities is implemented;
> the PDS and social-welfare row is implemented at the model level, with the land-records and
> entitlement modules as the planned extension. The security requirement — blockchain
> cryptography and privacy — is fully implemented, and the practical requirement to build a
> network and deploy a contract is covered by the Fabric v2.5 chaincode and the Durable Object
> host."

Point at the legend and say it once: "Solid dot = fully implemented, half dot = implemented at
the model level with the extension planned." Be precise here — an examiner will check.

---

### Slide 7 — Architecture (one smart contract, three deployment targets)

> "This is the architectural claim of the project. The business rules live in exactly one file,
> `src/core/chaincode.ts`, and that file imports no platform SDK at all. Each host supplies a
> thin adapter that implements the same `ChaincodeStub` interface: the browser supplies an
> in-memory stub, the Cloudflare Worker supplies a Durable Object, and Fabric supplies the
> `fabric-shim` context. So a change to the contract changes all three hosts at once, and the
> chaincode I deploy to a real Fabric network is the same code the demo runs."

If asked: "The Durable Object *is* the channel — it holds the ordered ledger and serialises every
write, the same job the ordering service does. The Fabric adapter is
`chaincode/src/contract.ts`; the domain module is copied there byte-for-byte by
`scripts/sync-chaincode.sh`."

---

### Slide 8 — The token lifecycle

> "Six stages, and every arrow is a chaincode function call — the contract decides what is legal,
> not the interface. Plant writes the hashed evidence. Verify records an independent signature.
> Mint is the state change at quorum of two: the token becomes VERIFIED and mintable as a credit.
> Discover is the read model, Fund issues one invoice for the whole basket, and Settle releases
> the funds. The four states on the bottom are the whole vocabulary of the system."

Point at the last line: "REJECTED — any reviewer may reject a proof; the token is closed and never
fundable." Say it explicitly, because the rejection path is part of the trust model.

---

### Slide 9 — The smart contract (assets, functions, events)

> "Left column: the world state, addressed by composite keys — one key per token, one per invoice,
> and five indexes so that 'all verified mangoes in Mandya' is a range scan rather than a full
> table walk. Middle column: four write functions and six read models, plus `WhoAmI` for identity
> checking. Right column: the four chaincode events, which are exactly what the dashboard feed and
> the SSE stream consume — the same mechanism Fabric uses for event subscriptions."

Then the guardrails, one sentence each: "Unknown species is rejected. Only VERIFIED tokens are
fundable. One endorsement per reviewer. A failed transaction is discarded and never written to
the ledger." Close with the invariant that matters: "All state writes funnel through the
chaincode — the UI cannot write state directly."

---

### Slide 10 — Cryptography & security

> "Four layers, and each one catches a different attack. Layer one is the evidence hash: change
> one pixel of the photo and the digest on chain no longer matches the image. Layer two is the
> geo-hash: the coordinates are bound to the submission, so they cannot be moved later. Layer
> three folds every transaction hash into a Merkle root, so one altered transaction breaks the
> block. Layer four chains the block header to the previous one, so an edit cascades down the
> entire chain."

Move to the "live proof" box and say: "I am not going to assert that this works — in a few
minutes I will tamper with the last block in front of you, and the verifier will name the broken
block and the reason." Then add the signature fact: "Every endorsement and every block is signed
with ECDSA P-256 using the organisation's MSP identity."

---

### Slide 11 — Privacy & access control

> "The matrix is enforced in the contract, not in the interface. Planters may plant and read;
> the Forest Department and the auditor may verify; the funder may fund; the funder and the
> auditor may settle. Two details worth saying out loud. First, the planter's phone number is
> private data — it is never part of the public token view and funders can read species, GPS,
> hashes and endorsements but never the contact. Second, the contract rejects a second
> endorsement from the same participant, so one person cannot manufacture a quorum by signing
> twice."

Close with: "The UI merely hides the button; the contract rejects the transaction."

---

### Slide 12 — Trade finance

> "The discount ladder lives in the contract: one unit is zero per cent, fifty units earns five
> per cent, two hundred earns ten, five hundred earns fifteen. The client cannot choose its own
> discount — if the browser tried to send forty per cent, the contract would ignore it. The
> worked example is the seeded bulk purchase: seventy tokens at ₹150 is ₹10,500 gross, five per
> cent off, ₹525 discount, ₹9,975 net payable."

Then the three panels: "Provenance-priced — a token can only be funded after its provenance is
verified, so the finance follows the evidence. Basket invoices — one invoice covers many tokens
from many planters, one settlement, one audit trail. Auto-disbursement — settlement releases the
net amount and records it on chain, replacing manual reconciliation."

---

### Slide 13 — Live demo 1 of 4: the consortium at a glance

> "Here is the running system. Nine tokens on chain — and I want to be precise about that: they
> are not hand-written rows. The seed replays the actual chaincode, PlantTree then
> VerifyPlanting then FundTokens then SettleFunding, so every hash, every signature and every
> Merkle root on this screen is genuine. One hundred and seventy trees, about 4.7 tonnes of
> estimated CO₂ computed from species rate times tree count inside the contract, and ₹5,550
> already disbursed across two settled invoices. Twenty-nine blocks, and the integrity ring
> re-hashes the entire chain on every render — it is not a badge someone typed."

Then: "The identity switcher in the top-right lets the same application act as any of the four
organisations — which is how I will show you the roles."

---

### Slide 14 — Live demo 2 of 4: funders find real plantings

> "Discover is the funder's view: every verified token carries a real GPS coordinate, a photo
> hash and a species rate, and the funder can filter by district, species or free text. Verify
> is the reviewer's queue: it shows the geo-stamp accuracy, the photo hash and how many of the
> two required endorsements are already in, and the Forest Department and the independent auditor
> sign separately. Note the rejected proof still sits on the ledger — rejection is evidence too,
> and that token can never be funded."

If the examiner asks about the rejected row: it is the seeded Mango plantation in Nagpur whose
geo-stamp accuracy was 320 metres — outside tolerance — and it was rejected by the Chief Forest
Officer, so it is permanently closed.

---

### Slide 15 — Live demo 3 of 4: funding a basket, then settling

> "Fund: the funder ticks verified tokens into one basket, and the contract prices the basket,
> applies the bulk discount and issues a single invoice covering every token and every planter in
> it. Settle: each invoice keeps gross, discount and net side by side and lists the tokens it
> covers, and settling releases the funds to the planters and records it on chain. The important
> guardrail is at the bottom — only VERIFIED tokens can enter a basket, and the contract rejects
> the whole invoice if a single token is not eligible."

---

### Slide 16 — Live demo 4 of 4: proving the ledger cannot be edited

> "Explore: every block shows its previous hash, its Merkle root and the ordering service's
> signature, and expanding a block shows the transactions, their payload hashes and who endorsed
> them. Tamper: one click rewrites a signed transaction, and the verifier recomputes every hash
> from scratch, names the broken block and explains exactly what no longer matches — and
> 'Restore chain' re-signs the whole chain. This is the single best slide for the examiner,
> because the property is executed in front of you rather than asserted."

---

### Slide 17 — Results

> "What the running demo actually produced. Nine tokens minted from nine planting submissions;
> one hundred and seventy trees across eight planters in seven districts; about 4.7 tonnes of CO₂
> per year estimated by species rate times tree count; three invoices worth ₹15,525 in total, of
> which ₹5,550 is already settled; the chain grew from 29 blocks upward with every interaction —
> 32 after the automated run, 33 once the live path has planted, endorsed twice and funded; and
> twenty-two out of twenty-two automated checks pass end-to-end in a real browser."

Then the trust argument, slowly: "Every one of those figures is read back out of ledger state by
the same read models the app exposes over HTTP. Nothing on the dashboard is typed in by hand,
and the leaderboard is a query, not a stored score."

---

### Slide 18 — Deployment

> "The front end is a static SPA on Cloudflare Pages over HTTPS; the API is a Worker plus a
> Durable Object that holds the ordered ledger; and the Fabric v2.5 chaincode is real and
> deployable with `network/deploy.sh`. Why does it run twice? Because one contract has three
> hosts — the browser, the Durable Object and fabric-shim each supply a different stub. The demo
> never depends on Docker, because a multi-gigabyte Fabric network is not a reasonable thing to
> require of an examiner — but Fabric is still real, and the compose file, the chaincode package
> and the install-approve-commit script are all in the repository for the lab record."

If pressed on "is the demo really the blockchain?": "The demo is the Durable Object host. The
business rules are the same file in both cases — `src/core/chaincode.ts` is copied byte-for-byte
to `chaincode/src/domain.ts` — so the Fabric deployment runs identical logic."

---

### Slide 19 — Honest limitations

> "Four limitations, stated deliberately rather than discovered later. Private data is emulated:
> the contact field is withheld from the public token view, but a production Fabric build should
> use a real private data collection. GPS is trusted at submission — production needs device
> attestation or a second geolocation source. The CO₂ rates are a static species table, not a
> measured sequestration model. And there is no on-chain governance: the consortium rules are
> code, not votes."

Then the future scope, quickly: "Land records on the same channel, PDS-style entitlement
accounting, governance by token-holder vote, and oracle feeds for real carbon prices instead of
a fixed ₹150. If I had more time: move the browser demo onto the Durable Object so every
visitor shares one ledger, add a Fabric Gateway client, selective-disclosure credentials, and
Caliper benchmarks."

---

### Slide 20 — Outcomes & references

> "Four course outcomes: build smart contracts for real-time use cases; apply hyperledger trade
> network concepts in business networks; apply smart contract transactions and ledger data
> structures; and develop smart contracts for any use case — that last one is what the
> platform-free domain layer buys us, because the same contract retargets to Fabric, to a Worker
> and to a browser. The references are the standard ones: the Fabric v2.5 documentation, Vaziri,
> Kumar, Zand and Cachter."

---

### Slide 21 — Thank you

> "GreenToken — verifiable blue-green carbon tokens on a tamper-evident ledger. The live demo is
> at greentoken-7gc.pages.dev, the backend is a Worker with a Durable Object, and the Fabric
> chaincode is in `chaincode/src/contract.ts`. Plant it, prove it, tokenise it. I am happy to take
> questions."

Leave this slide up during questions — the three pointers are the three things an examiner is
most likely to ask you to open.

---

## 2. Live-demo click path

### 2.1 The complete path (plant → verify → fund → settle)

The app is a single-page app with a left sidebar and a top-right identity switcher. Every step
below is the exact click path, with the toast you should see.

| # | Where | Click | Expected feedback |
|---|---|---|---|
| 1 | Sidebar | **Plant a Tree** | The planting form opens |
| 2 | Top-right | **Acting as** → *Planters* → **Lakshmi Gowda** | Avatar and org name change to *Sahyadri Planters Association* |
| 3 | Form, right card | **⚡ Generate sample proof** | Fills a proof image, its SHA-256 and the coordinates |
| 4 | Form | **🌱 Submit planting proof** | Toast: `Token GT-000010 created and awaiting verification.` |
| 5 | Sidebar | **Verification** | The new proof is the first card in the queue |
| 6 | Top-right | **Acting as** → *Forest Dept* → **Dr. S. Raghavan** | — |
| 7 | Queue card | **✓ Endorse** (note optional) | Toast: `Endorsement recorded (1/2).` |
| 8 | Top-right | **Acting as** → *Auditors* → **Nikhil Kapoor** | — |
| 9 | Queue card | **✓ Endorse** again | Toast: `Quorum reached — token GT-000010 is VERIFIED and mintable.` |
| 10 | Sidebar | **Discover & Fund** | The status filter defaults to **Verified** — the new token appears |
| 11 | Top-right | **Acting as** → *Funders* → **Aarav Menon** | The pill reads *Funding as Aarav Menon* |
| 12 | Token cards | **+ Add to basket** on two or more VERIFIED cards | The Funding basket panel fills; gross / discount / net appear |
| 13 | Basket panel | **🧾 Issue invoice & fund N token(s)** | Toast: `Invoice INV-2026-0000N issued — N token(s), X% bulk discount applied.` |
| 14 | Sidebar | **Invoices** | The invoice card appears with its discount breakdown |
| 15 | Invoice card | **Settle & release funds** | Toast: `Invoice INV-2026-0000N settled. ₹X released to planters.` |

> Tip for step 10: the Discover page opens with the status filter set to **Verified**, so a
> `PENDING` token is invisible until it has been endorsed — that is intentional, and worth
> saying out loud.

### 2.2 The tamper demonstration — exact path

This is the money moment. Do it slowly, in this order, and let the UI speak.

```
1.  LEFT SIDEBAR  →  click  "Ledger Explorer"

      The page opens with the integrity card at the top:
        "✓ Chain integrity verified"
        "Every one of the N blocks was re-hashed from scratch — Merkle roots,
         transaction hashes and the chain of previous-hash links all match."
      Below it: "How tamper-evidence works here" (the four-step explainer)
      Below that: the block list, newest first, with "Blocks — height N".

2.  INTEGRITY CARD (top right of the card)  →  click  "⚠ Tamper with last block"

      Toast:  "A transaction in block #N was edited. Re-run chain verification."

3.  THE CARD FLIPS TO RED:
        "⛔ Tampering detected"
        "Transaction tx-… payload was altered after endorsement — its stored payload
         no longer hashes to the signed payloadHash."
        "First broken block: #N"
      The sidebar pill at the bottom-left also flips to "Chain integrity broken".

4.  INTEGRITY CARD  →  click  "↺ Restore chain"

      Toast:  "Chain rebuilt — N blocks re-signed by the ordering service."
      The card returns to "✓ Chain integrity verified".

5.  OPTIONAL, IF THE EXAMINER ASKS HOW IT WORKS:
      click "🔍 Re-verify chain"      → re-runs the recomputation on demand
      click "↺ Reset demo"            → reseeds the consortium from the genesis block
      click any ".block__head" row    → expands previous hash, Merkle root,
                                        ordering-service signature and each
                                        transaction with its payload hash
```

**What is actually tampered.** The last block's first transaction payload is rewritten in place:
`TAMPERED: true`, `note: "injected after the fact"`, `estimatedCo2Kg: 99999`. The stored
`payloadHash` is untouched — that is precisely why the check fires.

**The four checks, in the order `verifyChain()` runs them** (state them if asked):

1. `prevHash` of this block equals the previous block's hash;
2. the Merkle root recomputed from the transaction hashes equals the stored root;
3. `SHA-256(payload)` recomputed equals the signed `payloadHash` ← **this is the one that fires**;
4. the recomputed block header hash equals the stored hash.

**Say this sentence:** "Nobody can quietly change history. They can only be caught — and the
verifier tells you exactly which block broke and why."

### 2.3 Fallbacks

| If | Do |
|---|---|
| Map tiles are blank (no internet) | Say so — "it is the OpenStreetMap tile server, not the app" — the markers still plot from the coordinates on chain |
| The browser blocks geolocation (non-HTTPS) | Use **⚡ Generate sample proof** instead of **📍 Use my GPS** |
| The demo link is down | `npm install && npm run dev` — the app is fully functional offline with its own ledger |
| The data looks wrong after a messy demo | Ledger Explorer → **↺ Reset demo** reseeds from the genesis block |
| An examiner asks for proof, not narration | `node scripts/verify.mjs` → 22/22 checks, plus `curl .../api/verify-chain` |

---

## 3. Viva and exam questions

### Q1 — "Is this really Hyperledger Fabric, or a simulation?"

> "The smart contract is real Fabric v2.5 TypeScript chaincode — `chaincode/src/contract.ts`,
> built on `fabric-shim` 2.5, deployed by `network/deploy.sh` through the full package → install
> → approve → commit lifecycle. The business logic in `src/core/chaincode.ts` contains no
> platform imports; each host supplies its own adapter implementing the same `ChaincodeStub`
> interface. The demo you just saw ran on the Cloudflare Durable Object, which is a real
> ordering-and-commit host that needs no Docker — and the same contract runs unchanged on
> Fabric, because `chaincode/src/domain.ts` is a byte-for-byte copy of the domain module."

### Q2 — "Why two endorsements? Isn't one enough?"

> "One approver *is* the original trust problem — that is exactly what the use case is fixing.
> Two independent organisations, the State Forest Department and the Independent Carbon
> Auditor, must both sign; the contract requires two approvals, rejects a second endorsement
> from the same participant so one person cannot manufacture a quorum, and closes a token
> permanently on any rejection. On Fabric the same rule is expressible as a state-based
> endorsement policy, `NOutOf: 2 of ('ForestDeptMSP'.role,'AuditorMSP'.role)`. And the quorum
> rule lives in the chaincode, not in the UI."

### Q3 — "How do you know the numbers on the dashboard are real?"

> "They are read out of ledger state by the same read models the API exposes over HTTP — the
> leaderboard is a query over the token and invoice keys, not a stored score, so a planter cannot
> inflate their own carbon number. The seed itself replays the actual chaincode — PlantTree,
> VerifyPlanting, FundTokens, SettleFunding — so every hash and signature on screen is genuine.
> And `node scripts/verify.mjs` drives the real UI in Chromium and asserts twenty-two of these
> behaviours end to end."

### Q4 — "What stops someone quietly editing the ledger?"

> "Four independent hashes. The photo and the geo payload are hashed at submission, so the
> evidence cannot be swapped. Every transaction carries a payload hash and a transaction hash.
> The transaction hashes are folded into a Merkle root that is committed to in the block header.
> The block header commits to the previous block's hash and is signed by the ordering service.
> `verifyChain()` recomputes all of it from scratch on every render — which is why the tamper
> test is a button rather than a promise, and why it names the broken block and the reason
> instead of just saying 'invalid'."

### Q5 — "Can a planter fake it?"

> "Partly — and I would rather be precise than overclaim. The GPS coordinate is trusted at
> submission, which is a stated limitation; production needs device attestation or a second
> geolocation source. What the ledger does guarantee is that the photo hash and the geo hash are
> fixed at submission and bound to the token, that a reviewer sees the accuracy radius before
> approving — the seeded rejection is exactly a 320-metre geo-stamp — and that regardless of the
> photo, the planter still needs two independent endorsements from organisations the planter
> does not control, and a rejection is final."

**Bonus question — "How is the discount computed, and can the client cheat?"**
> "Inside `FundTokens`. The ladder is 1 unit → 0%, 50 → 5%, 200 → 10%, 500 → 15%, and
> `discountForUnits` picks the first tier the basket qualifies for. The client sends only the
> number of units and the unit price; it never sends a percentage. Gross is units times price,
> the discount is a rounded percentage of gross, and net is gross minus discount — and those
> three numbers are stored on the invoice, so a buyer can audit the arithmetic against the
> contract."

**Bonus question — "Where is the data stored, and what are the keys?"**
> "World state, addressed by composite keys: `token:<id>` and `invoice:<id>` for the documents,
> `token~idx:` / `invoice~idx:` for existence checks, and four indexes on the token —
> `idx:district:`, `idx:status:`, `idx:species:` and `idx:planter:` — so a search is a range
> scan rather than a full table walk. Status changes always delete the old index entry and
> write the new one, so a token can never be indexed under two statuses at once. On Fabric this
> is the peer's CouchDB state database; in the demo it is the Durable Object's storage."

---

## 4. Corrections to make out loud

The deck was written from an earlier run of the demo. Three figures on it no longer match what
the code produces — **say the corrected number when you reach those slides** rather than reading
the slide silently.

| Slide | On the slide | What the code actually produces |
|---|---|---|
| 17 | "₹11,550 funder value across 3 invoices" | **₹15,525** net across 3 invoices (₹1,800 + ₹3,750 settled, plus the ₹9,975 bulk invoice) |
| 17 | "across 7 planters in 6 districts" | **8 planters in 7 districts** — the rejected Nagpur token is excluded, and the Idukki Gulmohar token is still `PENDING` but not rejected, so it counts |
| 11 | Forest Department marked as permitted to **Settle** | Settlement is admitted to the **Funder and the Auditor** only — `requireOrg(stub, ['FUNDER','AUDITOR'])` in `src/core/chaincode.ts:437`. The same error appears in `README.md`'s MSP table; report it, do not fix it silently. |

Everything else on the deck matches the code: nine tokens, 170 trees, ~4.7 t CO₂, ₹5,550
disbursed across two settled invoices, 29 → 32 blocks, 22/22 automated checks, the
0/5/10/15% ladder, the ₹150 base price, the 70-unit ₹10,500 → ₹9,975 bulk example, the two-organisation
quorum, and the four MSP names.
