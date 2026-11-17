# smartcontracts/ — *A Promise That Keeps Itself*

The **21CSE435T · Smart Contracts and Application Development** teaching pack for GreenToken:
a 21-slide classroom deck, the presenter script, the demo run-of-show, and the generator that
builds the deck.

> **The deck is the argument.** A carbon credit is a promise sold to strangers. A smart contract
> is a promise that keeps itself. The talk moves from *the world going bad* → *who causes it* →
> *what the law now demands* → *what the market's proof is actually worth* → *why a contract is
> different* → *what the app changes* → *watch it refuse*. The callback line, **"Every how-to needs
> proof,"** returns after every act, meaning something new each time.

---

## What is in here

| Path | What it is |
|---|---|
| `deck/SmartContract-A-Promise-That-Keeps-Itself.pptx` | The deck. 13 spoken slides timed to **exactly 600 s** + 8 appendix slides. Speaker notes on **every** slide. Every diagram is a native, editable PowerPoint object — no images of diagrams. |
| `deck/SmartContract-A-Promise-That-Keeps-Itself.pdf` | The same deck as a PDF (for a machine without PowerPoint, and for the offline pack). |
| `docs/run-of-show.md` | The full script: 13 opening lines with seconds, the 9 demo steps with verbatim lines, 4 likely questions with answers, 4 contingencies, the pre-flight list, the callback line mapped to all six acts. |
| `docs/presenter-script.pdf` | One printable A4 landscape sheet — talk cues on the left, the demo steps in the middle, questions, numbers and contingencies on the right. |
| `docs/DEMO-CARD.pdf` | One A5 portrait card to hold during the demo: nine steps, nine numbers, what to do when it breaks. |
| `docs/rehearsal/` | The two money shots, captured live on 17 November 2026 against the deployment: `step5-refusal.png` (the contract refusing the duplicate photo) and `step8-tampered.png` (the red block and *"⛔ Tampering detected"*), plus `rehearsal-log.txt` — the full nine-step run and its network log. |
| `sources/sources.md` | Every claim, figure, publisher, title, year, URL and retrieval date behind every number on a slide. This is the path appendix slide A6 points at. |
| `chain/NUMBERS.txt` | The chain snapshot the run-of-show reads from — `GET /api/stats`, 17 November 2026. |
| `build/` | The generator — `theme.js` (palette + type system), `spoken.js` (13 slides), `appendix.js` (8 slides), `build-deck.js` (assembles and writes the file). |
| `scripts/check-fit.py` | Text-fit and bounds checker. Parses the OOXML, measures each line against the real TrueType metrics, and flags any overflow or out-of-bounds shape. |
| `scripts/render.sh` | pptx → PDF → PNG → small JPEG, for visual QA. |
| `scripts/make-cards.py` | Builds `presenter-script.pdf` and `DEMO-CARD.pdf` from HTML via headless Chrome. |
| `scripts/pack.py` | Builds the no-network `output/offline/` folder and the deliverable zip. |

## Rebuilding the deck

```bash
npm install pptxgenjs        # only if `require('pptxgenjs')` fails
node build/build-deck.js     # -> output/SmartContract-A-Promise-That-Keeps-Itself.pptx
python scripts/check-fit.py output/SmartContract-A-Promise-That-Keeps-Itself.pptx
```

`build-deck.js` writes to `output/` next to `build/`. `check-fit.py` must print
`FIT OK — no overflow, nothing out of bounds` before the deck ships.

## The live demo

The demo runs against the deployment in this repository:

- App: **https://greentoken-7gc.pages.dev**
- API: **https://greentoken-api.aswathas13.workers.dev** (read-only for anything outside the demo)

Nine steps, and the climax is step 5: **plant the same photograph twice.** The contract refuses it —
*"This photo has already been submitted for token GT-000010."* — because the SHA-256 of the file
bytes is indexed, so one photo can never back two tokens. That refusal is the failure mode the
lecture spends ten minutes on, caught by code instead of by an audit.

Step 8 is the second money shot: edit one transaction in the Ledger Explorer and the block's
fingerprint breaks the chain, visibly, in front of the class.

> **Rehearsed live on 17 November 2026.** The nine steps were run end-to-end against this
> deployment in a throwaway browser profile. The refusal toast fired, the tamper flipped the chain
> to *"⛔ Tampering detected"*, and `↺ Restore` put it back. The whole rehearsal made **zero
> non-GET requests** — the ledger is browser-local — and the live chain was re-checked afterwards
> and was unchanged. The captures are in `docs/rehearsal/`.

> **Read the screen, not the sheet.** The ledger figures drift as people plant trees. The numbers in
> `docs/run-of-show.md` are the 17 November 2026 snapshot.

## Constraints this deck was built under

- **Read-only against the chain.** Only `GET` is ever used against the live API. The demo writes only
  to the presenter's own browser (`localStorage`, key `greentoken.ledger.v1`).
- **The video is linked, never copied.** Slide 2 carries a hyperlink to the official *How to Live on
  Earth* upload; no frame of it is in the deck.
- **Every number on a slide carries a source line**, and every source line resolves in
  `sources/sources.md`. A number with no source does not ship. That file also carries a
  **verification log**: every URL was fetched on 17 November 2026, and the two peer-reviewed papers
  were read at source — the open-access West et al. manuscript in the Cambridge repository, and the
  Probst et al. abstract via Europe PMC. Four citation errors were found and fixed that way
  (the *Science* 2023 paper is **West et al.**, not Probst; the Nature Communications author is
  **Probst**, not "Probs"; the ">80 %" figure is overall, not per project type; and the script's
  "92 Mt" is not the slide's 71 Mt). A second pass, against the **primary documents** rather than
  search results, found four more and fixed them: the cold-open clip is **54 seconds**, not two
  minutes; the **71 Mt** is UNCTAD's **2024** surplus, while the chart beside it is 2025; India's
  enabling Act is the Energy Conservation Act **2001** and the July 2024 instrument is BEE's
  *Detailed Procedure for Compliance Mechanism* (there is no "Standards and Procedures Rules 2023");
  and the ICM registry is run by the **Grid Controller of India**, with BEE administering the scheme
  — not "BEE-run". The CBAM 10 % cap could not be confirmed on any official EU page; it is now
  labelled as trade-press reporting of a May 2026 draft, and the slide says so. The log lists all
  eight corrections.
- **The deck is a script, not a document.** 13 spoken slides, one idea each, one visual each, no
  text-heavy bullets. The teaching depth lives in the appendix so it can be promoted into the talk
  when the slot is longer, and handed to the students afterwards.

## Why the appendix exists

The 10-minute slot is for the story. The appendix — four principles, state machine, actors, hash
chain, contract rules, evidence table, honest scope, demo cheat-sheet — is the Q&A depth and the
student handout. It is also where the deck is honest: **A7 states plainly what is real and what is
emulated**, because the photo and the GPS come from the planter. The contract cannot verify the
world; it guarantees that what was said cannot be changed or sold twice.

---

*GreenToken · Hyperledger Fabric · carbon tokens · aswathas/greentoken*
