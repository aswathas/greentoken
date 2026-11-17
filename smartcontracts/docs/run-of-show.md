# A Promise That Keeps Itself — Run of Show

**Course:** 21CSE435T · Smart Contracts and Application Development (Professional Elective E, LTPC 300 3)
**Format:** 10-minute talk (13 spoken slides) + live demo (6–7 min full / 4 min trimmed) + 8-slide appendix for Q&A
**Presenter:** Aswath AS · RA2311050010060 · Dr. S. Ganesh Kumar
**Deck:** `SmartContract-A-Promise-That-Keeps-Itself.pptx` (21 slides)
**App:** https://greentoken-7gc.pages.dev  ·  **API:** https://greentoken-api.aswathas13.workers.dev

> **The callback line — "Every how-to needs proof." — appears once in every act, and it means something different each time.**
> 1. the film says the solutions exist → *but a solution nobody can verify is a story*
> 2. the law now says *prove it* → *and no law says who checks, or how*
> 3. the market's proof turns out to be broken → *six per cent*
> 4. a smart contract is a promise that keeps itself → *so the proof is not a document, it is code*
> 5. the demo → *watch it refuse*

---

## PART 1 — THE TALK (10:00 exactly)

Timing is cumulative. If you are running long, cut slides 4 and 10 first (they are context, not argument), never 5, 6 or 9.

| # | Slide | Clock | Sec | Opening line (verbatim cue) |
|---|---|---|---|---|
| 1 | Title | 0:00 | 15 | "Every how-to needs proof. Today I am going to show you a how-to that proves itself." |
| 2 | The video | 0:15 | 40 | "In September, Open Planet released a documentary called *How to Live on Earth*, narrated by Benedict Cumberbatch. Its argument is that the answers already exist. Let me play the first two minutes." |
| 3 | Who is doing this | 0:55 | 55 | "Here is the uncomfortable part of that film. The solutions exist — but thirty-two companies are responsible for half the world's carbon dioxide. Thirty-two. That is good news: a rule for thirty-two companies can be checked." |
| 4 | The escape hatch | 1:50 | 40 | "And this is how it stays that way. A carbon credit is one tonne that somebody else removed from the atmosphere, sold to you so that your number goes down. Look at the scale of the market that now runs on this." |
| 5 | The law arrives | 2:30 | 70 | "So the law caught up. Four layers of it, and every one of them says the same thing — *prove it*. Paris Article 6. India's CCTS 2023. EU CBAM. CSRD and ESRS E1. Look very carefully at that red line: **none of them says who checks.**" |
| 6 | The receipts | 3:40 | 70 | "So I went and checked. Cambridge and Amsterdam looked at eighteen flagship forest projects. Eighty-nine million credits were in play. Five point four million were real. Six per cent." |
| 7 | One photograph, two buyers | 4:50 | 40 | "Kariba is fifteen million tonnes of forest that nobody can point to. Here is the same failure at a size you can hold in your hand. One photograph. Two buyers. One tree." |
| 8 | The three refusals | 5:30 | 55 | "A carbon credit is a promise sold to strangers. A smart contract is a promise that keeps itself. Three refusals do that work." |
| 9 | How it works | 6:25 | 70 | "This is the flow. Eight steps, and every one of them is a rule in code, checked by somebody else. Watch step two — the oracle is the weak link, and I will come back to that." |
| 10 | Where it applies | 7:35 | 55 | "The same three refusals apply to every promise with a shape. Carbon credits need all three at once — which is exactly why this market broke first." |
| 11 | Today vs GreenToken | 8:30 | 70 | "So what changes when the promise is code. Six questions: who owns this, can it be sold twice, who verifies, the price, the audit trail, and a dispute." |
| 12 | The proof (frame) | 9:40 | 15 | "I am going to try two crimes. Sell the same tree twice. Then edit the ledger. And I want you to watch the system refuse." |
| 13 | Close | 9:55 | 5 | "Plant it. Prove it. Tokenise it. Every how-to needs proof — so let the code be the proof." |

**Total: 600 seconds.** Read the opening lines verbatim; they are written to be spoken, not summarised.

### Notes per slide (what the deck says, so you never read the slide)

- **S1** — Do not read the title. Say the callback line and move.
- **S2** — Click the play triangle (it is a live hyperlink to the 2-minute clip). Have the clip already open in a second tab as a fallback. Say: "We link the film. We never copy a frame of it."
- **S3** — Point at the bar first, then the three cards. Do not read all three cards; say "one point seven gigatonnes" and "six hundred and ten megatonnes" out loud and let the cards carry the rest.
- **S4** — The chart is the argument: 294 Mt issued against 202 Mt retired in 2025, and **71 Mt issued but never retired** — claims that exist on paper and are retired by nobody. (Do not say "92 Mt": that is the arithmetic gap between the two flow figures; the number the slide prints, and the number the sources carry, is 71 Mt.)
- **S5** — Slow down on the dashed red band. That is the pivot of the whole talk.
- **S6** — Say the three numbers slowly. Then land: "Six per cent is not proof. It is the market's normal case."
- **S7** — This is the emotional turn. Do not rush it.
- **S8** — Read only the three refusals' sub-lines: "no one can negotiate at run time", "the outcome is written once", "everyone reads the same record".
- **S9** — Trace the arrow with your hand. Name the quorum of two out loud; it is the single most exam-relevant number in the deck.
- **S10** — Do not read the matrix. Say "carbon credits needed all three at once" and move on.
- **S11** — Read the six questions only, then land on the band: "the buyer can open the ledger and recompute the entire history without asking anybody for anything."
- **S12** — Say the two crimes slowly. This is the hand-off to the demo.
- **S13** — Say the three verbs. Stop.

