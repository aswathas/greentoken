# Demo run-of-show — GreenToken

**Live URL:** <https://greentoken-7gc.pages.dev>
**Duration:** 6–8 minutes for the walkthrough, 10 minutes with questions.
**Rule:** do not narrate what is on screen — narrate *why* it is there, then let the click speak.

---

## Before you present (2 minutes)

1. Open the URL in a **new browser window**, full screen (F11). Hide your bookmarks bar.
2. Open the **top-right identity switcher** once to show the four organisations, then switch back to **Lakshmi Gowda (Sahyadri Planters Association)**.
3. Have the **Ledger Explorer** tab pre-loaded — you will need it for the tamper test.
4. Check your laptop is on power and the browser is zoomed to 100%.

> If the projector is low-res, use **⌘/Ctrl + +** once or twice to zoom the browser to 125% — the dense screens (ledger, invoices) are the ones that need it.

### If you are demoing on a phone

The app is fluid from 360 px up. Tap the **☰ button top-left** to open the navigation
drawer — all seven sections are in there, plus the brand mark and the chain status. The
same URL, the same live ledger, the same backend. Tapping a section closes the drawer
and opens the page.

The one thing to rehearse is the geo-stamp: on a phone the browser asks for location
permission, and **Allow** gives you a real fix (usually ±10–30 m). If you deny it, the
app explains exactly what to do and offers manual entry — so either way you are not stuck.

---

## The 8-step walkthrough

### 1 · Dashboard — the consortium at a glance (45 s)

Point at the six stat tiles, left to right:

> "Nine tokens on chain, a hundred and seventy trees, 4.7 tonnes of estimated CO₂, and ₹5,550 already disbursed to planters. Below that, 29 blocks — and the ring on the right says *ledger intact*. That is not a static badge: every render re-hashes the entire chain and checks the links. I'll prove that at the end."

Then the live event feed on the right — scroll your eyes over it:

> "Every one of those rows is a chaincode event. PlantTree, VerifyPlanting, FundTokens, SettleFunding. This is the same event stream Fabric publishes to clients."

**Do not** linger here. It is the establishing shot.

---

### 2 · Discover & Fund — what a buyer actually sees (60 s)

Click **Discover & Fund**.

> "This is the funder's view. This map is not decoration — each marker is a token whose GPS coordinates and photo hash are on the ledger. A corporate buyer can filter by district or species and see exactly what they are buying: real coordinates, a real species, a photo hash."

Click one marker, then a token card → **View full provenance**:

> "Here is the whole token. The photo hash, the geo hash, the endorsement signatures, and the raw JSON at the bottom. Nothing is computed on the client — this is the token as it exists on chain."

Go back, and tick **two** VERIFIED tokens into the basket.

> "The funder picks a basket. Now watch what the contract does with it."

---

### 3 · The invoice — discounting is not a UI decision (60 s)

Point at the invoice panel on the right:

> "Gross, discount, net. The discount comes from a ladder in the smart contract — 50 units gives 5%, 200 gives 10%, 500 gives 15%. The client cannot choose its own discount. If the UI tried to send a 40% discount, the contract would ignore it."

**Switch identity** (top-right) to **Aarav Menon (Corporate Green Funders)** — note the app now permits the action.

Click **Issue invoice & fund**.

> "One invoice covers every token and every planter in the basket. That is the trade-finance part of the use case: provenance-priced, basket-invoiced, auto-settled."

---

### 4 · Plant — creating a token (60 s)

Click **Plant a Tree**. Switch identity to **Lakshmi Gowda** if you are not already.

> "A planter submits species, count, GPS and a photo. The important part: the SHA-256 of the photo bytes and of the geo payload are what go on the ledger — not the photo itself."

Click **📍 Use my GPS** (or type coordinates manually if the browser blocks location on a non-HTTPS origin), then **Generate sample proof** if you have no photo handy.

Click **Submit planting proof**.

> "Token GT-000010 created and awaiting verification. Notice the two endorsements required before it can be funded — nobody can mint a token alone."

---

### 5 · Verify — two organisations, not one (60 s)

Click **Verification**. You will see the proof you just submitted.

Switch identity to **Dr. S. Raghavan (State Forest Department)**, click **Endorse**, add a note:

