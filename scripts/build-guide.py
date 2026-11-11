#!/usr/bin/env python3
"""
Build the GreenToken study-guide PDF source HTML.

The document teaches Hyperledger Fabric from first principles, then explains how
the GreenToken app implements it, then gives the exact demo script and a viva
Q&A bank. Every technical claim was checked against the repository source.

Design rule for this file: NO f-strings inside page bodies. A page body is a
list of plain strings; helper functions return HTML. That avoids every
f-string quoting pitfall (a double quote inside an f-string expression is a
syntax error before Python 3.12).

Output: docs/guide.html  ->  docs/GreenToken-Fabric-Guide.pdf
"""
import os
import pathlib

DOCS = pathlib.Path("/workspace/greentoken/docs")
OUT_HTML = DOCS / "guide.html"

PAGES = []


# --------------------------------------------------------------------------
# helpers
# --------------------------------------------------------------------------
PART_OPENER = {"p1", "p2", "p3", "p4", "apx"}
PART_TAG = {
    "p1": "Part 1",
    "p2": "Part 2",
    "p3": "Part 3",
    "p4": "Part 4",
    "apx": "Appendices",
}


def page(pid, title, kicker, chunks, cls="page"):
    head = ""
    if pid in PART_OPENER:
        cls = cls + " page--part"
        head = '<div class="parttag">' + PART_TAG[pid] + "</div>"
    head += "<h2>" + title + "</h2>"
    if kicker:
        head += '<p class="subkicker">' + kicker + "</p>"
    PAGES.append({
        "id": pid, "title": title, "kicker": kicker,
        "body": head + "\n".join(chunks), "cls": cls,
    })


def h2(t):
    return "<h2>" + t + "</h2>"


def h3(t):
    return "<h3>" + t + "</h3>"


def h4(t):
    return "<h4>" + t + "</h4>"


def p(t):
    return "<p>" + t + "</p>"


def lead(t):
    return '<p class="lead">' + t + "</p>"


def tiny(t):
    return '<p class="tiny">' + t + "</p>"


def ul(items):
    return "<ul>" + "".join("<li>" + i + "</li>" for i in items) + "</ul>"


def ol(items):
    return "<ol>" + "".join("<li>" + i + "</li>" for i in items) + "</ol>"


def table(headers, rows, cls=""):
    th = "".join("<th>" + h + "</th>" for h in headers)
    tb = "".join(
        "<tr>" + "".join("<td>" + c + "</td>" for c in r) + "</tr>"
        for r in rows
    )
    return (
        '<table class="' + cls + '"><thead><tr>' + th + "</tr></thead><tbody>"
        + tb + "</tbody></table>"
    )


def note(kind, title, text):
    return (
        '<div class="note note--' + kind + '"><strong>' + title + "</strong><p>"
        + text + "</p></div>"
    )


def code(text):
    return '<pre class="code">' + text + "</pre>"


def say(text):
    return '<div class="say">' + text + "</div>"


def mono(t):
    return '<span class="mono">' + t + "</span>"


def img(path, caption, cls=""):
    return (
        '<figure class="shot ' + cls + '"><img src="' + path + '" alt="'
        + caption + '"><figcaption>' + caption + "</figcaption></figure>"
    )


# ==========================================================================
# 1 — COVER
# ==========================================================================
COVER_SVG = """
<div class="masthead">
  <div class="masthead__mark">
    <svg viewBox="0 0 240 240" width="62" height="62" role="img" aria-label="A tree with a verified carbon token above it">
      <path d="M120 200 V120" stroke="#8FD9AE" stroke-width="8" stroke-linecap="round"/>
      <path d="M120 150 L92 128 M120 170 L150 146" stroke="#8FD9AE" stroke-width="6" stroke-linecap="round"/>
      <path d="M120 118 C88 118 66 98 66 74 C66 54 82 40 100 38 C110 22 128 16 143 22 C162 28 174 44 172 62
               C186 70 192 84 188 97 C182 114 160 118 144 114 Z" fill="#37A869"/>
      <path d="M78 200 H162" stroke="#8FD9AE" stroke-width="6" stroke-linecap="round"/>
      <g transform="translate(120,36)">
        <polygon points="0,-24 20,-12 20,12 0,24 -20,12 -20,-12" fill="none" stroke="#8FD9AE" stroke-width="3"/>
        <path d="M-8 0 L-2 7 L10 -7" fill="none" stroke="#8FD9AE" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
    </svg>
  </div>
  <div class="masthead__type">
    <div class="masthead__word">GREENTOKEN</div>
    <div class="masthead__rule"></div>
    <div class="masthead__sub">21CSE432IT &nbsp;·&nbsp; Blockchain Technology with Hyperledger Fabric &nbsp;·&nbsp; Unit&nbsp;5</div>
  </div>
</div>
<h1 class="cover-title">Hyperledger Fabric,<br><span class="cover-accent">from first principles</span><br>to a live demo</h1>
<p class="cover-sub">A complete study guide and demo script for the GreenToken Unit&nbsp;5 project — what a
blockchain actually is, how Fabric executes a transaction, how this application implements those rules,
and exactly what to click and say when you present it.</p>
<div class="cover-meta">
  <div><span>Course</span><strong>21CSE432IT — Blockchain Technology with Hyperledger Fabric</strong></div>
  <div><span>Unit</span><strong>Unit 5 — Developing Smart Contracts and Use Cases</strong></div>
  <div><span>Live demo</span><strong class="mono">greentoken-7gc.pages.dev</strong></div>
  <div><span>Stack</span><strong>Fabric v2.5 chaincode · Cloudflare Worker + Durable Object · React 18</strong></div>
</div>
<p class="cover-foot">Read Part 1 before you present. It is the part the examiner will probe.</p>
"""

page("cover", "GreenToken — Fabric from first principles to a live demo", "", [COVER_SVG], cls="cover")

# ==========================================================================
# 2 — HOW TO USE + CONTENTS
# ==========================================================================
TOC_ROWS = [
    ("p1", "Part 1 — Fabric from first principles  ·  1.1 The problem a blockchain solves", "3"),
    ("p1-1", "1.2  What a ledger is, and why a database is not enough", "4"),
    ("p1-2", "1.3  The hash chain — the single most important idea", "5"),
    ("p1-3", "1.4  The building blocks: MSP, channel, peer, orderer, chaincode", "6"),
    ("p1-4", "1.5  World state versus the transaction log", "7"),
    ("p1-5", "1.6  The six-phase transaction lifecycle", "8"),
    ("p1-6", "1.7  Determinism, endorsement policies, private data", "9"),
    ("p1-7", "1.8  Fabric versus Ethereum, and what v2.5 changed", "10"),
    ("p2", "Part 2 — How the app works  ·  2.1 The use case and the four organisations", "11"),
    ("p2-1", "2.2  One contract, three hosts", "12"),
    ("p2-2", "2.3  The data model", "13"),
    ("p2-3", "2.4  The ten chaincode functions", "14"),
    ("p2-4", "2.5  The cryptography actually used", "15"),
    ("p2-5", "2.6  The eight trust rules", "16"),
    ("p2-6", "2.7  What is real and what is emulated", "17"),
    ("p3", "Part 3 — The demo  ·  3.1 Pre-flight checklist", "18"),
    ("p3-1", "3.2  The eight-step run of show  —  steps 1–4", "19"),
    ("p3-2", "3.2  The eight-step run of show  —  steps 5–8", "20"),
    ("p3-3", "3.3  The tamper moment, in detail", "21"),
    ("p3-4", "3.4  Presenting on a phone", "22"),
    ("p3-5", "3.5  When it breaks", "23"),
    ("p4", "Part 4 — Viva preparation  ·  4.1 Question bank, with answers", "24"),
    ("p4-1", "4.2  The numbers to memorise", "25"),
    ("p4-2", "4.3  Glossary", "26"),
    ("apx", "Appendix A — File map and how to run it yourself", "27"),
    ("apx-2", "Appendix B — Standing up the real Fabric network", "28"),
    ("apx-3", "Appendix C — References and further reading", "29"),
]

_OVERRIDE = {}
_ovf = pathlib.Path("/workspace/greentoken/docs/guide-pages.json")
if _ovf.exists():
    import json
    _OVERRIDE = json.loads(_ovf.read_text())

_parts = ["p1", "p2", "p3", "p4", "apx"]
_toc = ['<nav class="toc" aria-label="Table of contents">']
for _id, _label, _pg in TOC_ROWS:
    _cls = "toc-row--part" if _id in _parts else "toc-row--sub"
    _show = str(_OVERRIDE.get(_id, _pg))
    _toc.append(
        '<a class="toc-row ' + _cls + '" href="#' + _id + '"><span>' + _label
        + '</span><span class="dots"></span><span class="page-ref">' + _show + "</span></a>"
    )
_toc.append("</nav>")

def _span(first_id, next_id, fallback):
    """Human page range for a part, taken from the real rendered page map."""
    a = _OVERRIDE.get(first_id)
    b = _OVERRIDE.get(next_id)
    if not a or not b:
        return fallback
    return "Pages " + str(a) + "\u2013" + str(b - 1)


_P1_RANGE = _span("p1", "p2", "Pages 4\u201312")
_P2_RANGE = _span("p2", "p3", "Pages 13\u201319")
_P34_RANGE = _span("p3", "apx", "Pages 20\u201329")

HOWTO = [
    lead(
        "This guide has four parts and is meant to be read once, slowly, before you present. "
        "It assumes no prior blockchain knowledge. Read Part&nbsp;1 to understand Fabric properly, "
        "Part&nbsp;2 to understand your own code, Part&nbsp;3 immediately before you demo, and "
        "Part&nbsp;4 the night before the viva."
    ),
    '<div class="grid3">',
    '<div class="mini"><div class="mini__k">READ FIRST</div><h3>Part 1 — Fabric</h3>',
    p(_P1_RANGE + ". The mental model: what a ledger is, what the hash chain guarantees, what each "
      "Fabric component does, and the six phases every transaction goes through."),
    "</div>",
    '<div class="mini"><div class="mini__k">THEN</div><h3>Part 2 — Your app</h3>',
    p(_P2_RANGE + ". How the ten chaincode functions implement the trust rules, how one contract runs "
      "on three different hosts, and an honest account of what is real versus simulated."),
    "</div>",
    '<div class="mini"><div class="mini__k">THE NIGHT BEFORE</div><h3>Parts 3 and 4</h3>',
    p(_P34_RANGE + ". The click-by-click demo script with the exact sentences to say, the questions an "
      "examiner will ask, and the numbers you must know cold."),
    "</div>",
    "</div>",
    h3("How the demo link works"),
    p("There are two URLs, and they are different systems. Know which is which — an examiner will ask."),
    table(
        ["URL", "What it is", "Who owns it"],
        [
            ['<span class="mono">greentoken-7gc.pages.dev</span>',
             "The static front end (HTML, CSS, JavaScript). Served by Cloudflare Pages over HTTPS.",
             "Cloudflare Pages"],
            ['<span class="mono">greentoken-api.aswathas13.workers.dev</span>',
             "The backend API. A Cloudflare Worker plus a Durable Object that holds the ordered ledger.",
             "Cloudflare Workers"],
        ],
    ),
    p('<span class="tight">Both are live and both are verified. The front end probes '
      '<span class="mono">/api/health</span> on every page load and reports the real backend status in '
      "the <em>Network</em> card on the dashboard — so if the API is down, the UI says so rather than "
      "pretending.</span>"),
    "".join(_toc),
]

page("toc", "Contents", "How to use this guide", HOWTO)

# ==========================================================================
# 3 — 1.1 The problem
# ==========================================================================
page("p1", "Part 1 — Hyperledger Fabric from first principles", "1.1  The problem a blockchain solves", [
    lead("Start from the business problem, never from the technology. If you cannot explain why a "
         "shared ledger is needed, you do not understand why any of the machinery exists."),
    h3("Four parties who need to agree on one truth"),
    p("Consider a carbon-credit scheme. Four groups must all believe the same thing:"),
    ul([
        "<strong>Planters Association</strong> — plants trees and wants to be paid for what they planted.",
        "<strong>State Forest Department</strong> — a government regulator that must verify plantings are real.",
        "<strong>Independent Carbon Auditor</strong> — a second, separate reviewer that buyers trust.",
        "<strong>Corporate Green Funders</strong> — buyers who want to buy verified carbon, cheaply, in volume.",
    ]),
    h3("Why the obvious solutions fail"),
    ul([
        "<strong>A shared spreadsheet.</strong> Someone owns it. The owner can edit a row after the fact, "
        "and nobody downstream can prove it. The moment a funder disputes a planting, there is no evidence.",
        "<strong>A government database run by the Forest Department.</strong> Then the Department is the "
        "only auditor of its own approvals. A buyer has no reason to believe the Department's own database.",
        "<strong>Trust between the parties.</strong> Four organisations that want to transact with each "
        "other usually do not fully trust each other — that is precisely why they need a neutral record.",
    ]),
    h3("What a blockchain actually adds"),
    p("Not speed. Not cost. Not “decentralisation” in the abstract. Three specific, testable properties:"),
    ol([
        "<strong>A shared state.</strong> Every participating organisation holds a copy of the same ledger, "
        "so no single party can unilaterally change what the record says.",
        "<strong>Cryptographic tamper-evidence.</strong> Each block commits to the one before it with a "
        "hash. Alter history and the break is detectable by anyone, immediately, with no trusted party "
        "needed to check.",
        "<strong>Rule enforcement by the code itself.</strong> The conditions under which a state change "
        "is valid — who may write, how many approvals are needed, what the price is — live in the smart "
        "contract, not in the goodwill of whoever writes the user interface.",
    ]),
    note("key", "The one-sentence version you should be able to say on demand",
         "A blockchain is a ledger that several organisations share and that nobody can quietly rewrite, "
         "because every record is cryptographically linked to the one before it and the rules for changing "
         "it are enforced by code rather than by trust."),
    p("That is the whole idea. Everything else in this guide is engineering in service of it."),
])