---

## PART 2 — THE DEMO (9 steps)

**The demo sits on top of the talk, not inside it.** Full run ≈ 6–7 minutes. Trimmed run = 4 minutes (marked ★).

**Pre-flight (do all of these before you walk in):**

- [ ] Click **↺ Reset demo** in Ledger Explorer, so the planting creates a fresh token and the tiles read the seeded numbers.
- [ ] Put **one photo file** on the Desktop, ready to select twice. (The duplicate-phash test needs the *same file* uploaded twice. "⚡ Generate sample proof" always mints a new hash — it will *not* trigger the refusal.)
- [ ] Open the 2-minute clip in a second browser tab, muted, ready.
- [ ] Browser: F11, hide bookmarks, zoom 100–125 % for a low-res projector. Test the projector at the back of the room.
- [ ] Confirm the app loads: https://greentoken-7gc.pages.dev → Dashboard.
- [ ] Load the presenter script PDF (Ctrl+P) on a second machine or printed, in case the browser dies.
- [ ] `output/offline/` (screenshots + PDF + this file) on a USB stick as the no-network fallback.

**Route form: `https://greentoken-7gc.pages.dev/#discover` etc.** The deployed app reads the URL hash against the allow-list `dashboard · plant · verify · discover · leaderboard · ledger · invoices`. Use the hash, never a path.

### The steps

| # | Screen | Action | Verbatim line |
|---|---|---|---|
| 1 | **Dashboard** | Read the KPI tiles | "Nine tokens. One hundred and seventy trees. Four point seven tonnes of CO₂. Five thousand five hundred and fifty rupees. None of it was typed in — all of it is computed from the ledger." ★ |
| 2 | **Discover** | Open one token | "A GPS coordinate, a photo hash, a district. This is a position on the ground, not a claim." |
| 3 | **Invoice** | Show the price line | "The price and the discount ladder live in the contract, not in the interface." |
| 4 | **Plant** | Upload the prepared file, submit | "One photograph, one hash, one coordinate. The contact number is dropped before anything is hashed." ★ |
| 5 | **Plant — SAME FILE AGAIN** | Submit the identical file again | **"Now let me sell you the same tree twice."** → the contract refuses: *"This photo has already been submitted for token GT-000010."* → "That is the failure mode from slide 11, refused by the code. Kariba was fifteen million tonnes of that." ★ |
| 6 | **Verify** | Approve as a second organisation | "Two organisations, one review each, quorum of two. The planter cannot approve their own tree." ★ |
| 7 | **Fund + settle** | Fund, then settle | "Funding and settlement are contract transitions, not button presses." |
| 8 | **Ledger Explorer** | Tamper one transaction → the block turns red → **Restore** | "Change one transaction and the fingerprint changes. The block names itself. A database lets you rewrite history if you have the keys; a ledger makes the rewrite provable." ★ |
| 9 | **Leaderboard** | Show the board | "Nobody can inflate their own carbon number. You can only plant more trees." ★ |

★ = keep in the 4-minute version.

### The two money shots

1. **The refusal** (step 5) — the error toast: **"This photo has already been submitted for token GT-000010."** This is the Act-3 "tree sold twice" failure caught by code. It is the emotional climax of the whole session.
2. **The tamper** (step 8) — the banner flips to **"⛔ Tampering detected — transaction in block 030 does not match its stored pre-transaction — it cannot be verified"**, the sidebar badge to **"⛔ Chain integrity broken — 3 problems found"**, and the affected block turns red. This is the difference between a database and a ledger.

Both are presenter-triggered live. If you ever show them as static screenshots, you are narrating a past, and the teacher will ask whether it is real.

> **Both shots were captured live on 17 November 2026** against this deployment, in a throwaway browser
> profile, and are in `output/offline/` as `step5-refusal.png` and `step8-tampered.png` — the no-network
> fallback, not the show. The full rehearsal log is `output/offline/rehearsal-log.txt`.

### The rehearsal (done, 17 November 2026)

The nine steps were run end-to-end against the live app in a throwaway browser profile. Result:

| Step | What happened |
|---|---|
| 1 | Dashboard: 29 blocks, 9 tokens, chain verified. |
| 4 | Plant → toast **"Token GT-000010 created and awaiting verification."** |
| 5 | The **same file again** → toast **"This photo has already been submitted for token GT-000010."** |
| 8 | Tamper → **"⛔ Tampering detected"**, chain integrity broken (3 problems), then **↺ Restore chain** → intact again. |
| 9 | Leaderboard: 30 blocks, 10 tokens. |

