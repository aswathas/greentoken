# Change inventory — smartcontracts teaching deck

**Date:** 17 November 2026 (second pass — citation corrections and re-delivery)
**Branch:** `fix/deck-citation-corrections`
**Base:** `main` @ `52aface` ("Merge pull request #4 from aswathas/docs/correct-onedrive-claim")
**Push target:** `origin/fix/deck-citation-corrections` → **PR #5 → merged into `main` as `e1e24a3`** (content commit `67a9d4c`, kept as the merge's second parent)

Every file below was **added** by the original teaching-pack PR (`feat/smartcontracts-teaching-deck` → PR #1 → merged into `main` as `c227ac2`). This branch **modifies** eleven of them, all inside `smartcontracts/`, and adds nothing outside it. Nothing in the existing application (`src/`, `chaincode/`, `worker/`, `network/`, `dist-deliverables/`) is modified, moved or deleted.

---

## Added — `smartcontracts/`

| File | Bytes | What it is | Why it is here |
|---|---|---|---|
| `smartcontracts/README.md` | 7.5 KB | What the pack is, how to rebuild it, the demo in nine steps, the constraints it was built under. | A folder with a deck and no explanation is a folder nobody opens twice. |
| `smartcontracts/deck/SmartContract-A-Promise-That-Keeps-Itself.pptx` | 752 KB | The deck. 21 slides: 13 spoken (timed to 600 s) + 8 appendix. Speaker notes on every slide. Native editable diagrams. | The deliverable. |
| `smartcontracts/deck/SmartContract-A-Promise-That-Keeps-Itself.pdf` | 434 KB | The same deck as PDF. | Opening it on a machine without PowerPoint, and the offline pack. |
| `smartcontracts/docs/run-of-show.md` | 16 KB | The full script: 13 opening lines with seconds, 9 demo steps with verbatim lines, 4 likely questions with answers, 4 contingencies, pre-flight list, callback line mapped to all six acts. | "Also add a script inside" — the presenter needs the whole thing, not a summary. |
| `smartcontracts/docs/presenter-script.pdf` | 179 KB | One A4 landscape sheet. Talk cues left, demo steps centre, questions / numbers / contingencies right. | What is actually on the lectern during the session. |
| `smartcontracts/docs/DEMO-CARD.pdf` | 128 KB | One A5 portrait card. Nine steps, nine numbers, what to do when it breaks. | What is in the presenter's hand during the demo. |
| `smartcontracts/sources/sources.md` | 29 KB | Every claim, figure, publisher, title, year, URL and retrieval date behind every number on a slide, plus a number-by-number audit table **and the two-pass verification log**. | A number with no source does not ship. The path matches what appendix slide A6 points at. |
| `smartcontracts/chain/NUMBERS.txt` | 172 B | The chain snapshot the run-of-show reads from — `GET /api/stats`, 17 November 2026: 9 tokens, 3 verified, 4 funded, 1 pending, 1 rejected, 170 trees, 4 743 kg CO₂, ₹5 550, 29 blocks. | The figures drift as people plant; the pack ships the snapshot it was narrated against. |
| `smartcontracts/build/theme.js` | 4 KB | Palette, type system, and the shared helpers (`ground`, `head`, `foot`, `panel`, `stat`, `chip`, `arrow`, `bullets`, `table`). | One design system for 21 slides; regenerating the deck must not drift the design. |
| `smartcontracts/build/spoken.js` | 34 KB | The 13 spoken slides, one function each, `addNotes` on every one. | The deck must be reproducible, not a binary blob. |
| `smartcontracts/build/appendix.js` | 26 KB | The 8 appendix slides. | Same. |
| `smartcontracts/build/build-deck.js` | 1.7 KB | Assembles 13 + 8 and writes `output/SmartContract-A-Promise-That-Keeps-Itself.pptx`. | The one command that rebuilds the deck. |
| `smartcontracts/scripts/check-fit.py` | 4.4 KB | Text-fit and bounds checker. Parses the OOXML, measures each line against the real TrueType metrics with PIL, flags overflow and out-of-bounds shapes. | Catches the defect class that a slide render hides — text that overflows a shape. |
| `smartcontracts/scripts/render.sh` | 1.5 KB | pptx → PDF → PNG → small JPEG for visual QA. | The visual QA loop. |
| `smartcontracts/scripts/make-cards.py` | 13 KB | Builds `presenter-script.pdf` and `DEMO-CARD.pdf` from HTML via headless Chrome. | The two cards are generated, so they stay in step with the script. |
| `smartcontracts/scripts/pack.py` | 2.5 KB | Builds the no-network `output/offline/` folder and the deliverable zip. | The offline fallback and the WhatsApp bundle come from one command, so they cannot drift. |
| `smartcontracts/docs/rehearsal/step5-refusal.png` | 201 KB | The contract refusing the duplicate photo — the Act-3 money shot, captured live on 17 November 2026. | The repo's claims about the demo are verifiable, not asserted. |
| `smartcontracts/docs/rehearsal/step8-tampered.png` | 304 KB | The red block and *"⛔ Tampering detected"* in the Ledger Explorer. | Same. |
| `smartcontracts/docs/rehearsal/rehearsal-log.txt` | 2.7 KB | The whole nine-step run, including the network log that proves zero non-GET requests. | Same. |

## Modified in this branch — `fix/deck-citation-corrections`

Eleven files, all inside `smartcontracts/` except the two review docs. Every change is a
**citation correction** or the artefact rebuilt from one, plus the record of it.

| File | Bytes | What changed |
|---|---|---|
| `smartcontracts/build/spoken.js` | 43.0 KB | Slide 2's clip caption → the **54-second** clip. Slide 4's spoken line → *"In 2024, 71 Mt of credits were issued and never used"* (UNCTAD's year). Slide 4's source line → MSCI (Jan 2026) + UNCTAD (2025), two publishers kept separate. Slide 5's two regulatory bands → India's **Energy Conservation Act 2001, s. 14(w)** with the **Grid Controller of India** running the ICM registry and BEE administering; CBAM's **10 % cap labelled trade-press reporting of a May 2026 draft**. Slide 5's source line and notes rewritten to match. |
| `smartcontracts/build/appendix.js` | 27.5 KB | A6's deck line shortened so it stays on one line inside its box; A6's India row → *"Carbon Credit Trading Scheme, India — in force — Ministry of Power / CERC / BEE — 2023–24"*. |
| `smartcontracts/build/theme.js` | 6.7 KB | `foot()` now gives a source line longer than 185 characters a two-row box (`H − 0.70`, height 0.46) instead of one, so the longer, corrected source lines cannot overflow or collide with the block above. |
| `smartcontracts/scripts/make-cards.py` | 16.3 KB | The presenter sheet and the demo card said *"the first two minutes"* / *"2-minute clip open in a second tab"* — both now **54-second**, matching the deck. |
| `smartcontracts/deck/SmartContract-A-Promise-That-Keeps-Itself.pptx` | 752 KB | Rebuilt from the corrected generator. md5 `7d2cd64427fb1dab51582ede9c5359a4`. |
| `smartcontracts/deck/SmartContract-A-Promise-That-Keeps-Itself.pdf` | 434 KB | LibreOffice render of the same. md5 `357c0887c1778bafe3ac366e50c79ffc`. |
| `smartcontracts/docs/presenter-script.pdf` | 179 KB | Rebuilt card. md5 `4a8bb8849a47475c885727a3dfbd1b44`. |
| `smartcontracts/docs/DEMO-CARD.pdf` | 128 KB | Rebuilt card. md5 `66deb4e08b390ff2ea77bcec928af9b2`. |
| `smartcontracts/docs/run-of-show.md` | 16 KB | Slide-2 cue → *"Let me play the official clip."*; pre-flight → *"Open the 54-second clip"*; the slide-4 note now states that **71 Mt is 2024's** figure and that "92 Mt" is a different quantity (the arithmetic gap between the two 2025 flow figures). |
| `smartcontracts/sources/sources.md` | 29 KB | **B1** rewritten with MSCI's verified January 2026 wording *and* the note that the 2024 reading came from MSCI's earlier January 2025 post — so the figure is not "fixed" back. **B4** rewritten (publisher UNCTAD, year 2024, verbatim quote). **C2** rewritten (Act 2001, no "Rules 2023", Grid Controller of India as registry operator, BEE as administrator, CERC as regulator). **C4** rewritten (10 % cap = trade press only; the mechanism is the producer's weighted-average carbon price, not a direct deduction). **G2** rewritten (54 seconds, uploaded 1 Sep 2026). The number-audit table and the glossary updated, the verification log gained rows for the two MSCI posts, the UNCTAD PDF, the ICM registry operator, the BEE Detailed Procedure and the CBAM draft, and a **corrections table** now lists all eight corrections — including the one that was **kept**. |
| `smartcontracts/README.md` | 7.5 KB | The constraints section now records the second pass: the 54-second clip, the 71 Mt as 2024's surplus, the Energy Conservation Act 2001 and the *Detailed Procedure for Compliance Mechanism*, the Grid Controller of India as registry operator, and the CBAM 10 % cap labelled as trade-press reporting of a draft. |

## Added — `docs/reviews/`

| File | Bytes | What it is |
|---|---|---|
| `docs/reviews/decision-log.md` | 8.4 KB | Every decision, who made it, the ruling, and what it costs if it is wrong. |
| `docs/reviews/change-inventory.md` | 4.6 KB | This file. |

---

## Not changed

- `src/`, `chaincode/`, `worker/`, `network/` — **untouched.** The deck describes the contract; it does not change it.
- `ppt/`, `docs/architecture.md`, `docs/lab-record.md`, `docs/presentation-notes.md` and the rest of `docs/` — **untouched.** The new material lives in its own folder so it cannot collide with the existing project documents.
- `.gitignore` — **untouched.** Nothing added here needs a new ignore rule.

---

## Verification performed before this push

| Check | Result |
|---|---|
| `python scripts/office/validate.py <deck>` | `All validations PASSED!` — 21 slide parts, 21 notes parts, no placeholders |
| Text extraction from OOXML | 489 runs across 21 slides; no `xxx` / `TODO` / `lorem` / `[insert` placeholder strings |
| `scripts/check-fit.py` | `FIT OK — no overflow, nothing out of bounds` |
| LibreOffice → PDF → 150 dpi PNG | All **21** slides inspected; 11 layout defects found and fixed (band overlaps, orphaned words, a tamper panel drawn over a hash-chain block, three text overflows); re-rendered and re-inspected clean |
| Speaker notes | 21 of 21 notes parts contain real notes; none shorter than 60 characters |
| Live chain | `GET /api/verify-chain` → `{"valid":true,"blockCount":29,"txCount":29}` |
| Live figures | 9 tokens · 3 verified · 4 funded · 1 pending · 1 rejected · 170 trees · 4 743 kg CO₂ · ₹5 550 · 29 blocks |
| Deployment | `https://greentoken-7gc.pages.dev` and `https://greentoken-api.aswathas13.workers.dev` both reachable |
| Card PDFs | `presenter-script.pdf` — 1 page, A4 landscape. `DEMO-CARD.pdf` — 1 page, A5 portrait. Both rendered and read back. |
| **Live nine-step rehearsal** | **Performed 17 November 2026** against `greentoken-7gc.pages.dev` in a throwaway browser profile. Dashboard → plant → **the same file again → the contract refused it** (*"This photo has already been submitted for token GT-000010."*) → tamper → *"⛔ Tampering detected"*, 3 integrity problems → `↺ Restore` → intact → leaderboard. Both money shots captured live: `step5-refusal.png`, `step8-tampered.png`. |
| **Chain safety during the rehearsal** | **Zero non-GET requests** recorded across the whole run — the app's only network call is `GET /api/health`. The chain was re-read after the rehearsal and was unchanged: `{"valid":true,"blockCount":29,"txCount":29}`, 9 tokens, 170 trees, 4 743 kg CO₂, ₹5 550. |
| **Citation verification** | Every URL in `sources/sources.md` fetched on 17 November 2026; the two peer-reviewed papers read at source (West et al. open-access manuscript, 61 pages, from the Cambridge repository; Probst et al. abstract via Europe PMC and OpenAlex). **Four errors found and fixed**, then the deck rebuilt, re-rendered, re-validated and re-sent: *Science* (2023) = **West et al.**, not Probst · *Nature Comms* (2024) = **Probst**, not "Probs" · ">80 %" is overall, not per project type (real reductions run 11 %–68 %) · the script's "92 Mt" is a different quantity from the slide's 71 Mt. |
| Rebuilt deck after the citation fix | `validate.py` → `All validations PASSED!` · `check-fit.py` → `FIT OK — no overflow, nothing out of bounds` · slides 6 and A6 re-rendered and inspected: no overflow, no overlap, both attributions correct. |
| **Copy identity across all four delivery paths** | Deck md5 `7d2cd64427fb1dab51582ede9c5359a4` — identical for the WhatsApp media store copy, the `output/` copy, this repo's `smartcontracts/deck/` copy, the **Google Drive** copy and the OneDrive copy. The script zip is likewise identical (`36dcc19428a079b272e5813e9e09f678`). The deck PDF is `357c0887c1778bafe3ac366e50c79ffc`, the presenter script `4a8bb8849a47475c885727a3dfbd1b44`, the demo card `66deb4e08b390ff2ea77bcec928af9b2`, the run-of-show `e673319f7d5e19…,` and `sources.md` `9568b47da25822fe5081778c128401df`. What was sent is what was built. |
| **WhatsApp media store contents** | `wa.files.list` → exactly two entries: `SmartContract-A-Promise-That-Keeps-Itself.pptx` and `A-Promise-That-Keeps-Itself-Scripts.zip`. No superseded copies left on disk. |
| **WhatsApp delivery receipts** | All three final messages carry `delivered` receipts from the daemon's receipt registry: `3EB03583D729F1E9973B77` (the correction note), `3EB0096FE8DD8A6A242BDE` (the `.pptx`), `3EB058D2F5AA39871576CB` (the zip). The five superseded messages were deleted first. |
| **Google Drive delivery** | Folder `SmartContract-21CSE435T` (id `1wX4SP6MxnlGwJ69Fc8oCO4_A3R7lDFDC`) holds exactly **7 files**, each **md5-verified identical** to the built copy after being re-listed through the API: deck `.pptx` `7d2cd644…`, deck `.pdf` `357c0887…`, zip `36dcc194…`, `presenter-script.pdf` `4a8bb884…`, `DEMO-CARD.pdf` `66deb4e08…`, `run-of-show.md` `e673319f…`, `sources.md` `9568b47d…`. Files were **updated in place** (same Drive file ids), so the folder holds 7 files, not 14. |
| **Second citation pass — against the primary documents** | The first pass trusted search results; this pass fetched the documents. An agent's claim that the `US$ 1.4 bn` market figure belonged to 2024 was **overturned at source** — MSCI's own January 2026 post states the market "remained broadly unchanged **in 2025** at around USD 1.4 billion" (the agent had read MSCI's January 2025 post, where the same number describes 2024), so the deck's figure was **kept** and the reason recorded in `sources/sources.md`. **Four real errors were fixed**: the cold-open clip is **54 seconds**, not two minutes; the **71 Mt** is UNCTAD's **2024** surplus; India's enabling Act is the **Energy Conservation Act 2001, s. 14(w)** with BEE's *Detailed Procedure for Compliance Mechanism* in July 2024 and **no "Standards and Procedures Rules 2023"**; the ICM registry is run by the **Grid Controller of India**, not "BEE-run". One unconfirmable claim was **labelled, not dropped**: the CBAM **10 % cap** is trade-press reporting of a May 2026 draft, and the slide now says so. The deck was rebuilt, re-rendered, re-validated and **re-delivered** to all three live destinations. |
| **Microsoft PowerPoint on this machine** | **Not installed** — `New-Object -ComObject PowerPoint.Application` → `REGDB_E_CLASSNOTREG`; no `HKLM:\SOFTWARE\Microsoft\Office` keys. The PowerPoint render therefore cannot be checked here at all. See decision log D-29. |
| **Story deck's copy of the same citation** | Pinned to one string in one part: `ppt/slides/slide7.xml` in `GreenToken-The-Tree-That-Was-Sold-Twice.pptx`, "Probs et al., Nature Communications (2024)". Not fixed — that deck is published live and re-publishing is a separate, outward-facing job. See decision log D-27. |

## Not verified

| Check | Why |
|---|---|
| **OneDrive as the fallback** | **Not a working delivery target — verified, not assumed.** The pack is physically in `C:\Users\ADMIN\OneDrive\SmartContract-21CSE435T\` (7 files, correct bytes), but the OneDrive client is not syncing the account: `LastSignInTime` is `1739100084` (**February 2025**), the client burns ~1–2 s of CPU and sits idle, and after a full stop-and-restart its `SyncEngineDatabase.db` still lists only the five 2025 seed files (`Document 1/2/3.docx`, `Document.docx`, `Getting started with OneDrive.pdf`) and five seed folders — `SmartContract-21CSE435T` is **not** in `od_ClientFile_Records` or `od_ClientFolder_Records`. A raw byte grep and a proper column query across all 25 of OneDrive's SQLite databases and 47 `.db`/`.db-wal`/`.db-shm` files return zero hits for the folder name. Fixing it needs an interactive OneDrive sign-in, which is the same class of human action as the Drive consent. | Medium — this is the difference between a file on the machine and a file in the cloud. The honest position is that **WhatsApp, GitHub and Google Drive are the three delivered targets**, and OneDrive currently holds a local copy only. |
| The deck opened in Microsoft PowerPoint itself | QA rendering used LibreOffice. Fonts are Arial and Consolas throughout — both safe-list fonts — so the PowerPoint render should match, but it has not been opened in PowerPoint. |
| The live API's *write* paths | Deliberately never exercised. `/api/plant`, `/api/verify`, `/api/fund` and `/api/settle` write to the real channel and were never called — not by the rehearsal, not by any snapshot. The demo runs entirely against the browser-local ledger. |
| That the superseded WhatsApp messages vanished for the user | `wa.deleteMessage` returned `revoked: true` for all five, but the chat read model still enumerates them with their original captions and `status: delivered`. The revocation cannot be confirmed as having propagated to the user's client. |
| The deck's *published* copy in the repo | The repo copy is updated in this branch; `main` only carries it once this branch is merged. |