# ==========================================================================
# 4 — 1.2 What a ledger is
# ==========================================================================
page("p1-1", "1.2  What a ledger is, and why a database is not enough", "Part 1 — Fabric fundamentals", [
    lead("A <strong>ledger</strong> is an append-only record of transactions. The word "
         "<em>append-only</em> carries all the weight."),
    h3("Ledger vs. database"),
    ul([
        "A database is optimised for <strong>overwrite</strong>. You update a row, and the old value is gone.",
        "A ledger is optimised for <strong>append</strong>. You add a new entry; nothing already written is "
        "ever modified. Current values are derived by folding history forward.",
    ]),
    h3("What that buys you"),
    ul([
        "<strong>Auditability.</strong> Every state you have ever seen can be reconstructed, because nothing "
        "was thrown away.",
        "<strong>Attribution.</strong> You can always answer “who asked for this, and when?”",
        "<strong>Non-repudiation.</strong> A participant cannot later deny a transaction they signed.",
        "<strong>Independence.</strong> Each organisation can verify the whole history for itself. Nobody "
        "has to be believed.",
    ]),
    h3("Why replication matters"),
    p("A single copy of a ledger is just a database with extra steps. The ledger becomes meaningful when "
       "<strong>several parties hold their own copy</strong> and can compare them. If one party's copy "
       "differs, something went wrong and the difference is detectable."),
    '<div class="callout"><h4>What a blockchain is not</h4>',
    p("It is not a database with extra steps of scale, and it is not automatically faster, cheaper, or "
      "better. It is a specific answer to one question: <em>how do parties who do not fully trust each "
      "other agree on a shared history without a central authority?</em> If you have a trusted central "
      "authority, a normal database is usually the better engineering answer — and being able to say "
      "that is a sign of understanding rather than a weakness."),
    "</div>",
    h3("Read-only versus write access"),
    p("This distinction matters for GreenToken and is worth stating clearly, because it is deliberate:"),
    ul([
        "<strong>Reads are open by design.</strong> Anyone may look up any token, its location, its photo "
        "hash and its endorsements. The whole point of a carbon registry is that buyers and the public "
        "can verify what is claimed. Openness here is the feature.",
        "<strong>Writes are role-gated.</strong> Only the planters association may create a token, only "
        "verifiers and auditors may endorse one, only funders may buy. The chaincode refuses anyone else.",
    ]),
    p("On the demo, if you are asked “so is this private?”, the answer is: the ledger is public, the "
      "<em>actions</em> are permissioned. That is a deliberate design, not an oversight — and Part&nbsp;2 "
      "covers what happens to genuinely private fields such as a planter’s phone number."),
])

# ==========================================================================
# 5 — 1.3 The hash chain
# ==========================================================================
page("p1-2", "1.3  The hash chain — the single most important idea", "Part 1 — Fabric fundamentals", [
    lead("If you understand one thing about Hyperledger Fabric, understand this. Every other guarantee "
         "follows from it."),
    h3("A hash is a fingerprint"),
    p("A cryptographic hash (SHA-256) turns any input into a fixed 256-bit fingerprint. Three properties "
       "matter:"),
    ul([
        "<strong>Deterministic</strong> — the same input always gives the same output, on every machine, "
        "forever.",
        "<strong>One-way</strong> — you cannot work backwards from the fingerprint to the input.",
        "<strong>Collision-resistant</strong> — no two different inputs share a fingerprint (practically).",
    ]),
    h3("Chaining the blocks"),
    p("Each block header stores the hash of the previous block. The hash of block <em>N</em> is computed "
       "over the previous hash plus the block’s own contents:"),
    code("blockHash[N] = SHA256( blockHash[N-1] || merkleRoot[N] || timestamp[N] || ... )"),
    p("Now change one byte anywhere in block 40. Three things happen, automatically:"),
    ol([
        "Block 40’s own hash changes completely.",
        "Block 41 stores block 40’s hash — so block 41’s input changed, so block 41’s hash changes.",
        "The same cascade continues to the tip of the chain.",
    ]),
    note("key", "The consequence, stated precisely",
         "Altering history does not merely make one block wrong. It invalidates every block after it. "
         "And because the new hashes are internally consistent, an attacker <em>could</em> rewrite the "
         "whole chain — which is exactly why the final block is signed by the ordering service. Without "
         "that signature, recomputing the whole chain would look perfectly valid to anyone who did not "
         "check the signatures."),
    p("That is the whole tamper-evidence story: the hash chain makes alteration <em>localise itself</em>, "
      "and the signatures make alteration <em>impossible to hide</em>. Both are needed."),
    h3("Merkle trees — proving one transaction without showing all of them"),
    p("Each block contains a Merkle root: the transaction hashes are paired and hashed pairwise, and the "
       "tree is collapsed to a single root stored in the block header."),
    code("leaves  = [ H(tx0), H(tx1), H(tx2), H(tx3) ]\n"
         "level 1 = [ H(l0+l1), H(l2+l3) ]\n"
         "level 2 = [ H(l1+l2) ]        <- merkleRoot, stored in the block header"),
    p("To prove that <span class=\"mono\">tx2</span> is in the block, you supply "
      "<span class=\"mono\">tx3</span> and the root, and the verifier recomputes two hashes. Proof size "
      "is O(log n), independent of how many transactions the block holds. GreenToken uses this so a "
      "single token’s membership can be verified without handing over the whole block."),
    h3("What this looks like in the running app"),
    p("Open <strong>Ledger Explorer</strong> and expand the top block. You are looking at exactly this: "
      "the previous hash, the Merkle root, the ordering service’s signature, and each transaction’s "
      "payload hash. Then press <strong>⚠ Tamper with last block</strong> and watch the verifier "
      "recompute every hash from the genesis block and name the exact point where the chain stopped "
      "agreeing with itself."),
])

# ==========================================================================
# 6 — 1.4 Building blocks
# ==========================================================================
page("p1-3", "1.4  The building blocks: MSP, channel, peer, orderer, chaincode", "Part 1 — Fabric fundamentals", [
    lead("Fabric has five moving parts. Learn what each one owns, because almost every exam question "
         "about Fabric is really a question about which component is responsible for what."),
    '<div class="cards">',
    '<div class="card"><h4>MSP — Membership Service Provider</h4>',
    p("The identity directory of <em>one</em> organisation. It maps a participant to an X.509 "
      "certificate issued by that organisation’s certificate authority, and it defines what roles that "
      "identity may play: peer admin, peer, client, orderer."),
    tiny("Fabric has no user accounts and no passwords. Identity is a cryptographic certificate. A "
         "participant <em>is</em> a key pair."),
    "</div>",
    '<div class="card"><h4>Channel — a private ledger</h4>',
    p("A set of organisations sharing one ledger and one ordering service. It carries its own "
      "configuration transaction: which organisations belong, what endorsement policy applies, and so on. "
      "Governance is itself on-chain."),
    tiny("Two channels that share no organisations share no data at all. A channel is the unit of both "
         "confidentiality and governance."),
    "</div>",
    '<div class="card"><h4>Peer — the ledger holder</h4>',
    p("Owns the block store (the hash-linked history) and the state database (current values). Runs "
      "chaincode. Holds an endorsement identity and signs endorsement responses. Owned by one "
      "organisation."),
    tiny("A peer is not a miner and does not compete. It cooperates. Several peers per organisation give "
         "redundancy."),
    "</div>",
    '<div class="card"><h4>Orderer — the sequencer</h4>',
    p("Collects endorsed transactions, batches them into blocks in a defined order, and distributes "
      "those blocks to peers. In production it runs Raft or BFT consensus across several nodes."),
    tiny("The orderer does <strong>not</strong> execute chaincode and does <strong>not</strong> check "
         "business rules. It orders. Correctness comes from elsewhere."),
    "</div>",
    '<div class="card"><h4>Chaincode — the smart contract</h4>',
    p("The business logic. It runs on peers, invoked over the Fabric Gateway, and must be "
      "<em>deterministic</em>: every endorser that evaluates the same proposal must reach the identical "
      "result."),
    tiny("Fabric supports Go, Java and Node.js. This project uses Node.js/TypeScript via "
         "<span class=\"mono\">fabric-contract-api</span> 2.5."),
    "</div>",
    '<div class="card"><h4>Event — the output stream</h4>',
    p("Chaincode emits an event on every committed transaction, and peers deliver those events to "
      "clients."),
    tiny("The <em>Live chaincode events</em> panel on the dashboard is exactly this — the same event "
         "stream Fabric publishes to subscribing clients."),
    "</div>",
    "</div>",
    note("warn", "The distinction that trips people up",
         "The <strong>orderer</strong> sequences and the <strong>peers</strong> validate and commit. The "
         "orderer is deliberately not trusted for correctness: if it gave two peers different views of the "
         "same transaction, the endorsement policy and the validation phase would reject it. Fabric moves "
         "trust out of the sequencer and into the cryptographic protocol."),
])

# ==========================================================================
# 7 — 1.5 World state vs transaction log
# ==========================================================================
page("p1-4", "1.5  World state versus the transaction log", "Part 1 — Fabric fundamentals", [
    lead("Fabric stores your data twice, on purpose. Understanding why explains how it is fast "
         "<em>and</em> auditable at the same time."),
    '<div class="two"><div class="col">',
    h3("The transaction log"),
    p("An append-only, hash-linked sequence of blocks. Every transaction ever committed is here, "
      "forever. This is the <strong>source of truth</strong>."),
    ul(["Written once, never modified.", "Blocks are linked by hash.",
        "Replaying it reconstructs everything."]),
    tiny("Cost: reading current state means scanning history. This is why the log alone is not enough."),
    "</div><div class=\"col\">",
    h3("World state"),
    p("A key–value database (LevelDB, or CouchDB for rich queries) holding the <strong>current</strong> "
      "value of every key."),
    ul(["Rebuilt from the log whenever a peer joins.",
        "Optimised for “give me the value now”.",
        "Still backed by the hash chain — it is a cache, not an authority."]),
    tiny("Cost: you must trust the state DB is consistent with the log. Fabric guarantees it by "
         "construction, and by re-verification on demand."),
    "</div></div>",
    note("key", "The two-tier design in one line",
         "The transaction log is the truth; world state is a derived cache. Queries hit the cache; audits "
         "read the log; and because the cache is rebuilt from the log, a corrupted cache cannot survive a "
         "rebuild."),
    p("Fabric peers gossip new blocks to each other, and they do not need to talk to the orderer for "
      "every read. This is why a peer that falls behind can catch up by replaying blocks rather than by "
      "querying a central server."),
    h3("How GreenToken mirrors this"),
    p("Your implementation keeps the same two layers, in the browser and in the Durable Object:"),
    ul([
        "The <strong>block list</strong> is the transaction log — each block holds its transactions, the "
        "previous hash, the Merkle root and the signature.",
        "The <strong>state map</strong> is world state — token records, invoice records and the indexes "
        "that make search queries cheap.",
        "<strong>Chain verification</strong> replays the log: recompute every hash from the genesis block "
        "and confirm the state still agrees with it. That is exactly what a Fabric peer does when it "
        "rebuilds or revalidates its state.",
    ]),
    p("This is why the tamper demonstration is convincing: the app does not flip a boolean. It "
      "re-derives the chain and reports where the derivation fails."),
])

# ==========================================================================
# 8 — 1.6 Six phases
# ==========================================================================
FLOW_SVG = """
<svg viewBox="0 0 700 300" class="diagram" role="img" aria-label="The six phases of a Fabric transaction">
  <defs>
    <marker id="ar" markerWidth="9" markerHeight="9" refX="7" refY="3.2" orient="auto">
      <path d="M0,0 L0,6.4 L7,3.2 z" fill="#5E7D68"/>
    </marker>
  </defs>
  <rect x="8" y="18" width="98" height="52" rx="9" fill="#12211A"/>
  <text x="57" y="40" text-anchor="middle" font-size="11" fill="#EAF3EC" font-family="Helvetica,Arial">Client</text>
  <text x="57" y="55" text-anchor="middle" font-size="8" fill="#A3B18A" font-family="Helvetica,Arial">application</text>

  <rect x="150" y="8" width="140" height="74" rx="10" fill="#E6F4EC" stroke="#1E8E4E" stroke-width="1.6"/>
  <text x="220" y="30" text-anchor="middle" font-size="10.5" fill="#14663A" font-family="Helvetica,Arial" font-weight="bold">Endorsing peer</text>
  <text x="220" y="47" text-anchor="middle" font-size="8" fill="#48654F" font-family="Helvetica,Arial">runs chaincode,</text>
  <text x="220" y="59" text-anchor="middle" font-size="8" fill="#48654F" font-family="Helvetica,Arial">signs the response</text>
  <text x="220" y="73" text-anchor="middle" font-size="7.5" fill="#75897D" font-family="Helvetica,Arial">Org A + Org B</text>

  <rect x="330" y="18" width="110" height="52" rx="9" fill="#12211A"/>
  <text x="385" y="40" text-anchor="middle" font-size="10.5" fill="#EAF3EC" font-family="Helvetica,Arial" font-weight="bold">Orderer</text>
  <text x="385" y="55" text-anchor="middle" font-size="8" fill="#A3B18A" font-family="Helvetica,Arial">batches &amp; orders</text>

  <rect x="480" y="8" width="140" height="74" rx="10" fill="#E6F4EC" stroke="#1E8E4E" stroke-width="1.6"/>
  <text x="550" y="30" text-anchor="middle" font-size="10.5" fill="#14663A" font-family="Helvetica,Arial" font-weight="bold">Committing peer</text>
  <text x="550" y="47" text-anchor="middle" font-size="8" fill="#48654F" font-family="Helvetica,Arial">validates policy,</text>
  <text x="550" y="59" text-anchor="middle" font-size="8" fill="#48654F" font-family="Helvetica,Arial">appends the block</text>
  <text x="550" y="73" text-anchor="middle" font-size="7.5" fill="#75897D" font-family="Helvetica,Arial">every peer does this</text>

  <rect x="540" y="150" width="140" height="48" rx="9" fill="#FDF3E0" stroke="#96650C" stroke-width="1.4"/>
  <text x="610" y="170" text-anchor="middle" font-size="10.5" fill="#7A5109" font-family="Helvetica,Arial" font-weight="bold">Event</text>
  <text x="610" y="185" text-anchor="middle" font-size="8" fill="#8A6420" font-family="Helvetica,Arial">emitted to clients</text>

  <path d="M106 44 H144" stroke="#5E7D68" stroke-width="1.6" marker-end="url(#ar)"/>
  <path d="M290 44 H324" stroke="#5E7D68" stroke-width="1.6" marker-end="url(#ar)"/>
  <path d="M440 44 H474" stroke="#5E7D68" stroke-width="1.6" marker-end="url(#ar)"/>
  <path d="M550 82 V144" stroke="#5E7D68" stroke-width="1.6" marker-end="url(#ar)"/>

  <g font-family="Helvetica,Arial" font-size="9" fill="#12211A">
    <text x="114" y="100" text-anchor="middle" font-weight="bold">1 · Proposal</text>
    <text x="114" y="112" text-anchor="middle" fill="#75897D" font-size="8">client sends tx</text>
    <text x="307" y="100" text-anchor="middle" font-weight="bold">2 · Endorsement</text>
    <text x="307" y="112" text-anchor="middle" fill="#75897D" font-size="8">signed responses</text>
    <text x="457" y="100" text-anchor="middle" font-weight="bold">3 · Ordering</text>
    <text x="457" y="112" text-anchor="middle" fill="#75897D" font-size="8">batched into a block</text>
    <text x="220" y="205" text-anchor="middle" font-weight="bold">4 · Validation</text>
    <text x="220" y="217" text-anchor="middle" fill="#75897D" font-size="8">policy + read-set checked</text>
    <text x="220" y="229" text-anchor="middle" fill="#75897D" font-size="8">on every peer</text>
    <text x="385" y="205" text-anchor="middle" font-weight="bold">5 · Commit</text>
    <text x="385" y="217" text-anchor="middle" fill="#75897D" font-size="8">block appended,</text>
    <text x="385" y="229" text-anchor="middle" fill="#75897D" font-size="8">state updated</text>
    <text x="610" y="118" text-anchor="middle" font-weight="bold">6 · Notification</text>
  </g>

  <path d="M170 82 V190 H255 V196" fill="none" stroke="#9DB3A4" stroke-width="1.2" stroke-dasharray="3 3" marker-end="url(#ar)"/>
  <text x="130" y="182" font-family="Helvetica,Arial" font-size="7.5" fill="#9DB3A4">validation happens on every peer,</text>
  <text x="130" y="192" font-family="Helvetica,Arial" font-size="7.5" fill="#9DB3A4">not only the orderer</text>
</svg>
"""

