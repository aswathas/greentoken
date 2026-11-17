# Decision log — smartcontracts teaching deck

**Scope of this log:** every decision taken while building `smartcontracts/` (the *A Promise That
Keeps Itself* teaching pack for 21CSE435T) and every decision the user made or confirmed in
conversation.

**Date:** 17 November 2026
**Author of the work:** Claude Code, at the direction of Aswath AS (RA2311050010060)
**Repo:** `aswathas/greentoken` (public)

Format: `D-nn · decision · ruling · cost if wrong`. A decision is only closed once its cost has been
priced.

---

## Decisions the user made

| # | Decision | Ruling | Cost if wrong |
|---|---|---|---|
| D-01 | Deck title | **"A Promise That Keeps Itself."** The title is the thesis: a smart contract is a promise that keeps itself, unlike a carbon credit, which is a promise sold to strangers. | Low. It is a title. The deck's argument does not depend on it, and the callback line ("Every how-to needs proof") carries the session independently. |
| D-02 | Session length | **10 minutes**, with the demo as a segment *on top of* the talk, not inside it. | Low. The 13 spoken slides are timed to 600 s exactly, and a 4-minute trimmed demo is specified, so both a 10-minute-total and a 10-minute-talk-plus-demo reading are covered. |
| D-03 | GitHub destination | A **`smartcontracts/` folder inside `aswathas/greentoken`**, not a new standalone repository. | Low. The folder is self-contained with its own README; it can be lifted into its own repo later with no content change. |
| D-04 | Delivery | WhatsApp + GitHub + Drive/OneDrive, and the user explicitly waived further approval gates ("i accept all your things"). | Medium. This authorisation was given for *this* delivery. It does not extend to a future push of unrelated code. |
| D-05 | Deck's teaching arc | The user's own sequence, made explicit: **world going bad → what is affecting it (global warming) → who causes it (companies) → what the legal regulation is → why this concept → how our app changes the landscape → why it is better**, anchored on the *How to Live on Earth* video. | High if ignored — this is the request. It is honoured slide-for-slide (slides 2→3→5→6→8→9→11). |

---

## Decisions taken during the build