> "The Forest Department approves. One of two. The contract will not let the same reviewer endorse twice, so a single person cannot manufacture a quorum."

Switch identity to **Nikhil Kapoor (Independent Carbon Auditor)** and endorse again — the token flips to **VERIFIED**.

> "Second, independent organisation. Now the token is mintable. Notice the geo accuracy is on the card — a poor GPS radius is visible to the reviewer before they approve, and the seeded example shows a rejection at 320 metres."

---

### 6 · Ledger Explorer — show the chain (60 s)

Click **Ledger Explorer**. Expand the top block.

> "Every block carries its previous hash, its Merkle root over the transaction hashes, and the ordering service's signature. Expanding it shows each transaction, its payload hash, and which organisation endorsed it."

This is the slide the examiner will want to see. Do not rush it.

---

### 7 · The tamper test — the money moment (90 s)

Still in Ledger Explorer:

> "Now the part most projects claim and cannot demonstrate. I am going to tamper with the last block."

Click **⚠ Tamper with last block**.

The card flips to red:

> "The verifier recomputed every hash from scratch and found the break. It does not just say *invalid* — it names block 32 and says exactly what no longer matches: the transaction payload was altered after endorsement, so the stored payload no longer hashes to the signed payload hash. Nobody can quietly change history; they can only be caught."

Click **↺ Restore chain**:

> "And it restores, by re-signing from the stored transactions. The tamper test is repeatable — you can run it yourself from the link."

---

### 8 · Leaderboard + close (45 s)

Click **Leaderboard**:

> "The leaderboard is a query, not a stored score. It is computed from ledger state, so a planter cannot inflate their own carbon number — the endorsements are on chain. Same for every number on the dashboard."

Close on the deck's final slide: *"Plant it. Prove it. Tokenise it."*

---

## Anticipated questions

**"Is this really Hyperledger Fabric, or a simulation?"**
> The smart contract is real Fabric v2.5 TypeScript chaincode — it is in `chaincode/src/contract.ts` and deploys with `network/deploy.sh`. The business logic in `src/core/chaincode.ts` contains no platform imports; each host supplies its own adapter. The demo you just saw ran on a Cloudflare Durable Object, which is a real ordering-and-commit host that needs no Docker. The same contract runs unchanged on Fabric.

**"Where is the data stored?"**
> World state on the ledger, indexed by composite keys — token, invoice, and indexes by district, species, status and planter. Reads are served from state; writes are transactions.

**"Can a planter fake it?"**
> They would have to photograph the same tree twice, and each photo's SHA-256 is bound to a geo-hash and a distinct token id. A reviewer sees the GPS accuracy. And they still need two independent endorsements from organisations the planter does not control.

**"Why two endorsements? Isn't one enough?"**
> One approver is the original trust problem. Two independent organisations — the Forest Department and an independent auditor — must both sign, and the contract enforces that one participant cannot endorse twice. That quorum rule lives in the chaincode, not in the UI.

**"What if the Forest Department is corrupt?"**
> That is why the second signature comes from a separate organisation, and why auditors can read everything while planters' contact details stay private. Full on-chain governance, where the consortium changes the rules by vote, is listed as future scope.

**"How do you know the numbers on the dashboard are real?"**
> They are read out of ledger state by the same read models the API exposes — I can show you the HTTP endpoint. Nothing on that dashboard is typed in by hand.

---

## If something goes wrong

| Problem | Fix |
|---|---|
| Map tiles are blank | The map needs internet for OpenStreetMap tiles. The markers still plot — say so and move on; it is a tile server, not your app. |
| Browser blocks geolocation | Non-HTTPS origins get blocked. Click **Generate sample proof** instead — it fills coordinates and a proof image. |
| The demo link is down | Run `npm run dev` locally in the project folder; the app is fully functional offline with its own ledger. |
| You need to reset the data | **Ledger Explorer → Reset demo** reseeds from the genesis block. |
| Projection looks blurry | Browser zoom to 125–150%; the app is responsive down to 360px wide. |
| Phone shows no navigation | Tap **☰ top-left** for the drawer. If the layout looks squashed, pull the page from the top or rotate. |