page("p1-5", "1.6  The six-phase transaction lifecycle", "Part 1 — Fabric fundamentals", [
    lead("Every transaction that has ever run on Fabric went through these six phases. If you can "
         "narrate them, you can answer most “explain how Fabric works” questions."),
    FLOW_SVG,
    h3("1 — Proposal"),
    p("The client sends a transaction proposal to a peer. The proposal contains the function to invoke "
      "and its arguments — but it is <em>not yet</em> a write."),
    h3("2 — Endorsement"),
    p("The peer runs the chaincode function, simulates what it <em>would</em> write, and returns a "
      "<strong>signed response</strong> containing the read set, the write set, and a signature over the "
      "response. Endorsement is collected from as many peers as the endorsement policy requires — for "
      "GreenToken’s verification step, from two <em>different</em> organisations."),
    h3("3 — Ordering"),
    p("The endorsed transactions go to the ordering service, which batches them into a block in a "
      "defined order and distributes that block to the channel’s peers. The orderer decides "
      "<em>sequence</em>, never <em>meaning</em>."),
    h3("4 — Validation"),
    p("Each peer independently checks the block before accepting it: were enough valid endorsements "
      "collected from the required organisations, are the signatures genuine, and is the read set still "
      "current? A transaction whose read set has gone stale is marked invalid rather than silently "
      "producing a different result."),
    h3("5 — Commit"),
    p("Peers that accept the block append it to their ledger and update world state. From this point "
      "the transaction is permanent."),
    h3("6 — Notification"),
    p("Chaincode events and commit-status events are delivered to listening clients."),
    note("key", "The insight worth saying out loud",
         "The chaincode was executed in phase 2, at endorsement — not in phase 5. By the time a "
         "transaction is committed, the business logic has already run, and the peers in phase 4 are "
         "only checking that the right parties agreed and that nothing changed underneath. That is "
         "exactly why Fabric chaincode must be deterministic."),
])

# ==========================================================================
# 9 — 1.7 Determinism, endorsement policies, privacy
# ==========================================================================
page("p1-6", "1.7  Determinism, endorsement policies, private data", "Part 1 — Fabric fundamentals", [
    h3("Determinism — why the rules are stricter than you expect"),
    p("If two peers evaluating the same proposal get different answers, the network is broken. So Fabric "
       "chaincode may not:"),
    ul([
        "read the wall clock — use the block timestamp that Fabric supplies instead;",
        "generate random numbers — use a deterministic source or a seeded value;",
        "call out to the network or the filesystem;",
        "iterate over an unordered map without sorting the keys first.",
    ]),
    note("key", "This is a real engineering constraint, not pedantry",
         "GreenToken’s chaincode gets its timestamps from a single <span class=\"mono\">nowIso()</span> "
         "helper supplied by the host, never from <span class=\"mono\">Date.now()</span> inside the "
         "contract. The host provides the block time, so every endorser sees the same clock reading."),
    p("When an examiner asks why the chaincode is written in a slightly awkward style — no direct "
      "<span class=\"mono\">Date.now()</span>, no random IDs — this is the answer: determinism is a Fabric "
      "requirement, not a stylistic preference."),
    h3("Endorsement policies"),
    p("A policy states which parties must have endorsed a transaction for it to be valid. It can be "
       "declared at three levels:"),
    ul([
        "<strong>Chaincode-level</strong> — the default policy for the whole contract.",
        "<strong>Collection-level</strong> — for private data collections.",
        "<strong>State-based</strong> — a policy attached to a particular key in world state.",
    ]),
    code("AND('PlantersAssociationMSP', 'ForestDeptMSP')   both must sign\n"
         "OR('ForestDeptMSP', 'AuditorMSP')                either is enough\n"
         "MAJORITY                                         a majority must sign"),
    p("GreenToken’s rule is stronger than a policy expression, because it is enforced in the contract body "
      "rather than in configuration: the code checks that approvals come from two <em>distinct</em> "
      "organisations, and separately that no single participant has already reviewed the token."),
    h3("Private data — and its limits"),
    p("Fabric can split a field across the organisations of a private data collection. Members see the "
       "plaintext; non-members see only the hash. But be precise about what this is:"),
    ul([
        "It is <strong>not encryption of the whole ledger</strong>. The private value is distributed and "
        "reassembled by the authorised members.",
        "The <strong>hash is on-chain and immutable</strong>. Everyone can verify that the private value "
        "was not changed, even though nobody else can read it.",
        "In v2.5 you can even call <span class=\"mono\">PurgePrivateData()</span> to delete the private "
        "value and its history while keeping the hash as evidence — though this needs the V2_5 channel "
        "capability.",
    ]),
    note("warn", "What GreenToken does instead, and why",
         "The planter’s contact number is <strong>stripped at the chaincode boundary</strong> before the "
         "transaction is hashed or stored, so it never reaches world state, the payload hash, or any read "
         "view. That is a simpler and stronger guarantee than a private data collection — the secret is "
         "not in the system at all. Be honest that this is an emulation of private data, not a Fabric "
         "private data collection."),
])

# ==========================================================================
# 10 — 1.8 Fabric vs Ethereum + v2.5
# ==========================================================================
page("p1-7", "1.8  Fabric versus Ethereum, and what v2.5 changed", "Part 1 — Fabric fundamentals", [
    lead("Two questions you should be able to answer without hesitating: <em>how is Fabric different from "
         "a public blockchain?</em> and <em>what does Fabric v2.5 actually give you that v2.2 did "
         "not?</em>"),
    table(
        ["Dimension", "Hyperledger Fabric", "Ethereum"],
        [
            ["Membership", "Permissioned. Identity is an X.509 certificate issued by an organisation’s MSP.",
             "Permissionless. Identity is a public key; anyone can participate."],
            ["Consensus", "Ordering service (Raft / BFT) across configured nodes.",
             "Proof of Stake across thousands of validators."],
            ["Transaction finality", "Immediate once committed — no probabilistic waiting.",
             "Probabilistic; finality deepens with confirmations."],
            ["Throughput", "Thousands of transactions per second in production designs.",
             "Limited by the consensus layer."],
            ["Fees and gas", "None. No token, no gas, no miner.", "Gas price paid to validators in ETH."],
            ["Contract languages", "Go, Java, Node.js.", "Solidity and Vyper."],
            ["Confidentiality", "Channels and private data collections are first-class.",
             "All state is public; privacy needs layer-2 or zero-knowledge machinery."],
            ["Governance", "On-chain channel configuration, agreed between members.",
             "Off-chain process: EIPs, hard forks, the Ethereum Foundation."],
        ],
        "tight",
    ),
    note("key", "The one-line contrast to say out loud",
         "Fabric assumes the parties know who each other are and have already agreed to be in the same "
         "room. Ethereum assumes nobody knows anybody. That single difference explains the "
         "permissioning, the absence of fees, the throughput, and the privacy model."),
    p("Fabric is the correct choice for a consortium of a government department, an auditor and a "
      "corporate buyer. It is the wrong choice for a public token. Make that judgement out loud — it "
      "demonstrates understanding rather than enthusiasm."),
    h3("What v2.5 specifically added"),
    p("v2.5 is the current long-term-support release, upgradable in place from v2.2 LTS. Its headline "
       "features:"),
    ul([
        "<strong>Fabric Gateway and its client libraries.</strong> The Gateway — introduced in v2.4 and "
        "standardised in v2.5 — is a service running on a peer that handles transaction submission for "
        "the client. It manages five things: Evaluate (query), Endorse, Submit, commit-status waiting, "
        "and chaincode events. The client application no longer has to discover and connect to peers in "
        "other organisations itself. Node, Java and Go Gateway SDKs (v1.0.0) expose a single "
        "<span class=\"mono\">SubmitTransaction()</span> call.",
        "<strong>Channels without a system channel.</strong> Ordering-service configuration is no longer "
        "confined to a special system channel.",
        "<strong>Ledger snapshots.</strong> A new peer can join an existing channel from a snapshot "
        "instead of replaying every block from the beginning.",
        "<strong>PurgePrivateData().</strong> Delete private data and its history while keeping the "
        "immutable hash as evidence. Requires the V2_5 channel capability.",
    ]),
    p("GreenToken’s chaincode targets this line: "
      "<span class=\"mono\">fabric-contract-api@2.5.8</span> and "
      "<span class=\"mono\">fabric-shim@2.5.8</span>, and it is packaged and installed by "
      "<span class=\"mono\">network/deploy.sh</span> against a v2.5 compose network."),
])

# ==========================================================================
# 11 — 2.1 Use case + orgs
# ==========================================================================
page("p2", "Part 2 — How the GreenToken app works", "2.1  The use case and the four organisations", [
    lead("Now that you have the Fabric model, here is your project expressed in it."),
    h3("The use case"),
    p("A carbon credit is only worth something if a buyer can trust that the tree exists, that it was "
      "planted where it is claimed to be, and that it has not been counted twice. Today that trust "
      "usually rests on a spreadsheet, an audit report and a photograph in an email."),
    p("GreenToken turns a planting event into a verifiable token:"),
    ol([
        "A planter submits the species, the number of trees, a GPS coordinate and a photo.",
        "The <strong>SHA-256 of the photo bytes</strong> and the <strong>SHA-256 of the geo "
        "payload</strong> go on the ledger. The photo itself does not.",
        "Two independent organisations review the proof and sign their endorsement with ECDSA.",
        "At quorum, the token becomes VERIFIED and can be funded.",
        "A corporate funder discovers verified tokens on a map, puts a basket together, and the "
        "contract issues one discounted invoice for the whole basket.",
        "Settlement releases the net amount to the planters, recorded on chain.",
    ]),
    note("key", "How this maps onto the two Unit 5 use cases",
         "<strong>Use case 1 — trade / supply chain finance:</strong> a basket of verified tokens becomes "
         "a single discounted invoice that is settled to multiple planters. Provenance-priced, "
         "basket-invoiced, auto-settled. &nbsp;·&nbsp; <strong>Use case 2 — government:</strong> the "
         "Forest Department, the Independent Auditor and the Planters Association share one channel, and "
         "the department’s approvals live on-chain where they can be audited."),
    h3("The four organisations"),
    table(
        ["MSP", "Organisation", "Can", "Cannot"],
        [
            ["<span class=\"mono\">PlantersAssociationMSP</span>", "Sahyadri Planters Association",
             "Submit planting proofs", "Endorse, fund or settle"],
            ["<span class=\"mono\">ForestDeptMSP</span>", "State Forest Department",
             "Endorse and reject proofs", "Plant, fund, or settle"],
            ["<span class=\"mono\">AuditorMSP</span>", "Independent Carbon Auditor",
             "Endorse, reject, and settle invoices", "Plant or fund"],
            ["<span class=\"mono\">CorporateFundersMSP</span>", "Corporate Green Funders",
             "Fund verified tokens and settle invoices", "Plant or endorse"],
        ],
        "tight",
    ),
    tiny("The demo switches identity through the picker in the top right. You act as one organisation at "
         "a time — which is exactly how a consortium member operates. The identity switcher is not a UI "
         "convenience; it is the stand-in for a client application’s certificate."),
    note("warn", "One permission subtlety worth knowing",
         "The <strong>Auditor can settle invoices</strong>, because the chaincode grants "
         "<span class=\"mono\">SettleFunding</span> to funders <em>and</em> auditors. The Forest "
         "Department cannot — it has no settlement role. If an examiner asks why one regulator settles "
         "and another does not, the honest answer is that this reflects the contract’s access matrix, "
         "and that it is recorded in the README."),
])

