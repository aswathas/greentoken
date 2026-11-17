# Change inventory — smartcontracts teaching deck

**Date:** 17 November 2026
**Branch:** `feat/smartcontracts-teaching-deck`
**Base:** `main` @ `e0b079a` ("Story deck sidecar checksum")
**Push target:** `origin/feat/smartcontracts-teaching-deck` (then a PR into `main`)

Every file below is **new**. Nothing in the existing application (`src/`, `chaincode/`, `worker/`,
`network/`, `dist-deliverables/`) is modified, moved or deleted.

---

## Added — `smartcontracts/`

| File | Bytes | What it is | Why it is here |
|---|---|---|---|
| `smartcontracts/README.md` | 5.7 KB | What the pack is, how to rebuild it, the demo in nine steps, the constraints it was built under. | A folder with a deck and no explanation is a folder nobody opens twice. |
| `smartcontracts/deck/SmartContract-A-Promise-That-Keeps-Itself.pptx` | 751 KB | The deck. 21 slides: 13 spoken (timed to 600 s) + 8 appendix. Speaker notes on every slide. Native editable diagrams. | The deliverable. |
| `smartcontracts/deck/SmartContract-A-Promise-That-Keeps-Itself.pdf` | 433 KB | The same deck as PDF. | Opening it on a machine without PowerPoint, and the offline pack. |
| `smartcontracts/docs/run-of-show.md` | 14 KB | The full script: 13 opening lines with seconds, 9 demo steps with verbatim lines, 4 likely questions with answers, 4 contingencies, pre-flight list, callback line mapped to all six acts. | "Also add a script inside" — the presenter needs the whole thing, not a summary. |
| `smartcontracts/docs/presenter-script.pdf` | 179 KB | One A4 landscape sheet. Talk cues left, demo steps centre, questions / numbers / contingencies right. | What is actually on the lectern during the session. |
| `smartcontracts/docs/DEMO-CARD.pdf` | 128 KB | One A5 portrait card. Nine steps, nine numbers, what to do when it breaks. | What is in the presenter's hand during the demo. |
| `smartcontracts/sources/sources.md` | 11.7 KB | Every claim, figure, publisher, title, year, URL and retrieval date behind every number on a slide, plus a number-by-number audit table. | A number with no source does not ship. The path matches what appendix slide A6 points at. |
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

## Not verified

| Check | Why |
|---|---|
| Google Drive upload | Requires one browser consent that has not been granted; the Drive REST call still returns `403 insufficient scopes`. **OneDrive holds the pack instead.** See `docs/reviews/decision-log.md` D-21. |
| The deck opened in Microsoft PowerPoint itself | QA rendering used LibreOffice. Fonts are Arial and Consolas throughout — both safe-list fonts — so the PowerPoint render should match, but it has not been opened in PowerPoint. |
| The live API's *write* paths | Deliberately never exercised. `/api/plant`, `/api/verify`, `/api/fund` and `/api/settle` write to the real channel and were never called — not by the rehearsal, not by any snapshot. The demo runs entirely against the browser-local ledger. |