**Network safety:** the whole rehearsal made **zero non-GET requests**. The only API call was
`GET /api/health`. The ledger lives in the browser's `localStorage`, and after the rehearsal the live
chain was re-checked: still `{"valid":true,"blockCount":29,"txCount":29}` and still 9 tokens. The
rehearsal changed nothing on the server.

### 4-minute trimmed demo (if the slot is 10 minutes in total)

Keep steps **1** (20 s), **4 + 5** (90 s), **6** (30 s), **8** (60 s), **9** (20 s).
Say one line each for steps 2, 3 and 7 and move on:
- Step 2: "A GPS coordinate and a photo hash — that is a position, not a claim."
- Step 3: "The price is in the contract, not the interface."
- Step 7: "Funding and settlement are transitions in code."

---

## PART 3 — THE NINE NUMBERS (read from the screen, not from this sheet)

Read live at rehearsal time from `chain/NUMBERS.txt` (GET-only, `https://greentoken-api.aswathas13.workers.dev/api/stats`).

```
9 tokens  ·  3 verified  ·  4 funded  ·  1 pending  ·  1 rejected
170 trees  ·  4 743 kg CO₂  ·  ₹5 550  ·  29 blocks
```

Snapshot: 17 November 2026. `GET /api/verify-chain` → `{"valid":true,"blockCount":29,"txCount":29}`.

**These drift.** People plant trees. Read the screen; this sheet is your fallback, not your source.

---

## PART 4 — LIKELY QUESTIONS

**Q1. "Is the photo really the proof? Anyone can upload a stock photo."**
Honest answer: "No — and the deck says so on the appendix slide 'The honest scope'. The photo and the GPS come from the planter; that is the weak link and we call it the oracle. What the contract guarantees is narrower and still valuable: the *same* photo can never back two tokens, the hash cannot be edited after the fact, and two independent organisations must both agree before anything is funded. The chain makes the claim checkable; it does not make it true."

**Q2. "What is the difference between this and a normal database?"**
"Three things. A database can be rewritten by whoever holds the credentials, and nobody can prove it afterwards. A ledger appends signed blocks, each carrying the hash of the one before it, so any edit breaks the chain visibly — `verifyChain()` recomputes all of it. And the transition rules are code, so the outcome does not depend on who is negotiating. A database stores a promise. A ledger enforces one."

**Q3. "Why Hyperledger Fabric and not Ethereum?"**
"Access control. Fabric has real organisation identities — MSPs — and a channel. Here there are four: the planters' association, the state forest department, the corporate green funders and an independent auditor. The endorsement policy requires two *different* organisations, and the code additionally forbids one organisation reviewing twice — otherwise a single organisation with two officers could manufacture the whole quorum. Also: no gas, no token speculation, and the channel is private, which matters when the subject is land and money."

**Bonus question — "What is the biggest limitation?"**
"That the GPS and the photo come from the planter, and the whole credibility of the token rests on the planter being honest about the tree existing. The contract cannot verify the world; it can only guarantee that what was said cannot be changed or sold twice. The quorum of two is there to cover that gap, not to eliminate it."

---

## PART 5 — CONTINGENCIES

| If | Then |
|---|---|
| **No network / the app will not load** | Open `output/offline/` (screenshots + PDF + this script) and narrate the nine steps over the stills. Say plainly: "The room has no network, so I will walk you through the captures I took from this exact deployment yesterday." Do not pretend it is live. |
| **Geolocation is refused by the browser** | Use "⚡ Generate sample proof" — but then **skip step 5** and upload the prepared file for both plantings instead, or the refusal will not fire and the climax is lost. |
| **The map tiles do not load (blank map)** | The markers still plot on the coordinate grid; narrate the coordinates aloud instead of pointing at the map. If the whole Discover screen fails, skip to step 4. |
| **The duplicate photo does not produce a refusal** | Most likely cause: you uploaded a different file, or you used "Generate sample proof". Say: "Let me use the file I prepared." If it still does not refuse, do not fake it — say "the contract only refuses an identical file; let me show you the rule in the code" and open appendix slide A5. |
| **The projector is too low-res / the toast is unreadable** | Maximise the browser, zoom to 125 %, and hold the toast on screen while you speak the line. A screenshot in `output/offline/` is the backup — but say it is a capture. |
| **You are running over time** | Cut slide 4, then slide 10, then the demo steps 2, 3 and 7. Never cut slides 5, 6, 8 or 9, and never cut step 5 of the demo. |

---

## PART 6 — THE CLOSE

End on the three verbs and stop. Do not add a summary slide verbally; the deck's close slide *is* the summary.

> "Plant it. Prove it. Tokenise it. Every how-to needs proof — so let the code be the proof."

Then: "The appendix has the contract rules, the state machine and the source list for every number I have shown you. Questions?"

---

## Numbers cross-check

Every figure above was read from `chain/NUMBERS.txt` (live API, GET only, 17 November 2026) and from `sources/sources.md`. If a figure appears on a slide and is not in one of those two files, it does not belong in this script.