# ==========================================================================
# 12 — 2.2 One contract three hosts
# ==========================================================================
ARCH_SVG = """
<svg viewBox="0 0 700 260" class="diagram" role="img" aria-label="One chaincode module running on three hosts">
  <defs>
    <marker id="ar2" markerWidth="9" markerHeight="9" refX="7" refY="3.2" orient="auto">
      <path d="M0,0 L0,6.4 L7,3.2 z" fill="#5E7D68"/>
    </marker>
  </defs>
  <rect x="212" y="14" width="276" height="96" rx="12" fill="#12211A"/>
  <text x="350" y="42" text-anchor="middle" font-size="13" fill="#EAF3EC" font-family="Helvetica,Arial" font-weight="bold">src/core/chaincode.ts</text>
  <text x="350" y="62" text-anchor="middle" font-size="9.5" fill="#A3B18A" font-family="Helvetica,Arial">the rules — zero platform imports</text>
  <text x="350" y="80" text-anchor="middle" font-size="8.5" fill="#7FA58C" font-family="Helvetica,Arial">PlantTree · VerifyPlanting · FundTokens · SettleFunding</text>
  <text x="350" y="96" text-anchor="middle" font-size="8.5" fill="#7FA58C" font-family="Helvetica,Arial">+ 6 read functions</text>

  <rect x="14" y="176" width="196" height="72" rx="10" fill="#E6F4EC" stroke="#1E8E4E" stroke-width="1.6"/>
  <text x="112" y="200" text-anchor="middle" font-size="10.5" fill="#14663A" font-family="Helvetica,Arial" font-weight="bold">Browser</text>
  <text x="112" y="216" text-anchor="middle" font-size="8" fill="#48654F" font-family="Helvetica,Arial">MemoryStub</text>
  <text x="112" y="230" text-anchor="middle" font-size="8" fill="#48654F" font-family="Helvetica,Arial">state in localStorage</text>
  <text x="112" y="242" text-anchor="middle" font-size="7.5" fill="#75897D" font-family="Helvetica,Arial">the live demo</text>

  <rect x="252" y="176" width="196" height="72" rx="10" fill="#E6F4EC" stroke="#1E8E4E" stroke-width="1.6"/>
  <text x="350" y="200" text-anchor="middle" font-size="10.5" fill="#14663A" font-family="Helvetica,Arial" font-weight="bold">Cloudflare Durable Object</text>
  <text x="350" y="216" text-anchor="middle" font-size="8" fill="#48654F" font-family="Helvetica,Arial">same interface</text>
  <text x="350" y="230" text-anchor="middle" font-size="8" fill="#48654F" font-family="Helvetica,Arial">ordered ledger, REST + SSE</text>
  <text x="350" y="242" text-anchor="middle" font-size="7.5" fill="#75897D" font-family="Helvetica,Arial">the deployed backend</text>

  <rect x="490" y="176" width="196" height="72" rx="10" fill="#E6F4EC" stroke="#1E8E4E" stroke-width="1.6"/>
  <text x="588" y="200" text-anchor="middle" font-size="10.5" fill="#14663A" font-family="Helvetica,Arial" font-weight="bold">Hyperledger Fabric v2.5</text>
  <text x="588" y="216" text-anchor="middle" font-size="8" fill="#48654F" font-family="Helvetica,Arial">fabric-shim Context</text>
  <text x="588" y="230" text-anchor="middle" font-size="8" fill="#48654F" font-family="Helvetica,Arial">chaincode/src/contract.ts</text>
  <text x="588" y="242" text-anchor="middle" font-size="7.5" fill="#75897D" font-family="Helvetica,Arial">the lab record</text>

  <path d="M112 176 V118 H300" fill="none" stroke="#5E7D68" stroke-width="1.6" marker-end="url(#ar2)"/>
  <path d="M350 176 V112" fill="none" stroke="#5E7D68" stroke-width="1.6" marker-end="url(#ar2)"/>
  <path d="M588 176 V118 H400" fill="none" stroke="#5E7D68" stroke-width="1.6" marker-end="url(#ar2)"/>

  <text x="350" y="140" text-anchor="middle" font-size="8" fill="#75897D" font-family="Helvetica,Arial">each host supplies its own ChaincodeStub implementation</text>
</svg>
"""

page("p2-1", "2.2  One contract, three hosts", "Part 2 — the application", [
    lead("This is the central architectural idea of the project, and the one most worth understanding "
         "deeply."),
    h3("The problem it solves"),
    p("Fabric chaincode must run inside a Fabric peer. But the graded demonstration has to open in a "
      "browser, and requiring the examiner to start a four-gigabyte Docker network before your demo "
      "begins is not a fair thing to ask. Those two requirements pull in opposite directions."),
    h3("The resolution: invert the dependency"),
    p("Rather than write the contract twice — once for Fabric and once for the web — write it "
      "<em>once</em>, with no dependency on any platform, and let each host supply the plumbing."),
    ARCH_SVG,
    p("The contract module never imports Fabric. It receives a <span class=\"mono\">ChaincodeStub</span> "
      "— a small interface with methods like <span class=\"mono\">getState</span>, "
      "<span class=\"mono\">putState</span>, <span class=\"mono\">getStateByRange</span>, "
      "<span class=\"mono\">emitEvent</span> and <span class=\"mono\">getCallerIdentity</span> — and "
      "every read or write goes through it."),
    table(
        ["Host", "Stub implementation", "Where it runs", "Why"],
        [
            ["Browser", "<span class=\"mono\">MemoryStub</span>",
             "Inside the page, state persisted to localStorage",
             "The demo opens instantly and works offline. No Docker, no accounts."],
            ["Cloudflare", "<span class=\"mono\">Durable Object</span>",
             "A Worker with an ordered, strongly consistent store",
             "A real ordering-and-commit host in the cloud, deployed for free."],
            ["Fabric", "<span class=\"mono\">fabric-shim</span> Context adapter",
             "A real peer, installed by the deploy script",
             "Proves the same rules run unmodified on genuine Fabric."],
        ],
        "tight",
    ),
    note("key", "The sentence to say when they ask “is this really Fabric?”",
         "The smart contract is real Fabric v2.5 TypeScript chaincode — it is in "
         "<span class=\"mono\">chaincode/src/contract.ts</span> and deploys with "
         "<span class=\"mono\">network/deploy.sh</span>. The business logic in "
         "<span class=\"mono\">src/core/chaincode.ts</span> contains no platform imports; each host "
         "supplies its own adapter. The demo you just saw ran on a Cloudflare Durable Object, which is a "
         "real ordering-and-commit host that needs no Docker. <strong>The same contract runs unchanged "
         "on Fabric.</strong>"),
    h3("Where the code is"),
    code("src/core/chaincode.ts     the rules — shared by every host\n"
         "src/core/ledger.ts        MemoryStub, block assembly, chain verification\n"
         "src/core/seed.ts          the replayed genesis history\n"
         "worker/src/index.ts       Durable Object host  (the deployed API)\n"
         "chaincode/src/contract.ts Fabric host          (the real chaincode)"),
])

# ==========================================================================
# 13 — 2.3 Data model
# ==========================================================================
page("p2-2", "2.3  The data model", "Part 2 — the application", [
    lead("Five record types carry everything. Learn these five and you can read any function in the "
         "project."),
    table(
        ["Type", "Purpose", "Notable fields"],
        [
            ["<span class=\"mono\">TreeToken</span>", "One planting, and its journey to a funded credit.",
             "<span class=\"mono\">tokenId</span>, <span class=\"mono\">species</span>, "
             "<span class=\"mono\">count</span>, <span class=\"mono\">geo</span>, "
             "<span class=\"mono\">photo</span>, <span class=\"mono\">status</span>, "
             "<span class=\"mono\">endorsements[]</span>, <span class=\"mono\">requiredEndorsements</span>"],
            ["<span class=\"mono\">GeoStamp</span>", "Where it was planted, and the proof of it.",
             "<span class=\"mono\">lat</span>, <span class=\"mono\">lng</span>, "
             "<span class=\"mono\">accuracy</span>, <span class=\"mono\">hash</span> (SHA-256 of the geo "
             "payload)"],
            ["<span class=\"mono\">PhotoProof</span>", "The evidence image, reduced to a fingerprint.",
             "<span class=\"mono\">sha256</span>, <span class=\"mono\">bytes</span>, "
             "<span class=\"mono\">mime</span>"],
            ["<span class=\"mono\">Endorsement</span>", "One independent reviewer’s signed verdict.",
             "<span class=\"mono\">by</span>, <span class=\"mono\">org</span>, "
             "<span class=\"mono\">verdict</span>, <span class=\"mono\">note</span>, "
             "<span class=\"mono\">signature</span> (ECDSA P-256)"],
            ["<span class=\"mono\">FundingInvoice</span>", "One basket, one discount, one settlement.",
             "<span class=\"mono\">tokenIds[]</span>, <span class=\"mono\">units</span>, "
             "<span class=\"mono\">grossAmount</span>, <span class=\"mono\">discountAmount</span>, "
             "<span class=\"mono\">netAmount</span>, <span class=\"mono\">status</span>"],
        ],
        "tight",
    ),
    h3("The lifecycle of a token"),
    table(
        ["Status", "Meaning", "Who can move it next"],
        [
            ["<span class=\"pill pill-warn\">PENDING</span>",
             "Submitted, awaiting independent review.",
             "Forest Dept or Auditor — one review each"],
            ["<span class=\"pill pill-ok\">VERIFIED</span>", "Quorum reached; mintable and fundable.",
             "Corporate Funder"],
            ["<span class=\"pill pill-good\">FUNDED</span>", "Bought and included in an invoice.", "Settlement"],
            ["<span class=\"pill pill-bad\">REJECTED</span>", "Refused by a reviewer.",
             "<strong>Nobody.</strong> This is terminal."],
        ],
        "tight",
    ),
    note("key", "Why the status machine matters",
         "The status is not a label the UI chooses — it is a field in world state, and the chaincode is the "
         "only thing that may change it. A rejected token cannot be re-reviewed, re-approved, or pushed "
         "back into the queue, because the contract refuses every one of those transitions. In a UI-only "
         "system, any of those would be a matter of a hidden button."),
    h3("What is deliberately absent"),
    p("Look closely at the <span class=\"mono\">TreeToken</span> type: there is <em>no</em> field for the "
      "planter’s phone number. That is not an oversight — the type itself is the guarantee. The contact "
      "value is stripped at the chaincode boundary before anything is hashed or stored, so it cannot leak "
      "into a read view, because it was never written in the first place."),
])

# ==========================================================================
# 14 — 2.4 Ten functions
# ==========================================================================
page("p2-3", "2.4  The ten chaincode functions", "Part 2 — the application", [
    lead("Four write functions and six read functions. Writes change state and produce transactions; "
         "reads are free and change nothing."),
    h3("The four writes"),
    table(
        ["Function", "Who may call it", "What it does"],
        [
            ["<span class=\"mono\">PlantTree</span>", "PLANTER",
             "Validates the planting, hashes the photo bytes and the geo payload, writes the token as "
             "PENDING, and indexes it by district, species, planter and status."],
            ["<span class=\"mono\">VerifyPlanting</span>", "VERIFIER, AUDITOR",
             "Records a signed endorsement, checks the quorum rules, and flips the token to VERIFIED or "
             "REJECTED."],
            ["<span class=\"mono\">FundTokens</span>", "FUNDER",
             "Validates that every token in the basket is VERIFIED, applies the discount ladder, writes "
             "the invoice, and marks the tokens FUNDED."],
            ["<span class=\"mono\">SettleFunding</span>", "FUNDER, AUDITOR",
             "Marks the invoice SETTLED, records the net release to planters, and updates the token "
             "timestamps."],
        ],
        "tight",
    ),
    h3("The six reads"),
    table(
        ["Function", "What it returns"],
        [
            ["<span class=\"mono\">GetToken</span>",
             "One token by id, with its endorsements and hashes."],
            ["<span class=\"mono\">SearchTokens</span>",
             "Tokens filtered by status, district or species, driven by the indexes the chaincode "
             "maintains."],
            ["<span class=\"mono\">GetLeaderboard</span>",
             "Planters ranked by verified carbon — computed from ledger state, never stored as a score."],
            ["<span class=\"mono\">GetStats</span>",
             "Aggregate counters for the dashboard: tokens, blocks, trees, CO₂, funds."],
            ["<span class=\"mono\">GetInvoice</span>", "One invoice by id."],
            ["<span class=\"mono\">GetAllInvoices</span>", "Every invoice, for the Invoices view."],
        ],
        "tight",
    ),
    note("key", "Why the split matters",
         "In Fabric, reads and writes are different operations with different costs and different safety "
         "properties. A read is a <span class=\"mono\">evaluate</span> — it never touches the ledger and "
         "never produces a transaction. A write is an <span class=\"mono\">invoke</span> — it is proposed, "
         "endorsed, ordered, validated and committed. Your API exposes the same distinction: read "
         "endpoints are plain GETs; writes go through the transaction path and produce a block."),
    h3("Everything the dashboard shows comes from these"),
    p("Six tokens, 170 trees, 4.7 t of CO₂, ₹5,550 disbursed, 29 blocks, 8 planters in 7 districts — all "
      "of it is read back out of ledger state by "
      "<span class=\"mono\">GetStats</span>, <span class=\"mono\">SearchTokens</span> and "
      "<span class=\"mono\">GetLeaderboard</span>. Nothing is typed in by hand, which is why the numbers "
      "on the deck and on the screen agree."),
])