| # | Decision | Ruling | Cost if wrong |
|---|---|---|---|
| D-06 | Which video | The **official Open Planet upload of *How to Live on Earth*** is linked, not copied. Slide 2 is a drawn title card carrying a live hyperlink to the 2-minute clip, plus the full-film URL. | Medium. If the upload is taken down, the cold open degrades to a narrated still — and the deck says so on the slide ("We link the film. We never copy a frame of it"). No footage is committed to the repo, so nothing is lost. |
| D-07 | Live chain access | **GET only** against `greentoken-api.aswathas13.workers.dev`. No `POST` to `/api/plant`, `/verify`, `/fund` or `/settle` — those write to the real channel. | Low, and it is the single most important safety rule in this build. A POST would have polluted a live channel with fake tokens and fake endorsements. |
| D-08 | Demo climax | Step 5 — **planting the same photograph twice** and watching the contract refuse it — is the climax of the whole session, not a supporting detail. It realises the "tree sold twice" failure mode from the climate evidence, at a size the class can hold. | High if it fails: the session's emotional peak evaporates. Mitigated by (a) proving the refusal exists in `src/core/chaincode.ts` before writing the script, (b) proving that "⚡ Generate sample proof" always mints a new hash, so the run-of-show tells the presenter to upload **the same file** twice, and (c) a contingency that falls back to showing the rule in code rather than faking the toast. |
| D-09 | Course identity | The deck says **21CSE435T · Smart Contracts and Application Development** everywhere. | Medium if wrong — a wrong course code on a submitted deck is embarrassing in front of the teacher. Resolved by reading the SRM syllabus PDF directly (course at PDF pp. 394–396), which also corrected the older Unit-5 deck's `21CSE432IT` and the "Unit 5" label. |
| D-10 | Deck structure | **13 spoken slides (timed to 600 s) + 8 appendix slides.** Teaching depth lives in the appendix, which doubles as the Q&A bank and the student handout. | Low. The appendix slides are promoted into the talk in a defined order if the slot is longer, so the split is reversible. |
| D-11 | Diagram approach | Every diagram is **native PowerPoint** — shapes, connectors and one native chart — not a picture of a diagram. | Low. It costs more generator code, but the teacher and the students can open the file and change a box. |
| D-12 | Video slide mechanics | PowerPoint's online-video feature does not reliably embed YouTube, so the slide carries a **hyperlink on a drawn play triangle** and the pre-flight opens the clip in a second browser tab. | Low. The hyperlink works in both PowerPoint and LibreOffice; the fallback tab covers the rest. |
| D-13 | Ledger honesty | Appendix A7 states plainly what is **real** and what is **emulated**. The photo and the GPS come from the planter — the oracle is the weak link, and slide 9 says so on the slide. | Low, and refusing to state it would have been the bigger risk: a teacher who spots the gap would own the session. |
| D-14 | Numbers on slides | **Every number carries a source line** (publisher, title, year) and resolves in `smartcontracts/sources/sources.md`. A figure with no source does not ship. | Medium. It slows the build down, and it is the difference between a deck that survives a teacher's scrutiny and one that does not. |
| D-15 | CBAM Article 6 credit deduction | Labeled on the slide as a **May 2026 draft**, not as law. | Low if the label is right; high if it is dropped. It is stated as a draft in the slide's source line and in the sources file. |
| D-16 | Deck delivery to WhatsApp | Sent to the personal chat (`143731818778782@lid`) as **two attachments**: the `.pptx`, and a zip of the deck PDF + presenter script + demo card + run-of-show. | Low. Two clean attachments, no superseded versions. |
| D-17 | Google Drive | Drive is **not** configured on this machine (no `rclone`, no Drive client, no `drive.file` credential). An ADC consent flow was started; if it does not complete, the fallback is **OneDrive** and the fallback is stated plainly rather than implied. | Low. Nothing is claimed that was not verified. |
| D-18 | Repo checkout | The **only** checkout of `aswathas/greentoken` in this work is the shallow clone used to add `smartcontracts/`. The live demo needs no clone at all. | Low. The clone exists for the push the user asked for, and nothing in it is modified. |
| D-19 | Branch discipline | Work lands on a **branch**, never directly on `main`; no published commit is ever amended. | Low. |
| D-20 | Compression of the "why" | The deck compresses the climate physics to a single slide, because the existing story deck (`The tree that was sold twice`) already owns that material. The new deck's job is the **law** and the **concept**. | Low. If the class receives both decks, the physics slides are familiar rather than duplicated. |
| D-22 | Live rehearsal of the nine demo steps | **Performed on 17 November 2026** against the live deployment in a throwaway browser profile. The nine steps ran end-to-end: dashboard → plant → **same file again → the contract refused it** (*"This photo has already been submitted for token GT-000010."*) → tamper → *"⛔ Tampering detected"*, 3 integrity problems → `↺ Restore` → intact. The refusal toast and the tamper banner were **captured live** (`step5-refusal.png`, `step8-tampered.png`) and are the offline fallback, not the show. | Low now, high if it had failed: the deck's climax depends on the contract actually refusing. It does, and it was proven by running it, not by reading the source. |
| D-23 | Chain safety during the rehearsal | The rehearsal made **zero non-GET requests** — the app's only network call is `GET /api/health`, and the ledger is browser-local (`localStorage`, key `greentoken.ledger.v1`). After the rehearsal the live chain was re-read: still `{"valid":true,"blockCount":29,"txCount":29}`, still 9 tokens, 170 trees, 4 743 kg CO₂, ₹5 550 — **unchanged**. | High if wrong — a rehearsal must never write to a production channel. It did not. |
| D-24 | Google Drive | Drive REST rejected the `gcloud` access token with `403 Request had insufficient authentication scopes`. The ADC consent needs one browser click that did not complete before the token expired. **OneDrive is the stated fallback** and holds the pack; the report says so plainly rather than claiming a Drive upload that did not happen. | Low. Nothing is claimed that was not verified. |
| D-26 | Citation verification before the push | Every URL in `sources/sources.md` was fetched on 17 November 2026, and the two peer-reviewed papers were read **at source** — the open-access West et al. manuscript from the Cambridge repository (61 pages) and the Probst et al. abstract via Europe PMC. **Four citation errors were found and fixed** before the push: the *Science* (2023) paper is **West et al.**, not Probst; the *Nature Communications* (2024) author is **Probst**, not "Probs"; the ">80 %" is an overall figure, not a per-project-type one; and the script's "92 Mt" is a different quantity from the slide's 71 Mt. The deck was rebuilt, re-rendered, re-validated and re-sent. | **High.** A wrong author attribution on the evidence slide is the fastest way to lose a teacher's trust — and the "80 %+ / across every project type" wording was an over-claim the paper does not support (per-type real reductions run 11 %–68 %). |
| D-27 | The published story deck's copy of the same figure | The 30-slide story deck (`GreenToken-The-Tree-That-Was-Sold-Twice.pptx`) carries the **same misspelling** — "Probs et al., Nature Communications (2024)" — in its source line. It was **not** rebuilt: it is a separate deliverable, already published at `greentoken-7gc.pages.dev/downloads`, and rebuilding and re-publishing it is a different job. The user was told. | Low for this push; medium for the other deck. The new deck is correct; the old one still says "Probs". Fixing it means regenerating the story deck and re-uploading it to the site. |

---

## Open items at the time of writing

| # | Item | Status |
|---|---|---|
| D-21 | Google Drive upload | **Still pending one browser consent.** `gcloud auth application-default login --scopes=…/cloud-platform,…/drive.file` opens a consent page; the click has not been completed, so no ADC file exists and the Drive REST call still returns `403 insufficient scopes`. **OneDrive holds the pack now.** To finish the Drive upload later, run the login command and complete the consent — the token then reaches Drive. | Low. The user was told Drive is unavailable and OneDrive is the fallback, with the exact command. |
| D-25 | The deck opened in Microsoft PowerPoint itself | QA rendering used LibreOffice. Fonts are Arial and Consolas throughout — both safe-list fonts — so the PowerPoint render should match, but the file has not been opened in PowerPoint on this machine. | Low. The pptx passes schema validation and `check-fit.py`; PowerPoint-specific rendering is the only untested surface. |