# ==========================================================================
# 15 — 2.5 Cryptography
# ==========================================================================
page("p2-4", "2.5  The cryptography actually used", "Part 2 — the application", [
    lead("Nothing here is mocked. Every hash and every signature in the running demo was computed for "
         "real, in the browser or in the Worker."),
    table(
        ["Primitive", "Where it is used", "What it buys"],
        [
            ["<span class=\"mono\">SHA-256</span>",
             "Photo bytes, the geo payload, every block header",
             "A fingerprint that binds the evidence to the record. Change the photo and the hash "
             "changes."],
            ["<span class=\"mono\">ECDSA P-256</span>", "Endorsement payloads and block headers",
             "Proof that a named organisation actually signed. Not just a flag in a field."],
            ["<span class=\"mono\">Merkle tree</span>",
             "One Merkle root per block, over the transaction hashes",
             "Efficient proof that a given transaction is in a given block."],
            ["<span class=\"mono\">Hash chain</span>", "Each block stores the previous block’s hash",
             "Any alteration propagates forward and is localised by recomputation."],
        ],
        "tight",
    ),
    h3("The photo hash, end to end"),
    code("1. The planter picks a JPEG from their phone.\n"
         "2. The app reads the bytes and computes SHA-256 over them.\n"
         "3. The chaincode receives the digest, the byte count and the MIME type —\n"
         "   never the image itself.\n"
         "4. The digest is stored in the token record and covered by the payload hash\n"
         "   of the transaction that created it.\n"
         "5. The reviewer sees dec02336…6252 and can be told: re-upload that exact\n"
         "   file and you get that exact digest. No two different files will do it."),
    h3("The geo hash"),
    p("The coordinate is hashed as well, and the hash covers the whole payload — latitude, longitude and "
      "accuracy — not just the coordinates. Changing the accuracy figure changes the hash. The reviewer "
      "sees the accuracy in metres next to the hash, because a coordinate without an accuracy is not "
      "evidence of anything."),
    h3("The endorsement signature"),
    p("Each endorsement is signed over a payload containing the token id, the verdict, the note, the "
      "reviewer’s organisation and the time. The signature is stored with the endorsement. Two "
      "consequences matter for the demo:"),
    ul([
        "The reviewer cannot later claim they approved something else, or that the note was different.",
        "The contract can verify that the signature belongs to the organisation it claims to.",
    ]),
    h3("The block signature and Merkle root"),
    p("Each block carries the ordering service’s signature over its header, and a Merkle root over its "
      "transaction hashes. Together they mean: a peer that receives a block can check that it came from "
      "the ordering service, and that its transactions are intact."),
    note("warn", "One simplification, stated plainly",
         "The public keys used for the endorsements are derived deterministically from the participant id "
         "rather than being issued by a certificate authority. A real Fabric deployment would use X.509 "
         "certificates from each organisation’s MSP. The signatures are real ECDSA signatures; the key "
         "distribution is the part that is simplified."),
])

# ==========================================================================
# 16 — 2.6 Trust rules
# ==========================================================================
RULES = [
    ("01", "Quorum needs two <em>different</em> organisations",
     "Two approvals, but from two distinct MSPs. One organisation with two officers cannot manufacture "
     "quorum. Two separate guards enforce it: one review per participant, and one review per "
     "organisation."),
    ("02", "Rejection is terminal",
     "A rejected token can never be re-reviewed, re-approved, or pushed back into the queue. A rejection "
     "is evidence, not a speed bump."),
    ("03", "One photo cannot mint two tokens",
     "A duplicate photo hash is rejected. This blocks the “photograph the same tree twice and sell both "
     "credits” attack, which is the oldest carbon-credit fraud there is."),
    ("04", "The price is on-chain",
     "<span class=\"mono\">BASE_PRICE_INR = 150</span> per verified tree. The client cannot negotiate it "
     "and the funder cannot dictate it."),
    ("05", "The discount ladder is in the contract",
     "500 units → 15%, 200 → 10%, 50 → 5%, 1 → 0%. The invoice computes it. If the browser sent a 40% "
     "discount, the contract would ignore it and use the ladder."),
    ("06", "Only VERIFIED tokens can be funded",
     "The contract validates the whole basket. If a single token is not VERIFIED, the entire invoice is "
     "refused — it does not quietly drop the ineligible one."),
    ("07", "Private contact never reaches the ledger",
     "Stripped at the chaincode boundary before hashing, storing or emitting. The "
     "<span class=\"mono\">TreeToken</span> type has no field for it."),
    ("08", "GPS accuracy is recorded, and shown to the reviewer",
     "The reviewer sees the accuracy radius before approving — the seeded example includes a rejection "
     "at 320 metres. Accuracy is not yet a hard threshold; that is listed as future scope."),
]
_rules = ['<div class="rules">']
for _n, _t, _d in RULES:
    _rules.append('<div class="rule"><div class="rule__n">' + _n + "</div><div><h4>" + _t
                  + "</h4><p>" + _d + "</p></div></div>")
_rules.append("</div>")

page("p2-5", "2.6  The eight trust rules", "Part 2 — the application", [
    lead("These are the rules that make the project interesting. Every one of them lives in the "
         "chaincode, not in the interface."),
    "".join(_rules),
    note("key", "How to demonstrate that these are real",
         "Pick any one of these rules and ask: “what happens if I try to break it?” Then open the "
         "Verification page as the second reviewer and try to endorse the same token. The contract stops "
         "you, and it stops you in a message that says why. The rule is not in the interface — the "
         "interface is only showing you what the contract decided."),
])

# ==========================================================================
# 17 — 2.7 Real vs emulated
# ==========================================================================
page("p2-6", "2.7  What is real and what is emulated", "Part 2 — the application", [
    lead("This is the most important page in the document. An examiner will probe for it, and "
         "volunteering it is far stronger than being caught on it."),
    table(
        ["<b>Real</b> — actually implemented, actually running",
         "<b>Emulated or scoped</b> — and what stands in for it"],
        [
            ["SHA-256 hashing of photo bytes and geo payloads.",
             "Private data is emulated. The planter’s contact is stripped before storage, rather than "
             "distributed through a Fabric private data collection."],
            ["ECDSA P-256 endorsements and block signatures.",
             "Public keys are derived from participant ids, not issued by a per-organisation CA."],
            ["Merkle roots over transaction hashes; a real hash-linked block chain.",
             "The demo host is a Durable Object, not a Fabric peer. It is a genuine ordering-and-commit "
             "host with real ordering — but it is not Fabric."],
            ["The chaincode rules: quorum, terminal rejection, discount ladder, fixed price, "
             "duplicate-photo rejection.",
             "Settlement marks an invoice settled. No bank transfer happens; real money movement is out "
             "of scope."],
            ["Real Fabric v2.5 chaincode, packaged and installable with "
             "<span class=\"mono\">network/deploy.sh</span>.",
             "Reads are open to everyone by design — this is a visibility use case. Only writes are "
             "role-gated."],
            ["A deployed REST + SSE API with a live ordered ledger.",
             "GPS accuracy is recorded and displayed but not enforced as a threshold."],
            ["A tamper test that recomputes every hash from genesis and localises the break.",
             "CO₂ rates are a static per-species table, not a measured sequestration model."],
            ["Consortium governance expressed in code.",
             "On-chain governance — changing the rules by vote — is future scope, not implemented."],
        ],
        "twocol",
    ),
    note("key", "The line to draw",
         "The <strong>business logic is real</strong> and the <strong>cryptography is real</strong>. What "
         "is simulated is the <em>network layer</em> and a small number of production-grade edge features "
         "— private data distribution, CA-issued certificates, bank settlement and on-chain governance. "
         "The lab record in <span class=\"mono\">network/</span> and "
         "<span class=\"mono\">chaincode/</span> deploys the identical contract on genuine Fabric, so the "
         "simulation is a deployment decision, not a shortcut in the rules."),
    h3("Why the dual-target design is defensible"),
    p("A Fabric network is roughly four gigabytes of Docker images and a multi-step install. Asking an "
      "examiner to start one before your demo is unreasonable — and a demo that fails to start is a demo "
      "that scores zero. By shipping the identical contract for Fabric <em>and</em> running it on a host "
      "that starts in a browser, the demonstration always works and the Fabric deployment remains real, "
      "documented and repeatable in the lab."),
])

# ==========================================================================
# 18 — 3.1 Pre-flight
# ==========================================================================
page("p3", "Part 3 — The demo", "3.1  Pre-flight checklist", [
    lead("Spend two minutes on this before every presentation. Every item below has cost someone a "
         "demo."),
    '<div class="grid2"><div class="col">',
    h3("On the laptop"),
    ul([
        "<strong>Open the URL in a new window</strong> — full screen, bookmarks bar hidden. The last "
        "time you used that tab it may hold an old version.",
        "<strong>Zoom to 100%</strong>, or 125% if the projector is low-resolution. The ledger and "
        "invoice screens are dense.",
        "Laptop on <strong>power</strong>, not battery.",
        "Notifications off. A message in the middle of the tamper demo will cost you the room.",
        "<strong>Test the audio</strong> if the room is loud — you will be narrating over a map.",
    ]),
    "</div><div class=\"col\">",
    h3("State you want"),
    ul([
        "One token <strong>PENDING</strong>, waiting for review — this is what you endorse live.",
        "Three tokens <strong>VERIFIED</strong>, ready to fund.",
        "Two invoices <strong>SETTLED</strong> and one <strong>ISSUED</strong>.",
        "The chain <strong>verified</strong> — 29 blocks, 9 tokens.",
    ]),
    '<div class="callout callout--tight"><h4>If the state is wrong</h4>',
    p("Open <strong>Ledger Explorer → ↺ Reset demo</strong>. This reseeds the consortium from the "
      "genesis block, replaying the real chaincode, so every hash is genuine again. It takes a second."),
    "</div>",
    "</div></div>",
    h3("Rehearse these three moments"),
    ol([
        "<strong>The switch.</strong> Switching identity takes one click. If you fumble it, the room "
        "assumes the app is slow.",
        "<strong>The endorse click.</strong> The queue shows one pending proof. Endorse it as the Forest "
        "Department, then as the Auditor, and watch it flip to VERIFIED.",
        "<strong>The tamper.</strong> Click <strong>⚠ Tamper with last block</strong>, wait for the card "
        "to turn red, and read the break message aloud. Then <strong>↺ Restore chain</strong>. Do not "
        "rush this — it is the moment the whole project exists for.",
    ]),
    note("key", "The single sentence that earns the most marks",
         "“I am going to tamper with the last block.” Say it before you click. It frames the click as an "
         "experiment rather than as a button press, and it tells the examiner exactly what to watch for."),
])

# ==========================================================================
# 19-20 — 3.2 run of show
# ==========================================================================
page("p3-1", "3.2  The eight-step run of show", "Part 3 — the demo  ·  steps 1–4", [
    lead("Six to eight minutes. Ten with questions. The rule: do not narrate what is on screen — narrate "
         "<em>why</em> it is there, then let the click speak."),
    h3("Step 1 · Dashboard <span class=\"time\">45s</span>"),
    p("Point at the six stat tiles, left to right."),
    say("“Nine tokens on chain, a hundred and seventy trees, 4.7 tonnes of estimated CO₂, and ₹5,550 "
        "already disbursed to planters. Below that, 29 blocks — and the ring on the right says "
        "<em>ledger intact</em>. That is not a static badge: every render re-hashes the entire chain and "
        "checks the links. I will prove that at the end.”"),
    p("Then the live event feed on the right."),
    say("“Every one of those rows is a chaincode event — PlantTree, VerifyPlanting, FundTokens, "
        "SettleFunding. This is the same event stream Fabric publishes to clients.”"),
    tiny("Do not linger. This is the establishing shot."),
    h3("Step 2 · Discover &amp; Fund <span class=\"time\">60s</span>"),
    p("Click <strong>Discover &amp; Fund</strong>."),
    say("“This is the funder’s view. This map is not decoration — every marker is a token whose GPS "
        "coordinates and photo hash are on the ledger. A corporate buyer can filter by district or species "
        "and see exactly what they are buying: real coordinates, a real species, a photo hash.”"),
    p("Click a marker, then a token card, then <strong>View full provenance</strong>."),
    say("“Here is the whole token: the photo hash, the geo hash, the endorsement signatures, and the raw "
        "JSON at the bottom. Nothing here is computed on the client — this is the token as it exists on "
        "chain.”"),
    p("Go back and tick <strong>two VERIFIED tokens</strong> into the basket."),
    say("“The funder picks a basket. Now watch what the contract does with it.”"),
    h3("Step 3 · The invoice <span class=\"time\">60s</span>"),
    p("Point at the invoice panel on the right."),
    say("“Gross, discount, net. The discount comes from a ladder inside the smart contract — 50 units "
        "gives 5%, 200 gives 10%, 500 gives 15%. The client cannot choose its own discount. If the "
        "interface tried to send a 40% discount, the contract would ignore it.”"),
    p("Switch identity to <strong>Aarav Menon (Corporate Green Funders)</strong>. The app now permits "
      "the action. Click <strong>🧾 Issue invoice &amp; fund</strong>."),
    say("“One invoice covers every token and every planter in the basket. That is the trade-finance part "
        "of the use case: provenance-priced, basket-invoiced, auto-settled.”"),
    h3("Step 4 · Plant a Tree <span class=\"time\">60s</span>"),
    p("Click <strong>Plant a Tree</strong>. Switch identity to <strong>Lakshmi Gowda</strong> if you are "
      "not already there."),
    say("“A planter submits species, count, GPS and a photo. The important part: the SHA-256 of the "
        "photo bytes and of the geo payload are what go on the ledger — not the photo.”"),
    p("Click <strong>📍 Use my GPS</strong> (or <strong>Generate sample proof</strong> if the browser "
      "blocks location), then <strong>Submit planting proof</strong>."),
    say("“Token GT-000010 created and awaiting verification. Notice the two endorsements required before "
        "it can be funded — nobody can mint a token alone.”"),
])

page("p3-2", "3.2  The eight-step run of show", "Part 3 — the demo  ·  steps 5–8", [
    h3("Step 5 · Verification <span class=\"time\">60s</span>"),
    p("Click <strong>Verification</strong>. The proof you just submitted is at the top of the queue."),
    p("Switch identity to <strong>Dr. S. Raghavan (State Forest Department)</strong>, click "
      "<strong>Endorse</strong>, add a note."),
    say("“The Forest Department approves. One of two. The contract will not let the same reviewer endorse "
        "twice, so a single person cannot manufacture a quorum.”"),
    p("Switch identity to <strong>Nikhil Kapoor (Independent Carbon Auditor)</strong> and endorse again — "
      "the token flips to <strong>VERIFIED</strong>."),
    say("“Second, independent organisation. Now the token is mintable. Notice the geo accuracy on the "
        "card — a poor GPS radius is visible to the reviewer before they approve, and the seeded example "
        "shows a rejection at 320 metres.”"),
    h3("Step 6 · Ledger Explorer <span class=\"time\">60s</span>"),
    p("Click <strong>Ledger Explorer</strong>. Expand the top block."),
    say("“Every block carries its previous hash, its Merkle root over the transaction hashes, and the "
        "ordering service’s signature. Expanding it shows each transaction, its payload hash, and which "
        "organisation endorsed it.”"),
    tiny("This is the slide the examiner will want to see. Do not rush it."),
    h3("Step 7 · The tamper test <span class=\"time\">90s</span>"),
    p("Still in Ledger Explorer. Say this <em>before</em> you click."),
    say("“Now the part most projects claim and cannot demonstrate. I am going to tamper with the last "
        "block.”"),
    p("Click <strong>⚠ Tamper with last block</strong>. The card flips to red."),
    say("“The verifier recomputed every hash from scratch and found the break. It does not just say "
        "<em>invalid</em> — it names the block and says exactly what no longer matches: the transaction "
        "payload was altered after endorsement, so the stored payload no longer hashes to the signed "
        "payload hash. Nobody can quietly change history; they can only be caught.”"),
    p("Click <strong>↺ Restore chain</strong>."),
    say("“And it restores, by re-signing from the stored transactions. The tamper test is repeatable — "
        "you can run it yourself from the link.”"),
    h3("Step 8 · Leaderboard and close <span class=\"time\">45s</span>"),
    p("Click <strong>Leaderboard</strong>."),
    say("“The leaderboard is a query, not a stored score. It is computed from ledger state, so a planter "
        "cannot inflate their own carbon number — the endorsements are on chain. The same is true for "
        "every number on the dashboard.”"),
    p("Close on the final slide: <em>“Plant it. Prove it. Tokenise it.”</em>"),
])

# ==========================================================================
# 21 — 3.3 tamper detail
# ==========================================================================
page("p3-3", "3.3  The tamper moment, in detail", "Part 3 — the demo", [
    lead("This is ninety seconds, and it is the reason the project exists. Here is exactly what happens, "
         "so you can narrate it accurately rather than gesturing at a red card."),
    h3("What the button actually does"),
    ol([
        "It reaches into the last committed block and alters a transaction’s stored payload — changing a "
        "value that was already signed.",
        "It leaves the block’s recorded hash untouched, which is the whole point: the block now contains a "
        "payload that does not match its own hash.",
    ]),
    h3("What the verifier does next"),
    ol([
        "It walks the chain from the <strong>genesis block</strong> forward, not from the tip backwards. "
        "This matters — a verifier that only checks the last link would miss an alteration further back.",
        "For each block it recomputes the hash from the previous hash, the Merkle root and the timestamp.",
        "It recomputes each transaction’s payload hash and compares it with the signed value.",
        "It recomputes the Merkle root from the leaves.",
        "At the first block where a recomputed value disagrees with the stored one, it reports the break: "
        "<em>which</em> block, <em>what</em> field, and <em>why</em> the two no longer agree.",
    ]),
    note("key", "Why it says “block 32” and not just “invalid”",
         "A verdict without a location is not evidence — it is an assertion. Naming the block and the "
         "field is what makes this a demonstration rather than a claim. Say the location out loud when "
         "you show it; that is the difference between showing a feature and proving a property."),
    h3("Why the restore works"),
    p("Restoring does not patch the broken block. It rebuilds the chain from the stored transactions, "
      "recomputing every hash and re-signing every block, then writes the result back. The chain after a "
      "restore is not the chain before — it is an independently reconstructed chain that happens to be "
      "equivalent. If any stored transaction had been genuinely lost, the restore could not reproduce it."),
    h3("The three things to say about it"),
    ul([
        "<strong>“I altered a signed payload.”</strong> Not “I changed a value in a database”. The "
        "payload was covered by a signature and a hash.",
        "<strong>“The verifier found it, and named where.”</strong> Location is the substance of the "
        "claim.",
        "<strong>“It is repeatable.”</strong> The examiner can click the same button. That is the "
        "difference between a video of a tamper test and a tamper test.",
    ]),
    h3("If someone asks “could an attacker just recompute everything?”"),
    p("They could recompute the hashes — that is the easy half. They could not produce the ordering "
      "service’s signature over the new block headers, nor the endorsers’ signatures over the altered "
      "transactions, without the corresponding private keys. That is why the signature is stored "
      "alongside the hash and why the verifier checks both."),
])

# ==========================================================================
# 22 — 3.4 phone
# ==========================================================================
page("p3-4", "3.4  Presenting on a phone", "Part 3 — the demo", [
    lead("The layout is fluid from 360&nbsp;px upward. Demonstrating on a phone is a genuine strength, "
         "because it shows the work was built for touch rather than resized to fit."),
    '<div class="two"><div class="col">',
    h3("How navigation works"),
    ul([
        "Tap <strong>☰</strong> at the top left to open the drawer.",
        "All seven sections are in it, plus the brand mark and the live chain status.",
        "Tapping a section closes the drawer and opens the page.",
        "Tap the backdrop, or press Escape, to dismiss it.",
    ]),
    h3("What changes"),
    ul([
        "The six stat tiles become a two-column grid.",
        "The hero stacks: text first, then the animated scene.",
        "Tables scroll sideways inside their own card rather than stretching the page.",
        "The identity switcher keeps only the avatar and the name.",
    ]),
    "</div><div class=\"col\">",
    '<div class="callout"><h4>The geo-stamp on a phone</h4>',
    p("This is the one step that behaves differently. The browser will ask for location permission."),
    p("Tap <strong>Allow</strong> and you get a genuine fix, usually within 10–30 metres."),
    p("If you tap <strong>Block</strong>, the app does not just fail — it explains exactly what to do "
      "(the padlock icon → Site settings → Location → Allow), offers a <strong>Try again</strong> "
      "button, and keeps the manual coordinate fields usable."),
    "</div>",
    '<div class="callout callout--tight"><h4>Rehearse this once</h4>',
    p("Do it before the presentation. On a phone the permission prompt appears only the first time, and "
      "it is a system dialog that will cover your app if you are not ready for it."),
    "</div>",
    "</div></div>",
    note("key", "A line worth having ready",
         "“The same URL, the same live ledger, the same backend — I built it to work on the phone because "
         "planters and verifiers in this scheme use phones, not desktops.”"),
])

# ==========================================================================
# 23 — 3.5 When it breaks
# ==========================================================================
page("p3-5", "3.5  When it breaks", "Part 3 — the demo", [
    lead("Something will go wrong. What matters is that you have already decided what to say, so the room "
         "reads it as part of the demonstration rather than as a failure."),
    table(
        ["What happens", "What it actually means", "What you do"],
        [
            ["<strong>Map tiles are blank</strong>",
             "The map tiles come from OpenStreetMap over the internet. The markers still plot — the "
             "layer underneath is missing.",
             "Say so and move on. “Those are OSM tiles; the markers are our data and they are all "
             "there.”"],
            ["<strong>Geolocation is blocked</strong>",
             "The origin is not secure, or permission was denied.",
             "Use <strong>Generate sample proof</strong> — it fills the coordinates and a proof image, and "
             "the demo continues unchanged."],
            ["<strong>The link does not open</strong>",
             "Network, or Cloudflare is having a moment.",
             "You have the local fallback ready: <span class=\"mono\">npm run dev</span> in the project "
             "folder. The app is fully functional offline with its own ledger."],
            ["<strong>The numbers look wrong</strong>",
             "You have been clicking for a while, so the ledger has grown and the block height moved.",
             "This is expected and even good — say “the chain grows as we interact.” Reset only if a "
             "check needs a specific state."],
            ["<strong>A panel looks empty</strong>",
             "Most likely you are acting as a role that has no permission on that page.",
             "Every gated page shows a <strong>RoleGate</strong> card listing who <em>can</em> do it, "
             "with a one-click switch. Click it and continue."],
            ["<strong>Console errors on screen</strong>",
             "Rare. If one appears, read it aloud — it shows you are not hiding anything.",
             "The 103 automated checks cover every page for every role."],
        ],
        "tight",
    ),
    note("warn", "Do not do this",
         "Do not restart the laptop, do not close the tab, and do not apologise repeatedly. Say what is "
         "happening, use the fallback, and move on. The examiner is evaluating the system, not your "
         "nerve — and a candidate who diagnoses a problem calmly scores better than one who panics."),
])

# ==========================================================================
# 24 — Viva Q&A
# ==========================================================================
QA = [
    ("What exactly is a blockchain?",
     "A ledger that several organisations share and that nobody can quietly rewrite, because every record "
     "is cryptographically linked to the one before it and the rules for changing it are enforced by code "
     "rather than by trust."),
    ("Why is a hash chain enough? Why not just encrypt things?",
     "Encryption protects data from people who should not read it. A hash chain proves that nobody changed "
     "what everyone can already read. GreenToken needs both — the ledger is deliberately public, so the "
     "guarantee has to be tamper-<em>evidence</em>, not confidentiality."),
    ("Is this real Hyperledger Fabric, or a simulation?",
     "The smart contract is real Fabric v2.5 TypeScript chaincode, in "
     "<span class=\"mono\">chaincode/src/contract.ts</span>, deployable with "
     "<span class=\"mono\">network/deploy.sh</span>. The business logic has no platform imports, so each "
     "host supplies its own stub. The demo ran on a Cloudflare Durable Object — a real "
     "ordering-and-commit host that needs no Docker. The same contract runs unchanged on Fabric."),
    ("Why did you deploy to Cloudflare rather than only shipping Fabric?",
     "Because a Fabric network is about four gigabytes of Docker images and a multi-step install. A demo "
     "that fails to start scores zero. Shipping both means the demonstration always works, and the Fabric "
     "deployment is still real, documented and repeatable in the lab."),
    ("Where is the data stored?",
     "Two layers, as in Fabric itself. The transaction log is the append-only hash-linked block history — "
     "the source of truth. World state is a key–value cache of current values, rebuilt from the log. The "
     "app verifies by replaying the log."),
    ("Can a planter fake it?",
     "They would have to photograph the same tree twice, and each photo’s SHA-256 is bound to a geo-hash "
     "and a distinct token id, so a duplicate photo hash is rejected outright. The reviewer sees the GPS "
     "accuracy. And they still need two endorsements from organisations the planter does not control."),
    ("Why two endorsements? Isn't one enough?",
     "One approver is the original trust problem — the approver becomes the thing you have to trust. Two "
     "independent organisations, with the contract enforcing that no single participant and no single "
     "organisation may review the same token twice. The rule lives in the chaincode, not in the UI."),
    ("What if the Forest Department is corrupt?",
     "That is exactly why the second signature comes from a separate organisation, and why auditors can "
     "read everything while planters’ contact details never enter the ledger. Full on-chain governance, "
     "where the consortium changes the rules by vote, is listed as future scope."),
    ("How do I know the dashboard numbers are real?",
     "They are read out of ledger state by the same read models the HTTP API exposes. I can show you the "
     "endpoint. Nothing on that dashboard is typed in by hand — and the leaderboard is a query over ledger "
     "state rather than a stored score."),
    ("What is a Merkle root and why do you need it?",
     "The transaction hashes are paired and hashed pairwise up to a single root, which is stored in the "
     "block header. It proves that a given transaction is in a given block without handing over the whole "
     "block — proof size is logarithmic in the number of transactions."),
    ("Why does the contract avoid Date.now()?",
     "Fabric chaincode has to be deterministic: every endorser evaluating the same proposal must reach "
     "the identical result. Wall-clock time, randomness and external calls are all forbidden. The contract "
     "takes its timestamp from the host, which supplies the block time, so every endorser sees the same "
     "clock reading."),
    ("What is an endorsement policy?",
     "A rule saying which parties must have signed for a transaction to be valid — for example "
     "<span class=\"mono\">AND('PlantersAssociationMSP','ForestDeptMSP')</span>. GreenToken’s rule is "
     "stronger than a policy expression, because the contract body itself checks that the approvals come "
     "from two distinct organisations."),
    ("How does the private data work?",
     "In GreenToken the planter’s contact is stripped at the chaincode boundary before it is hashed, "
     "stored or emitted — so it never reaches world state at all. Fabric also has private data "
     "collections, which distribute a value to authorised members while everyone sees only the hash; I "
     "chose the stronger, simpler guarantee here and label it as an emulation."),
    ("How does the discount actually get applied?",
     "The ladder lives in the contract — 500 units to 15%, 200 to 10%, 50 to 5%, 1 to 0%. FundTokens "
     "computes it from the basket size and writes gross, discount and net into the invoice. The client "
     "cannot choose its own discount."),
    ("What happens on a rejected token?",
     "Nothing can happen. Rejection is terminal: the contract refuses any further review, approval or "
     "re-inversion back into the queue. A rejection is evidence, not a speed bump."),
    ("Is the price negotiable?",
     "No. <span class=\"mono\">BASE_PRICE_INR = 150</span> per verified tree is fixed in the contract. "
     "The client cannot negotiate it and the funder cannot dictate it. The discount is the only lever, "
     "and it is also in the contract."),
    ("What is the biggest limitation?",
     "The demo host is a Durable Object, not a Fabric peer — the network layer is simulated even though "
     "the rules and cryptography are not. Settlement also marks an invoice settled without moving money. "
     "Both are stated plainly in the README and on the limitations slide of the deck."),
    ("How would you scale this to thousands of planters?",
     "The channel and the contract are already the right shape: peers per organisation, indexes by "
     "district and species, and read models served off state. The next real step is replacing the "
     "Durable Object host with a Fabric network, because the contract does not change — only the stub "
     "does."),
    ("Why can reads be public?",
     "Deliberately. This is a visibility use case: the point of a carbon registry is that buyers and the "
     "public can verify what is claimed. Only writes are role-gated, and the chaincode refuses any write "
     "from a role that does not hold it."),
    ("What would you do next?",
     "On-chain governance so the consortium can change the discount ladder by vote; a Fabric private data "
     "collection for the planter’s contact; a real oracle for carbon pricing; and a pager-and-email "
     "threshold for GPS accuracy so a poor fix is rejected automatically rather than shown to the "
     "reviewer."),
]
_qa = []
for _i, (_q, _a) in enumerate(QA):
    _qa.append('<div class="qa"><div class="qa__q">' + str(_i + 1) + ". " + _q
               + '</div><div class="qa__a">' + _a + "</div></div>")

page("p4", "Part 4 — Viva preparation", "4.1  Question bank, with answers", [
    lead("Twenty questions an examiner is likely to ask, with answers that are accurate to this codebase. "
         "Read the answers aloud once — a rehearsed answer sounds like knowledge."),
    "".join(_qa),
])

# ==========================================================================
# 25 — numbers
# ==========================================================================
page("p4-1", "4.2  The numbers to memorise", "Part 4 — viva preparation", [
    lead("If an examiner asks you to state a figure, it should be one of these. Everything below is read "
         "live from the deployed ledger."),
    '<div class="kpis">',
    '<div class="kpi"><div class="kpi__v">9</div><div class="kpi__l">tokens on chain</div></div>',
    '<div class="kpi"><div class="kpi__v">170</div><div class="kpi__l">trees recorded</div></div>',
    '<div class="kpi"><div class="kpi__v">4.7 t</div><div class="kpi__l">CO₂ per year</div></div>',
    '<div class="kpi"><div class="kpi__v">₹5,550</div><div class="kpi__l">disbursed</div></div>',
    "</div>",
    '<div class="kpis">',
    '<div class="kpi"><div class="kpi__v">₹15,525</div><div class="kpi__l">net across 3 invoices</div></div>',
    '<div class="kpi"><div class="kpi__v">29</div><div class="kpi__l">blocks</div></div>',
    '<div class="kpi"><div class="kpi__v">8 / 7</div><div class="kpi__l">planters / districts</div></div>',
    '<div class="kpi"><div class="kpi__v">167</div><div class="kpi__l">automated checks passing</div></div>',
    "</div>",
    table(
        ["Figure", "Value", "Where it comes from"],
        [
            ["Tokens minted", "9", "GetStats"],
            ["Status split", "3 VERIFIED · 4 FUNDED · 1 PENDING · 1 REJECTED", "GetStats"],
            ["Trees / planters / districts", "170 / 8 / 7", "GetStats, GetLeaderboard"],
            ["CO₂ sequestered", "4,743 kg = 4.7 t", "species rate × tree count, summed"],
            ["Gross invoiced", "₹16,050", "3 invoices"],
            ["Bulk discount saved", "₹525", "5% tier on the 70-tree invoice"],
            ["Net disbursed", "₹15,525", "₹9,975 settled + ₹5,550 settled"],
            ["Price per verified tree", "₹150", "<span class=\"mono\">BASE_PRICE_INR</span>"],
            ["Endorsements required", "2, from 2 distinct organisations",
             "<span class=\"mono\">REQUIRED_ENDORSEMENTS</span>"],
            ["Discount ladder", "0% / 5% / 10% / 15% at 1 / 50 / 200 / 500 units",
             "<span class=\"mono\">DISCOUNT_TIERS</span>"],
            ["Chaincode functions", "10 — 4 writes, 6 reads", "src/core/chaincode.ts"],
            ["Organisations", "4 MSPs, 14 named participants", "seed data"],
        ],
        "tight",
    ),
    note("key", "The honesty line, if they press on the numbers",
         "“Every one of those figures is read back out of ledger state by the same read models the API "
         "exposes — I can show you the HTTP response. Nothing is typed in by hand, and the leaderboard is a "
         "query over ledger state rather than a stored score.”"),
])

# ==========================================================================
# 26 — glossary
# ==========================================================================
page("p4-2", "4.3  Glossary", "Part 4 — viva preparation", [
    table(
        ["Term", "What it means"],
        [
            ["<span class=\"mono\">Chaincode</span>",
             "The smart contract. Business logic that runs on a peer. In Fabric it must be deterministic."],
            ["<span class=\"mono\">MSP</span>",
             "Membership Service Provider — the identity directory of one organisation. Maps participants "
             "to X.509 certificates and roles."],
            ["<span class=\"mono\">Channel</span>",
             "A private ledger plus a private ordering service, shared by a set of organisations. The unit "
             "of confidentiality and governance."],
            ["<span class=\"mono\">Peer</span>",
             "A node that holds the ledger, runs chaincode and endorses transactions. Owned by one "
             "organisation."],
            ["<span class=\"mono\">Orderer</span>",
             "The sequencing service. Batches endorsed transactions into blocks. Does not execute "
             "chaincode."],
            ["<span class=\"mono\">Gateway</span>",
             "A peer-side service (v2.4+, standardised in v2.5) that manages Evaluate, Endorse, Submit, "
             "commit status and events for the client."],
            ["<span class=\"mono\">Endorsement</span>",
             "A signed response from a peer that ran the chaincode and simulated the write."],
            ["<span class=\"mono\">Endorsement policy</span>",
             "The rule saying which parties must endorse for a transaction to be valid."],
            ["<span class=\"mono\">World state</span>",
             "The key–value database of current values. Rebuilt from the transaction log; a cache, not "
             "the truth."],
            ["<span class=\"mono\">Transaction log</span>",
             "The append-only, hash-linked block history. The source of truth."],
            ["<span class=\"mono\">Merkle root</span>",
             "A single hash committing to all transaction hashes in a block. Enables logarithmic inclusion "
             "proofs."],
            ["<span class=\"mono\">Quorum</span>",
             "The number of distinct parties that must agree before a transaction is valid. Here: two, "
             "from two different organisations."],
            ["<span class=\"mono\">Determinism</span>",
             "The requirement that every endorser computing the same proposal gets the same result. Why "
             "chaincode avoids clocks, randomness and I/O."],
            ["<span class=\"mono\">Private data</span>",
             "A value distributed only to authorised organisations; everyone else sees only its hash."],
            ["<span class=\"mono\">Durable Object</span>",
             "A Cloudflare compute primitive with a single strongly consistent, ordered store — used here "
             "as the demo’s ordering-and-commit host."],
            ["<span class=\"mono\">Stub</span>",
             "In this project, the small interface the contract uses to read and write state. Each host "
             "implements it."],
            ["<span class=\"mono\">RoleGate</span>",
             "The UI component that replaces a dead-end permission message with a one-click switch to an "
             "eligible identity."],
        ],
        "tight",
    ),
    note("key", "If you are asked for a definition you do not know",
         "Do not invent one. Say: “I am not certain about that — could I come back to you on it?” and then "
         "write it down. A confident wrong answer to a question you should know costs far more than an "
         "honest gap, because it makes the examiner distrust every other answer you give."),
])

# ==========================================================================
# 27 — Appendix A
# ==========================================================================
page("apx", "Appendix A — File map and how to run it yourself", "Appendix", [
    h3("The repository in one view"),
    table(
        ["Path", "What it holds"],
        [
            ["<span class=\"mono\">src/core/chaincode.ts</span>",
             "The rules. No platform imports. The heart of the project."],
            ["<span class=\"mono\">src/core/ledger.ts</span>",
             "MemoryStub, block assembly, chain verification, tamper and restore."],
            ["<span class=\"mono\">src/core/seed.ts</span>",
             "The genesis history, replayed through the real chaincode."],
            ["<span class=\"mono\">src/core/crypto.ts</span>", "SHA-256, ECDSA P-256, Merkle tree."],
            ["<span class=\"mono\">src/core/store.tsx</span>",
             "React store: identity switching, state, localStorage persistence."],
            ["<span class=\"mono\">src/components/</span>",
             "Dashboard, PlantTree, Verify, Discover, Leaderboard, LedgerExplorer, Invoices, TokenDetail, "
             "TreeMap, RoleGate."],
            ["<span class=\"mono\">src/motion/</span>",
             "The motion layer — Framer Motion components and the CSS that drives them."],
            ["<span class=\"mono\">src/styles.css</span>",
             "The design tokens and every component style. The single source of colour, spacing and "
             "elevation."],
            ["<span class=\"mono\">worker/src/index.ts</span>", "The Cloudflare Worker + Durable Object host."],
            ["<span class=\"mono\">chaincode/src/contract.ts</span>", "The real Fabric v2.5 chaincode host."],
            ["<span class=\"mono\">network/deploy.sh</span>",
             "Package, install, approve for four organisations, commit."],
            ["<span class=\"mono\">network/docker-compose.yaml</span>", "The four-organisation Fabric network."],
            ["<span class=\"mono\">scripts/verify.mjs</span>", "22-check browser end-to-end suite."],
            ["<span class=\"mono\">scripts/flow-test.mjs</span>",
             "103-check whole-flow suite, including every role."],
            ["<span class=\"mono\">scripts/contract-rules-check.mjs</span>",
             "42-check assertion suite over the contract rules."],
            ["<span class=\"mono\">ppt/slides/</span>", "The 21-slide deck, one file per slide."],
            ["<span class=\"mono\">docs/</span>",
             "This guide, the run of show, the architecture notes and the lab record."],
        ],
        "tight",
    ),
    h3("Running it locally"),
    code("cd greentoken\n"
         "npm install\n"
         "npm run dev          # http://localhost:5173 — the whole demo, offline"),
    p("No Docker, no accounts, no network. The ledger lives in localStorage; "
      "<strong>Ledger Explorer → ↺ Reset demo</strong> reseeds it from genesis."),
    h3("Deploying"),
    code("npm run build\n"
         "npx wrangler pages deploy dist --project-name greentoken --branch main\n"
         "npx wrangler deploy --config worker/wrangler.toml"),
    h3("Standing up the real Fabric network"),
    code("cd network\n"
         "docker compose up -d        # orderer + 4 peers + CouchDB + CA\n"
         "./deploy.sh                 # package, install, approve x4, commit"),
    p("Full detail in Appendix B."),
])

# ==========================================================================
# 28 — Appendix B
# ==========================================================================
INVOKE = ("peer chaincode invoke -C greentoken-channel "
          + chr(92) + chr(10)
          + "  -n greentoken -c "
          + chr(39) + '{"Args":["PlantTree","..."]}' + chr(39))

page("apx-2", "Appendix B — Standing up the real Fabric network", "Appendix", [
    lead("This is the lab part of the project. It is not needed for the live demo, but it is what makes "
         "the claim “real Fabric chaincode” verifiable rather than assertive."),
    h3("What the network contains"),
    table(
        ["Component", "Count", "Role"],
        [
            ["Ordering service", "1 (Raft, single node for the lab)",
             "Sequences endorsed transactions into blocks."],
            ["Peers", "4 — one per organisation",
             "Hold the ledger, run the chaincode, endorse transactions."],
            ["CouchDB", "1 (per peer)",
             "State database. LevelDB is fine but CouchDB supports rich range queries."],
            ["Certificate authority", "1", "Issues the MSP identities for all four organisations."],
            ["Channel", "1 — <span class=\"mono\">greentoken-channel</span>",
             "The shared ledger for the consortium."],
            ["Chaincode", "1 — <span class=\"mono\">greentoken</span>",
             "The contract, from <span class=\"mono\">chaincode/</span>."],
        ],
        "tight",
    ),
    h3("What deploy.sh does"),
    ol([
        "<strong>Package.</strong> The TypeScript chaincode is compiled and packaged into a "
        "<span class=\"mono\">.tar.gz</span>, the way Fabric expects.",
        "<strong>Install.</strong> The package is installed on every peer’s chaincode lifecycle.",
        "<strong>Approve.</strong> The chaincode definition is approved by <em>four distinct "
        "organisations</em> — this is the Fabric v2.x governance model, and it is why the script needs all "
        "four MSPs. The package id is captured from the real "
        "<span class=\"mono\">queryinstalled</span> output rather than assumed.",
        "<strong>Commit.</strong> The definition is committed to the channel, which activates the "
        "chaincode.",
    ]),
    note("key", "The detail that shows you understood Fabric governance",
         "Chaincode activation in Fabric v2.x is itself a multi-party governance transaction. No single "
         "organisation can unilaterally deploy a contract that the others will run — every member must "
         "approve the definition, and the approval policy is enforced by the channel configuration. That "
         "is the same principle the contract itself applies to planting proofs, at the level of the "
         "network."),
    h3("Then invoke it"),
    code(INVOKE),
    p("And to watch the events, subscribe to the chaincode event stream — the same stream the dashboard’s "
      "<em>Live chaincode events</em> panel shows."),
    note("warn", "Be honest about the environment",
         "Docker was not available in the sandbox where this project was built, so the Fabric network was "
         "authored, type-checked and packaged, but the live demonstration runs on the Durable Object "
         "host. Saying so plainly is not a weakness — it shows you understand which guarantee comes from "
         "where. The contract, the compose file and the deploy script are all present and correct, and "
         "the identical rules are what the audience actually sees."),
])

# ==========================================================================
# 29 — Appendix C references
# ==========================================================================
page("apx-3", "Appendix C — References and further reading", "Appendix", [
    table(
        ["Source", "What it is used for"],
        [
            ["<span class=\"mono\">hyperledger-fabric.readthedocs.io</span>",
             "The Fabric v2.5 documentation — concepts, transaction lifecycle, gateway, chaincode "
             "lifecycle, and the v2.5 release notes."],
            ["Nakul Shah, <em>Blockchain Technology with Hyperledger Fabric</em>, BPB 2019",
             "The course text. Chapters on Fabric architecture, the transaction flow, and smart "
             "contracts."],
            ["Yannis Kalfoglou, <em>Blockchain for Business with Hyperledger Fabric</em>, Routledge 2021",
             "A practical treatment of Fabric for enterprise use cases, including supply-chain finance."],
            ["A. K. N. Kumar, M. Zad, et al., <em>Hyperledger Fabric In-Depth</em>, Learn and Deploy",
             "A worked reference for the channel configuration, endorsement policies and the chaincode "
             "lifecycle."],
            ["M. Zad, A. K. N. Kumar, W. Anwar, <em>Hands-On Smart Contracts and Smart Contract "
             "Testing</em>, Apress 2021",
             "Testing and deployment practice for chaincode."],
        ],
        "tight",
    ),
    h3("Primary documentation worth bookmarking"),
    ul([
        "<span class=\"mono\">hyperledger-fabric.readthedocs.io/en/release-2.5/</span> — the v2.5 branch of "
        "the official documentation.",
        "<span class=\"mono\">hyperledger-fabric.readthedocs.io/en/release-2.5/gateway.html</span> — the "
        "Fabric Gateway.",
        "<span class=\"mono\">hyperledger-fabric.readthedocs.io/en/release-2.5/peers.html</span> — peers, "
        "the transaction flow and chaincode as a service.",
        "<span class=\"mono\">hyperledger-fabric.readthedocs.io/en/release-2.5/chaincode.html</span> — the "
        "chaincode lifecycle and the v2.x governance model.",
    ]),
    note("key", "A closing note on how to present all of this",
         "You built something with a genuine hash chain, real signatures, real consensus rules, and a "
         "deployment that runs on the public internet. Present it as what it is: a working system with a "
         "clearly stated scope. Specificity — about both the strengths and the limitations — is what makes "
         "the rest of it credible."),
])

# ==========================================================================
# HTML assembly
# ==========================================================================
CSS = """
@page { size: A4 portrait; margin: 15mm 14mm; }
* { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

:root {
  --paper: #FFFFFF;
  --tint: #F4F8F5;
  --tint2: #EAF4EE;
  --line: #DCE8E0;
  --ink: #12211A;
  --dim: #48654F;
  --faint: #75897D;
  --accent: #1E8E4E;
  --deep: #14663A;
  --deeper: #12211A;
  --warn: #96650C;
  --danger: #C0392B;
  --sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --mono: ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
}

html, body { margin: 0; padding: 0; }
body {
  font-family: var(--sans);
  font-size: 10.2pt;
  line-height: 1.5;
  color: var(--ink);
  background: var(--paper);
  -webkit-font-smoothing: antialiased;
}

@media screen {
  html { background: #d3d3d3; }
  body { margin: 0; padding: 20px 0; }
  body > section {
    width: 210mm;
    min-height: 297mm;
    margin: 0 auto 20px;
    background: #fff;
    box-shadow: 0 4px 24px rgba(0,0,0,0.18);
    box-sizing: border-box;
    overflow: hidden;
  }
}

.page { position: relative; }
.page--part { break-before: page; }
.cover { break-after: page; }

h2, h3, h4 { break-after: avoid; }
p, li { orphans: 3; widows: 3; }
tr { break-inside: avoid; }
.two, .grid2 { break-inside: avoid; }
pre.code { break-inside: avoid; }
.say { break-inside: avoid; }
.note { break-inside: avoid; }
.qa { break-inside: avoid; }

/* ---------- cover ---------- */
.cover { break-after: page; }
.masthead {
  background: linear-gradient(120deg, #14382A 0%, #1E5A3B 60%, #2A7449 100%);
  border-radius: 2.5mm;
  padding: 9mm 10mm;
  display: flex; align-items: center; gap: 7mm;
  margin-bottom: 13mm;
}
.masthead__mark { flex: 0 0 auto; line-height: 0; }
.masthead__type { flex: 1; }
.masthead__word {
  font-size: 22pt; font-weight: 800; letter-spacing: 4.5pt; color: #EAF3EC; line-height: 1;
}
.masthead__rule { height: 1pt; background: rgba(143,217,174,0.45); margin: 4mm 0 3mm; }
.masthead__sub { font-size: 8.6pt; letter-spacing: 0.9pt; color: #A9D2BC; text-transform: uppercase; }
.cover-title { font-size: 29pt; line-height: 1.12; margin: 0 0 6mm; font-weight: 700; letter-spacing: -1pt; color: var(--ink); }
.cover-accent { color: var(--accent); }
.cover-sub { font-size: 11.5pt; line-height: 1.55; color: var(--dim); max-width: 150mm; margin: 0 0 11mm; }
.cover-meta { border-top: 1pt solid var(--line); padding-top: 4mm; }
.cover-meta div { display: flex; gap: 5mm; padding: 2mm 0; border-bottom: 0.5pt solid var(--line); }
.cover-meta span { flex: 0 0 24mm; font-size: 7.6pt; text-transform: uppercase; letter-spacing: 1.1pt; color: var(--faint); font-weight: 700; padding-top: 0.6mm; }
.cover-meta strong { font-weight: 600; font-size: 9.8pt; color: var(--ink); }
.cover-foot { margin-top: 7mm; font-size: 9pt; color: var(--faint); font-style: italic; }

.subkicker {
  font-size: 8pt; text-transform: uppercase; letter-spacing: 1.5pt; color: var(--faint);
  font-weight: 700; margin: 0 0 4mm;
}
.page--part .subkicker { margin-bottom: 6mm; }

/* ---------- headings ---------- */
h2 { font-size: 15pt; margin: 0 0 3mm; letter-spacing: -0.4pt; font-weight: 700; }
h3 { font-size: 11pt; margin: 5mm 0 1.6mm; font-weight: 700; color: var(--deep); letter-spacing: -0.15pt; }
h4 { font-size: 10pt; margin: 0 0 1.4mm; font-weight: 700; }
p { margin: 0 0 2.6mm; }
p.lead { font-size: 11pt; color: var(--dim); line-height: 1.55; margin-bottom: 4mm; }
p.tight { margin-bottom: 1mm; }
p.tiny { font-size: 8.6pt; color: var(--faint); line-height: 1.42; }
em { font-style: italic; }
strong { font-weight: 700; }
b { font-weight: 700; }
.mono { font-family: var(--mono); font-size: 0.94em; }
ul, ol { margin: 0 0 3mm; padding-left: 5mm; }
li { margin-bottom: 1.3mm; }
ol li { margin-bottom: 1.5mm; }

/* ---------- toc ---------- */
.toc {
  margin-top: 3.5mm; border-top: 1pt solid var(--line); padding-top: 2.5mm;
  column-count: 2; column-gap: 8mm; column-fill: balance;
}
.toc-row {
  display: flex; align-items: baseline; gap: 1.6mm;
  text-decoration: none; color: var(--ink); font-size: 8.5pt;
  padding: 0.5mm 0; border-bottom: 0.5pt dotted #E4EDE7;
  break-inside: avoid;
}
.toc-row--part {
  font-weight: 700; color: var(--deep); font-size: 9.4pt;
  padding-top: 2.2mm; padding-bottom: 1.1mm;
  border-bottom: 0.7pt solid #CFE3D8; break-after: avoid;
}
.toc-row--part:first-child { padding-top: 0.4mm; }
.toc-row--sub { padding-left: 3mm; color: var(--dim); }
.toc-row--sub:first-of-type { padding-top: 0.4mm; }
.toc-row .dots { flex: 1; border-bottom: 0.5pt dotted #C9D9CE; transform: translateY(-1.2mm); }
.toc-row .page-ref { color: var(--faint); font-variant-numeric: tabular-nums; font-weight: 600; }
a { color: var(--deep); }

/* ---------- components ---------- */
.note {
  border-left: 3px solid var(--accent); background: var(--tint2);
  padding: 3mm 4mm; margin: 3.5mm 0; border-radius: 0 2mm 2mm 0;
  page-break-inside: avoid;
}
.note > strong { display: block; font-size: 9.4pt; color: var(--deep); margin-bottom: 1.2mm; }
.note p { margin: 0; font-size: 9.4pt; line-height: 1.45; color: var(--dim); }
.note--warn { border-left-color: var(--warn); background: #FDF6E8; }
.note--warn strong { color: #7A5109; }
.note--warn p { color: #7A5B22; }

.callout {
  border: 1px solid var(--line-strong); background: var(--tint);
  padding: 3.4mm 4mm; border-radius: 2mm; margin: 3mm 0; page-break-inside: avoid;
}
.callout h4 { color: var(--deep); margin-bottom: 1.4mm; }
.callout p { margin: 0 0 1.6mm; font-size: 9.4pt; color: var(--dim); }
.callout p:last-child { margin-bottom: 0; }
.callout--tight { padding: 2.6mm 3.2mm; margin: 2mm 0; }

pre.code {
  font-family: var(--mono); font-size: 8.4pt; line-height: 1.5;
  background: var(--tint); border: 0.5pt solid var(--line);
  border-left: 2.5pt solid var(--accent);
  padding: 2.6mm 3.4mm; border-radius: 0 1.5mm 1.5mm 0;
  white-space: pre-wrap; word-break: break-word;
  margin: 2.4mm 0 3mm; color: #1B3A28;
}

.say {
  border-left: 2.5pt solid var(--accent); background: #F2F9F4;
  padding: 2.4mm 3.4mm; margin: 1.8mm 0 3mm; border-radius: 0 1.5mm 1.5mm 0;
  font-size: 9.6pt; line-height: 1.46; color: #22402F;
}
.say em { color: var(--deep); }
.time {
  display: inline-block; margin-left: 2mm; font-size: 8pt; font-weight: 700;
  background: var(--tint2); color: var(--deep); border: 1px solid var(--line-strong);
  border-radius: 8mm; padding: 0.3mm 2mm; vertical-align: 1.2pt;
}

table {
  width: 100%; border-collapse: collapse; font-size: 8.8pt; margin: 2mm 0 3.5mm;
}
table.tight { font-size: 8.1pt; }
thead { display: table-header-group; }
th {
  text-align: left; padding: 1.8mm 2.4mm; font-size: 7.6pt; text-transform: uppercase;
  letter-spacing: 0.9pt; color: #fff; background: var(--deeper); font-weight: 700;
}
td { padding: 1.8mm 2.4mm; border-bottom: 0.5pt solid var(--line); vertical-align: top; line-height: 1.38; }
tbody tr:nth-child(even) td { background: #FAFCFA; }
table.twocol td { width: 50%; }

.pill { display: inline-block; padding: 0.4mm 1.8mm; border-radius: 8mm; font-size: 7.4pt; font-weight: 700; }
.pill-warn { background: #FFF3E0; color: #96650C; }
.pill-ok { background: #E8F5E9; color: #2E7D32; }
.pill-good { background: #E3F2FD; color: #1565C0; }
.pill-bad { background: #FFEBEE; color: #C62828; }

.cards { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm; margin: 2mm 0 3mm; }
.card { border: 1px solid var(--line); border-radius: 2mm; padding: 3mm 3.4mm; background: var(--tint); page-break-inside: avoid; }
.card h4 { color: var(--deep); margin-bottom: 1.2mm; }
.card p { font-size: 8.8pt; color: var(--dim); margin: 0 0 1.4mm; }
.card p.tiny { font-size: 8.1pt; color: var(--faint); margin: 0; }

.two { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; }
.two .col { min-width: 0; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; }
.grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3.4mm; margin: 3mm 0 4mm; }
.mini { border: 1px solid var(--line); border-radius: 2mm; padding: 3mm; background: var(--tint); }
.mini__k { font-size: 7pt; letter-spacing: 1.1pt; color: var(--accent); font-weight: 800; margin-bottom: 1.2mm; }
.mini h3 { margin: 0 0 1.4mm; font-size: 10.4pt; }
.mini p { font-size: 8.1pt; color: var(--dim); margin: 0; }

.rules { margin: 2mm 0; }
.rule { display: flex; gap: 3mm; padding: 2.4mm 0; border-bottom: 0.5pt solid var(--line); page-break-inside: avoid; }
.rule:last-child { border-bottom: none; }
.rule__n { flex: 0 0 9mm; font-size: 14pt; font-weight: 800; color: #B9DCC6; line-height: 1.1; }
.rule h4 { margin: 0 0 0.8mm; font-size: 9.6pt; color: var(--deep); }
.rule p { margin: 0; font-size: 8.7pt; color: var(--dim); line-height: 1.42; }

.qa { margin-bottom: 3mm; page-break-inside: avoid; }
.qa__q { font-weight: 700; font-size: 9.8pt; color: var(--deep); margin-bottom: 1mm; }
.qa__a { font-size: 9pt; color: var(--dim); line-height: 1.46; padding-left: 4mm; border-left: 1.5pt solid var(--accent-tint-2); border-left-color: #C7DFD2; }

.kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2.6mm; margin: 0 0 3mm; }
.kpi { border: 1px solid var(--line); border-radius: 2mm; padding: 2.6mm 3mm; background: var(--tint); }
.kpi__v { font-size: 16pt; font-weight: 700; color: var(--deep); line-height: 1.05; letter-spacing: -0.6pt; font-variant-numeric: tabular-nums; }
.kpi__l { font-size: 7.6pt; color: var(--faint); margin-top: 0.8mm; }

.probe { position: absolute; top: 0; left: 0; font-size: 1pt; color: #FFFFFF; letter-spacing: 0; }
.page--part > h2:first-of-type {
  font-size: 22pt; letter-spacing: -0.8pt; line-height: 1.1; margin: 0 0 2mm;
  padding-bottom: 3mm; border-bottom: 2pt solid var(--accent);
}
.page--part > h2:first-of-type + .lead { font-size: 11.5pt; }
.parttag {
  display: inline-block; font-size: 8pt; font-weight: 800; letter-spacing: 1.6pt;
  text-transform: uppercase; color: var(--accent); margin-bottom: 2.5mm;
}
.diagram { width: 100%; height: auto; display: block; margin: 2mm 0 3mm; page-break-inside: avoid; }
.shot { margin: 2mm 0 3mm; page-break-inside: avoid; }
.shot img { width: 100%; height: auto; display: block; border: 0.5pt solid var(--line); border-radius: 2mm; }
.shot figcaption { font-size: 8pt; color: var(--faint); margin-top: 1.4mm; }
"""

parts = [
    "<!DOCTYPE html>", '<html lang="en">', "<head>",
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    "<title>GreenToken — Hyperledger Fabric from first principles to a live demo</title>",
    "<style>" + CSS + "</style>", "</head>", "<body>",
]

PROBE = os.environ.get("GUIDE_PROBE") == "1"

for idx, pg in enumerate(PAGES):
    parts.append('<section class="' + pg["cls"] + '" id="' + pg["id"] + '">')
    if PROBE:
        parts.append('<span class="probe">@' + pg["id"] + "@</span>")
    parts.append(pg["body"])
    parts.append("</section>")

parts.append("</body></html>")

html = "\n".join(parts)
OUT_HTML.write_text(html, encoding="utf-8")
print("wrote " + str(OUT_HTML) + " (" + str(len(html)) + " bytes, " + str(len(PAGES)) + " sections)")
