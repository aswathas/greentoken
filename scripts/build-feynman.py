#!/usr/bin/env python3
"""
Build "Hyperledger Fabric, taught from first principles" — a 15-page teaching
document in the Feynman mould: start from what actually breaks, rebuild each
idea from the ground up, and check understanding at every step.

Structure of every page:
  THE QUESTION     what problem does this idea solve?
  FIRST PRINCIPLES the construction, built up from nothing
  THE FEYNMAN CHECK  could you explain it to a freshman?
  IN GREENTOKEN     the same idea, in this project's code

Every technical claim was checked against the repository source. The diagrams
are hand-authored SVG: one idea per picture, deliberately simpler than the
reference diagram pack, because a teaching diagram that needs a legend has
already failed.

Output: docs/feynman.html  ->  docs/Hyperledger-Fabric-First-Principles.pdf
"""
import os
import pathlib

DOCS = pathlib.Path("/workspace/greentoken/docs")
OUT_HTML = DOCS / "feynman.html"

PAGES = []
W = 1000


# --------------------------------------------------------------------------
# html helpers
# --------------------------------------------------------------------------
def page(pid, num, title, subtitle, chunks):
    PAGES.append({"id": pid, "num": num, "title": title, "subtitle": subtitle,
                  "body": "\n".join(chunks)})


def h2(t):
    return "<h2>" + t + "</h2>"


def h3(t):
    return "<h3>" + t + "</h3>"


def p(t):
    return "<p>" + t + "</p>"


def lead(t):
    return '<p class="lead">' + t + "</p>"


def q(t):
    """The question the page answers."""
    return '<div class="q"><span class="q__k">The question</span>' + t + "</div>"


def check(t):
    """The Feynman check."""
    return ('<div class="check"><span class="check__k">The Feynman check</span>'
            '<p>' + t + "</p></div>")


def ours(t):
    """The same idea in our project."""
    return ('<div class="ours"><span class="ours__k">In GreenToken</span>'
            '<p>' + t + "</p></div>")


def ul(items):
    return "<ul>" + "".join("<li>" + i + "</li>" for i in items) + "</ul>"


def ol(items):
    return "<ol>" + "".join("<li>" + i + "</li>" for i in items) + "</ol>"


def table(headers, rows, cls="tight"):
    th = "".join("<th>" + h + "</th>" for h in headers)
    tb = "".join("<tr>" + "".join("<td>" + c + "</td>" for c in r) + "</tr>" for r in rows)
    return ('<table class="' + cls + '"><thead><tr>' + th + "</tr></thead><tbody>"
            + tb + "</tbody></table>")


def code(t):
    return '<pre class="code">' + t + "</pre>"


def band(label, text):
    return '<div class="band"><b>' + label + "</b><span>" + text + "</span></div>"


# --------------------------------------------------------------------------
# svg helpers
# --------------------------------------------------------------------------
def svg(body, w=W, h=420, label=""):
    return ('<svg class="dg" viewBox="0 0 ' + str(w) + " " + str(h) + '" role="img" '
            'aria-label="' + label + '">' + DEFS + body + "</svg>")


def box(x, y, w, h, cls="ink", rx=8):
    return ('<rect x="' + str(x) + '" y="' + str(y) + '" width="' + str(w) + '" height="' + str(h)
            + '" rx="' + str(rx) + '" class="bx bx--' + cls + '"/>')


def t(x, y, s, cls="t2", anchor="start"):
    return ('<text x="' + str(x) + '" y="' + str(y) + '" class="' + cls
            + '" text-anchor="' + anchor + '">' + s + "</text>")


def line(x1, y1, x2, y2, cls="ln", dash=""):
    d = ' stroke-dasharray="' + dash + '"' if dash else ""
    return ('<line x1="' + str(x1) + '" y1="' + str(y1) + '" x2="' + str(x2) + '" y2="' + str(y2)
            + '" class="' + cls + '"' + d + "/>")


def path(d, cls="ln", dash=""):
    ds = ' stroke-dasharray="' + dash + '"' if dash else ""
    return '<path d="' + d + '" class="' + cls + '"' + ds + "/>"


def wrap(x, y, s, cls="t4", maxc=44, lh=14):
    words, lines, cur = s.split(), [], ""
    for w in words:
        if cur and len(cur) + 1 + len(w) > maxc:
            lines.append(cur)
            cur = w
        else:
            cur = (cur + " " + w) if cur else w
    if cur:
        lines.append(cur)
    return "".join(t(x, y + i * lh, ln, cls) for i, ln in enumerate(lines))


DEFS = """
<defs>
  <marker id="ar" markerWidth="9" markerHeight="9" refX="7.5" refY="3.2" orient="auto">
    <path d="M0,0 L0,6.4 L7,3.2 z" fill="#5E7D68"/>
  </marker>
</defs>
"""


# ==========================================================================
# 1 — COVER
# ==========================================================================
COVER = """
<div class="cover-art">
  <svg viewBox="0 0 120 120" width="86" height="86" role="img" aria-label="A tree with a token above it">
    <path d="M60 106 V64" stroke="#8FD9AE" stroke-width="7" stroke-linecap="round"/>
    <path d="M60 80 L40 66 M60 92 L82 76" stroke="#8FD9AE" stroke-width="5" stroke-linecap="round"/>
    <path d="M60 62 C38 62 23 48 23 32 C23 18 34 8 47 7 C54 -5 66 -9 76 -4 C89 0 97 11 96 23
             C105 28 109 38 106 47 C102 58 87 62 76 59 Z" fill="#37A869"/>
    <path d="M34 106 H86" stroke="#8FD9AE" stroke-width="6" stroke-linecap="round"/>
    <g transform="translate(60,22)">
      <polygon points="0,-15 13,-7 13,7 0,15 -13,7 -13,-7" fill="none" stroke="#8FD9AE" stroke-width="2.4"/>
      <path d="M-5 0 L-1 4.5 L6 -4" fill="none" stroke="#8FD9AE" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </svg>
</div>
<h1 class="cover-title">Hyperledger Fabric,<br><span class="cvacc">taught from first principles</span></h1>
<p class="cover-sub">Fifteen pages that rebuild Hyperledger Fabric from the ground up — starting from
what actually goes wrong when four organisations try to share a record — and end inside our own
GreenToken contract. Written in the Feynman mould: no definition is given before the problem it
solves, and every idea has to survive a plain-language test.</p>
<div class="cover-meta">
  <div><span>Companion to</span><strong>21CSE435T — Smart Contracts and Application Development</strong></div>
  <div><span>Builds on</span><strong>GreenToken — verifiable carbon tokens</strong></div>
  <div><span>Live demo</span><strong class="mono">greentoken-7gc.pages.dev</strong></div>
</div>
<p class="cover-foot">"If you can't explain it to a freshman, you don't really understand it."</p>
"""

page("cover", "", "Hyperledger Fabric, taught from first principles", "", [COVER])

# ==========================================================================
# 2 — HOW TO USE
# ==========================================================================
_TOC_ROWS = [
    ("1", "What actually goes wrong", "the problem"),
    ("2", "The fingerprint: SHA-256", "the cryptography"),
    ("3", "The chain: why one fingerprint is not enough", "the cryptography"),
    ("4", "The signature: making it unforgeable", "the cryptography"),
    ("5", "The Merkle tree: proving one thing inside a big set", "the cryptography"),
    ("6", "The parts, and what breaks without each", "the machinery"),
    ("7", "The journey of one transaction", "the machinery"),
    ("8", "Endorsement, quorum and determinism", "the machinery"),
    ("9", "Privacy, and the choice not to use it", "the machinery"),
    ("10", "Now put it all together: our project", "our project"),
    ("11", "The advanced shelf: what you meet next", "beyond"),
    ("12", "Where the edges are", "beyond"),
    ("13", "The whole thing on one page", "beyond"),
]

page("howto", "", "How to read this", "Before we begin", [
    lead("Feynman had a rule for checking understanding, and it is the spine of this document. You do "
         "not understand a thing until you can rebuild it from the ground up, out loud, to somebody who "
         "has never heard of it. Memorising the vocabulary is not the same as knowing the idea, and "
         "the vocabulary is much easier to fake."),
    '<div class="grid2">',
    '<div class="mini">',
    h3("The four moves"),
    ol([
        "<b>Name the problem.</b> Never start with a definition. Start with what breaks.",
        "<b>Ask what you already know.</b> Build the new idea out of familiar material.",
        "<b>Try it.</b> Work the thing through, and see where it stops making sense.",
        "<b>Go back to step one.</b> When it breaks, the problem was mis-stated. Fix the statement.",
    ]),
    "</div>",
    '<div class="mini">',
    h3("What each page gives you"),
    ul([
        "<b>The question</b> — the problem this idea exists to solve.",
        "<b>First principles</b> — the construction, built from nothing.",
        "<b>The Feynman check</b> — can you say it in one sentence?",
        "<b>In GreenToken</b> — the same idea, in our code, with a real number.",
    ]),
    "</div>",
    "</div>",
    '<div class="path">',
    '<span class="path__k">The path</span>',
    '<div class="path__row">',
    '<span class="path__s">Part 1<br><i>the problem</i></span>',
    '<span class="path__a">&rarr;</span>',
    '<span class="path__s">Part 2<br><i>the cryptography</i></span>',
    '<span class="path__a">&rarr;</span>',
    '<span class="path__s">Part 3<br><i>the machinery</i></span>',
    '<span class="path__a">&rarr;</span>',
    '<span class="path__s">Part 4<br><i>our project</i></span>',
    '<span class="path__a">&rarr;</span>',
    '<span class="path__s">Part 5<br><i>beyond</i></span>',
    "</div>",
    "</div>",
    q("So why build a blockchain at all? Four organisations already exist, they already have "
      "databases, and this is a solved problem. What exactly is broken?"),
    p("That question is the whole of Part 1, and it is worth sitting with, because most blockchain "
      "explanations begin by assuming the answer."),
    h3("What is on each page"),
    '<div class="toc">' + "".join('<div class="tocrow"><span class="tocn">' + n + '</span><span class="toct">'
                         + t + '</span><span class="tocp">' + part + "</span></div>"
                         for n, t, part in _TOC_ROWS) + "</div>",
])

# ==========================================================================
# 3 — THE PROBLEM
# ==========================================================================
d3 = []
d3.append(t(20, 26, "Four organisations, four private notebooks", "t1"))
NAMES = [("Forest Dept", "verifier"), ("Auditor", "verifier"),
         ("Planters", "planter"), ("Funders", "buyer")]
for i, (n, role) in enumerate(NAMES):
    x = 20 + i * 245
    d3.append(box(x, 44, 215, 66, "ink", 8))
    d3.append(t(x + 107, 70, n, "t1", "middle"))
    d3.append(t(x + 107, 92, "keeps its own notebook", "t4", "middle"))
d3.append(t(500, 190, "?", "t1", "middle"))
for i in range(4):
    x = 20 + i * 245
    d3.append(path("M" + str(x + 107) + " 110 V150 H" + str(500 + (i - 1.5) * 40)))
d3.append(box(370, 168, 260, 56, "bad", 8))
d3.append(t(500, 192, "No shared truth", "t1", "middle"))
d3.append(t(500, 212, "whose notebook is right?", "t4", "middle"))
d3.append(box(20, 246, 470, 150, "warn", 10))
d3.append(t(40, 272, "What goes wrong", "t2"))
for i, s in enumerate(["The planter sells the same trees twice",
                       "The department quietly changes its approval",
                       "The buyer cannot check what they were told",
                       "Nobody can prove who changed what"]):
    d3.append(t(40, 296 + i * 22, "✕  " + s, "t3w"))
d3.append(box(510, 246, 470, 150, "acc", 10))
d3.append(t(530, 272, "What each failure needs", "t2"))
for i, s in enumerate(["a shared, append-only record",
                       "evidence nobody can quietly alter",
                       "a copy every member can check alone",
                       "blame that survives"]):
    d3.append(t(530, 296 + i * 22, "✓  " + s, "t3c"))
page("p1", "1", "What actually goes wrong", "Part 1 — the problem", [
    h2("What actually goes wrong"),
    svg("".join(d3), h=410, label="Four organisations with separate notebooks and the three failures that follow"),
    q("Four organisations each keep their own record of which tree plantings are real. What is "
      "actually broken, and what would fix it?"),
    p("Nothing, at first glance — until somebody is dishonest or careless. The planter submits the "
      "same photograph twice. The department revises an approval. The buyer receives a summary and "
      "cannot check it against anything. Each of these is a <em>trust</em> failure, not a technology "
      "failure, and that observation matters: no database fixes it, because in a shared database one "
      "organisation owns the truth and the other three have to believe the owner."),
    p("So the requirement is sharper than \\u201cshare a database\\u201d. It is: <b>a record that every "
      "member holds a copy of, that can only be added to, that cannot be altered without the "
      "alteration being detectable by anyone who holds a copy, and that shows who did what.</b> Every "
      "remaining idea in this document is a different answer to one clause of that sentence."),
    check("A blockchain is a ledger several organisations share and that nobody can quietly rewrite, "
          "because every record is cryptographically linked to the one before it and the rules for "
          "changing it are enforced by code rather than by trust."),
    ours("GreenToken's four parties are exactly this picture: a planters association, a state forest "
         "department, an independent auditor and a corporate funder, each of whom would otherwise "
         "keep their own spreadsheet of which plantings count."),
])

# ==========================================================================
# 4 — SHA-256
# ==========================================================================
d4 = []
d4.append(box(40, 40, 190, 120, "ink", 8))
d4.append(t(135, 78, "a photograph", "t2", "middle"))
d4.append(t(135, 102, "2,481,193 bytes", "t3", "middle"))
d4.append(t(135, 126, "no meaning, no order", "t4", "middle"))
d4.append(path("M240 100 H330", "lnacc"))
d4.append(box(340, 40, 200, 120, "acc", 8))
d4.append(t(440, 70, "SHA-256", "t1", "middle"))
d4.append(t(440, 94, "a machine that", "t3", "middle"))
d4.append(t(440, 114, "shakes the bytes", "t3", "middle"))
d4.append(t(440, 134, "into 64 hex characters", "t4", "middle"))
d4.append(path("M550 100 H640", "lnacc"))
d4.append(box(650, 40, 310, 120, "mut", 8))
d4.append(t(805, 76, "3a9f…c41b", "t2", "middle"))
d4.append(t(805, 100, "64 characters. Always.", "t3", "middle"))
d4.append(t(805, 124, "Same input, same output, forever.", "t4", "middle"))
d4.append(box(40, 190, 920, 92, "ink", 8))
d4.append(t(60, 216, "Three properties, and why each one earns its place", "t2"))
for i, (k, v) in enumerate([
        ("Deterministic", "the same bytes always give the same fingerprint, on every machine"),
        ("One-way", "you cannot run the fingerprint backwards to recover the photograph"),
        ("Collision-resistant", "two different photographs cannot both give this fingerprint")]):
    x = 60 + i * 300
    d4.append(t(x, 244, k, "t3c"))
    d4.append(wrap(x, 262, v, "t4", 44, 13))
page("p2", "2", "The fingerprint", "Part 2 — the cryptography", [
    h2("The fingerprint: SHA-256"),
    svg("".join(d4), h=300, label="A photograph is passed through SHA-256 and produces a fixed 64-character fingerprint"),
    q("We want to put a photograph on a shared record without putting a four-megabyte file there. "
      "What do we write instead, and why is a digest enough?"),
    p("We write its <b>fingerprint</b>: 64 hexadecimal characters that stand in for the whole file. "
      "The important point is not that the fingerprint is short — it is what the fingerprint "
      "<em>commits to</em>. Once the fingerprint is on the shared record, nobody can later swap in a "
      "different photograph, because the different photograph has a different fingerprint, and the "
      "fingerprint on the record will not match it."),
    p("Notice also what a hash is <em>not</em>. It is not encryption. It does not hide anything: "
      "anyone holding the photograph can confirm the fingerprint, and anyone holding only the "
      "fingerprint learns nothing about the photograph. That is exactly what a public registry needs — "
      "proof of identity, not secrecy."),
    check("A hash is a one-way fingerprint. It proves that this data is the same data you signed, "
          "and it conceals nothing about the data itself."),
    ours("GreenToken hashes the photo bytes <em>and</em> the geo payload — latitude, longitude and "
         "accuracy together — so that changing the accuracy figure changes the hash. The photo itself "
         "never leaves the planter's phone."),
])

# ==========================================================================
# 5 — HASH CHAIN
# ==========================================================================
d5 = []
for i in range(3):
    x = 40 + i * 310
    d5.append(box(x, 60, 250, 130, "ink", 8))
    d5.append(t(x + 125, 90, "Block " + str(i + 1), "t1", "middle"))
    d5.append(t(x + 20, 116, "transactions", "t3"))
    d5.append(t(x + 20, 138, "merkleRoot  a91f…", "t3"))
    d5.append(t(x + 20, 160, "prevHash  " + ("0000…" if i == 0 else "7d03…"), "t3"))
    if i:
        d5.append(path("M" + str(x - 60) + " 125 H" + str(x - 8)))
d5.append(t(500, 225, "each block carries the previous block's fingerprint", "t3", "middle"))
d5.append(box(40, 250, 440, 110, "warn", 8))
d5.append(t(60, 276, "Change one transaction in block 2", "t2"))
d5.append(wrap(60, 298, "block 2's fingerprint changes, so block 3's prevHash is now wrong, so "
                         "block 3's fingerprint changes, and so on to the tip.", "t4", 56, 15))
d5.append(box(520, 250, 440, 110, "bad", 8))
d5.append(t(540, 276, "But wait", "t2"))
d5.append(wrap(540, 298, "an attacker who controls the database could simply recompute every "
                         "fingerprint, and the chain would look perfect again.", "t4", 56, 15))
page("p3", "3", "The chain", "Part 2 — the cryptography", [
    h2("The chain: why one fingerprint is not enough"),
    svg("".join(d5), h=380, label="Blocks linked by fingerprint, and the cascade when an earlier block is altered"),
    q("If we store one fingerprint per block, an attacker who can rewrite the database could "
      "recompute all the fingerprints and hide the change. So what stops them?"),
    p("Nothing yet — and this is exactly the point Feynman would insist on. A hash chain gives you "
      "<em>tamper-evidence</em>, not <em>tamper-prevention</em>. It means an alteration cannot be "
      "hidden <em>without being noticed</em>. It does not mean an alteration cannot be made."),
    p("So we have learned something precise and useful: <b>the hash chain tells you <em>where</em> the "
      "history was changed. Something else has to make it impossible to change it in the first "
      "place.</b> That something else is on the next page, and it is the last piece of the "
      "cryptography."),
    check("A hash chain does not stop you cheating. It guarantees that cheating leaves a scar that "
          "any holder of a copy can find."),
    ours("GreenToken's verifier does exactly this and nothing more: it walks from the genesis block "
         "forward, recomputing every hash, and reports the <em>first</em> block that disagrees. Then "
         "it restores by rebuilding the chain from the stored transactions."),
])

# ==========================================================================
# 6 — SIGNATURES
# ==========================================================================
d6 = []
d6.append(box(30, 40, 250, 110, "ink", 8))
d6.append(t(155, 74, "Block header", "t2", "middle"))
d6.append(t(155, 98, "prevHash · merkleRoot", "t3", "middle"))
d6.append(t(155, 120, "number · timestamp", "t3", "middle"))
d6.append(box(350, 40, 250, 110, "acc", 8))
d6.append(t(475, 74, "Orderer signs it", "t1", "middle"))
d6.append(t(475, 98, "ECDSA P-256", "t3", "middle"))
d6.append(t(475, 120, "private key never leaves", "t4", "middle"))
d6.append(path("M290 95 H340", "lnacc"))
d6.append(box(670, 40, 300, 110, "mut", 8))
d6.append(t(820, 74, "signature travels with it", "t2", "middle"))
d6.append(t(820, 98, "anyone can verify", "t3", "middle"))
d6.append(t(820, 120, "nobody can forge it", "t4", "middle"))
d6.append(path("M610 95 H660", "lnacc"))
d6.append(box(30, 185, 940, 120, "ink", 8))
d6.append(t(50, 212, "Now the attacker is stuck, and here is precisely why", "t2"))
for i, s in enumerate([
        "They can still recompute every hash — that was never the defence.",
        "But the new block header needs the orderer's signature over it.",
        "And the altered transaction needs each endorser's signature over it.",
        "Neither can be produced without the matching private keys."]):
    d6.append(t(56, 240 + i * 19, ("→ " if i else "") + s, "t3"))
d6.append(box(30, 330, 940, 90, "acc", 8))
d6.append(t(50, 358, "The division of labour", "t2"))
d6.append(t(56, 382, "Hashes  →  tell you WHERE the history was changed.", "t3c"))
d6.append(t(56, 404, "Signatures  →  make it IMPOSSIBLE to change the history unnoticed.", "t3c"))
page("p4", "4", "The signature", "Part 2 — the cryptography", [
    h2("The signature: making it unforgeable"),
    svg("".join(d6), h=440, label="A block header signed by the orderer, and why recomputing hashes is not enough"),
    q("An attacker can recompute every hash in the chain. What is the one thing they still cannot do?"),
    p("They cannot produce a <b>valid signature</b>. A digital signature is made with a private key "
      "and checked with a public key. The private key never leaves the machine that holds it, so "
      "somebody else can check the signature but nobody else can create one. In GreenToken the "
      "ordering service signs each block header, and each reviewer signs the endorsement they give."),
    p("This is the point where the two halves of the design snap together. <b>The hash chain is what "
      "makes a tamper localise itself; the signatures are what make a tamper impossible to hide.</b> "
      "Neither is sufficient alone. Remove the signatures and a clever operator rewrites history "
      "consistently. Remove the chain and a tamperer can rewrite one block without touching the "
      "others, and nobody can tell which blocks were affected."),
    check("Hashes tell you where history was changed. Signatures make it impossible to change history "
          "without being caught. You need both."),
    ours("Every block in GreenToken carries the orderer's ECDSA P-256 signature, and every endorsement "
         "carries the reviewer's. That is why the tamper test can say <em>which</em> field was "
         "altered and not merely that something was."),
])

# ==========================================================================
# 7 — MERKLE
# ==========================================================================
d7 = []
LEAF = [(140, 60), (300, 60), (460, 60), (620, 60)]
d7.append(t(140, 40, "tx0", "t3", "middle"))
d7.append(t(300, 40, "tx1", "t3", "middle"))
d7.append(t(460, 40, "tx2", "t3", "middle"))
d7.append(t(620, 40, "tx3", "t3", "middle"))
for x, y in LEAF:
    d7.append(box(x - 46, y, 92, 30, "acc", 5))
    d7.append(t(x, y + 20, "H(tx)", "t3c", "middle"))
d7.append(path("M140 90 L220 130 M300 90 L220 130 M300 90 L380 130 M460 90 L380 130 M460 90 L540 130 M620 90 L540 130"))
d7.append(box(175, 130, 90, 30, "acc", 5))
d7.append(box(335, 130, 90, 30, "acc", 5))
d7.append(box(495, 130, 90, 30, "acc", 5))
d7.append(t(220, 150, "H(H0|H1)", "t3c", "middle"))
d7.append(t(380, 150, "H(H2|H3)", "t3c", "middle"))
d7.append(t(540, 150, "…", "t3c", "middle"))
d7.append(path("M220 160 L300 200 M380 160 L300 200"))
d7.append(box(255, 200, 90, 30, "ink", 5))
d7.append(t(300, 220, "root", "t3c", "middle"))
d7.append(t(300, 258, "one value that commits to every transaction in the block", "t3", "middle"))
d7.append(box(700, 40, 270, 190, "acc", 8))
d7.append(t(835, 68, "The point", "t2", "middle"))
d7.append(wrap(720, 96, "To prove tx2 is in the block, you hand over tx3 and the root. The verifier "
                         "recomputes two hashes instead of shipping the whole block.", "t4", 34, 15))
d7.append(wrap(720, 170, "Proof size grows with the log of the block size, not with the block size "
                          "itself.", "t4", 34, 15))
d7.append(box(30, 280, 940, 96, "ink", 8))
d7.append(t(50, 308, "Without a Merkle root you would have two bad choices", "t2"))
d7.append(t(56, 334, "✕  Store every transaction separately, so every block needs its own hash per transaction — the header becomes huge.", "t3w"))
d7.append(t(56, 358, "✕  Hash the whole block as one blob, so to check one transaction you need the whole block — no proof at all.", "t3w"))
page("p5", "5", "The Merkle tree", "Part 2 — the cryptography", [
    h2("The Merkle tree: proving one thing inside a big set"),
    svg("".join(d7), h=400, label="A Merkle tree collapsing transaction fingerprints to a single root"),
    q("If a block header holds only one value, how does that single value let someone check that "
      "one particular transaction is inside the block?"),
    p("By building a <b>Merkle tree</b>: hash the transactions in pairs, hash those results in pairs, "
      "and keep going until one value is left. That single value — the root — commits to every "
      "transaction in the block, because changing any transaction changes its leaf, which changes "
      "every hash above it, which changes the root."),
    p("The payoff is that a proof is small. To show that tx2 is in the block, you supply tx3 and the "
      "root, and the verifier recomputes two hashes. You never have to hand over the whole block, "
      "which matters when the block is large and the counterparty is a stranger."),
    check("A Merkle root is a fingerprint of a fingerprint of a fingerprint — and it lets you prove "
          "one small thing without showing the whole big thing."),
    ours("Each GreenToken block stores a Merkle root over its transaction hashes, and the "
         "Ledger Explorer lets you open any block and see exactly which transactions it contains and "
         "what signed them."),
])

# ==========================================================================
# 8 — THE PARTS
# ==========================================================================
d8 = []
CARDS = [
    ("MSP", "passport office", "one organisation's identity directory: who holds which certificate, and what they may do"),
    ("Channel", "private meeting room", "one shared ledger plus its ordering service, and the rules that govern them"),
    ("Peer", "the office that keeps the record", "holds the block history and the current values, runs the chaincode, signs approvals"),
    ("Orderer", "the postman", "puts transactions in order and posts the blocks. Never checks whether they are correct"),
    ("Chaincode", "the rulebook", "the business logic. Must give the same answer every time it is asked"),
    ("Gateway", "the front desk", "one door for the client to submit, query, wait for commit and listen for events"),
]
for i, (name, analogy, desc) in enumerate(CARDS):
    x = 25 + (i % 3) * 320
    y = 40 + (i // 3) * 175
    d8.append(box(x, y, 300, 155, "ink", 9))
    d8.append(box(x, y, 300, 40, "acc", 9))
    d8.append(t(x + 150, y + 26, name, "t1c", "middle"))
    d8.append(t(x + 16, y + 66, analogy, "t2"))
    d8.append(wrap(x + 16, y + 92, desc, "t4", 42, 14))
page("p6", "6", "The parts, and what breaks without each", "Part 3 — the machinery", [
    h2("The parts, and what breaks without each"),
    svg("".join(d8), h=400, label="The six Fabric components with a plain-language analogy for each"),
    q("With the cryptography understood, the vocabulary finally makes sense. What is each part "
      "actually for?"),
    p("Here is the whole of Hyperledger Fabric in six cards. The left column is the official name; "
      "the middle column is what it is like; the right column is what it does. If you remember only "
      "one thing about each, remember the analogy — the official name is just the label the "
      "engineers agreed on."),
    p("Two of these deserve a sentence each. The <b>orderer</b> is the one everybody mis-frames: it "
      "is not a judge and not a validator, it is a postman. It decides <em>sequence</em>, never "
      "<em>meaning</em>. And the <b>channel</b> is simultaneously the unit of privacy and the unit of "
      "governance, because a channel configuration transaction itself records who is a member and "
      "which endorsement rules apply."),
    check("MSP is passports, channel is the room, peer is the office, orderer is the postman, "
          "chaincode is the rulebook, gateway is the front desk."),
    ours("GreenToken uses all six. Four organisations, each with its own MSP, share one channel; "
         "each runs a peer; one ordering service, the Consortium Ordering Service, sequences the "
         "blocks; the chaincode is the ten-function contract; and the Gateway is what the React "
         "front end talks to."),
])

# ==========================================================================
# 9 — LIFECYCLE
# ==========================================================================
d9 = []
STEPS = [
    ("1", "Proposal", "the client asks", "a function and its arguments"),
    ("2", "Endorsement", "peers run the code", "each returns a signed read+write set"),
    ("3", "Ordering", "the postman sequences", "endorsed transactions into a block"),
    ("4", "Validation", "every peer checks", "enough signatures? read set still current?"),
    ("5", "Commit", "peers append", "history is now permanent"),
    ("6", "Notification", "the client is told", "events and commit status"),
]
for i, (n, name, who, what) in enumerate(STEPS):
    x = 25 + i * 162
    d9.append(box(x, 50, 145, 150, "acc" if i in (1, 3) else "ink", 8))
    d9.append(t(x + 72, 78, n + ".  " + name, "t1", "middle"))
    d9.append(t(x + 12, 106, who, "t3", "start"))
    d9.append(wrap(x + 12, 130, what, "t4", 22, 13))
    if i < 5:
        d9.append(path("M" + str(x + 146) + " 125 H" + str(x + 158)))
d9.append(box(25, 225, 950, 80, "warn", 9))
d9.append(t(45, 252, "The bit that surprises everyone", "t2"))
d9.append(wrap(45, 276, "The code runs at step 2, not step 5. By the time a transaction is committed, "
                         "the business logic has already executed and the peers are only checking that "
                         "the right people agreed and that nothing changed underneath.", "t4", 128, 15))
d9.append(box(25, 325, 950, 70, "ink", 9))
d9.append(t(45, 350, "And that is exactly why chaincode must be deterministic", "t2"))
d9.append(wrap(45, 374, "If two peers could run the same code and get different answers, the network "
                         "would have two truths and no way to choose between them.", "t4", 128, 15))
page("p7", "7", "The journey of one transaction", "Part 3 — the machinery", [
    h2("The journey of one transaction"),
    svg("".join(d9), h=410, label="The six phases of a Fabric transaction from proposal to notification"),
    q("A client wants to change something on the shared ledger. What actually happens, and in what "
      "order?"),
    p("Six phases, and each one happens on a different component. The client proposes. Peers run the "
      "chaincode and sign what they would write. The ordering service sequences those signed results "
      "into a block. Every peer then independently validates that block. Peers that accept it append it "
      "and update their copy of the state. Finally the client is told what happened."),
    p("But look again at where the code runs: at step <b>2</b>. That is the structural reason for "
      "every strange restriction you will meet in Fabric chaincode — no clock, no randomness, no "
      "network calls. If two peers could run the same code and reach different answers, the network "
      "would have two truths and no way to choose between them. Determinism is not pedantry; it is "
      "the load-bearing wall."),
    check("Six phases, and the code runs at phase two. That is why chaincode cannot read the clock."),
    ours("A GreenToken endorsement travels exactly this path: the Forest Department proposes, the "
         "Forest Department and the Auditor both endorse, the orderer sequences, every peer "
         "validates, the peers commit, and the event reaches the dashboard's live event panel."),
])

# ==========================================================================
# 10 — ENDORSEMENT & QUORUM
# ==========================================================================
d10 = []
d10.append(box(30, 40, 240, 120, "ink", 8))
d10.append(t(150, 72, "Proposal", "t2", "middle"))
d10.append(t(150, 96, "VerifyPlanting", "t3", "middle"))
d10.append(t(150, 122, "sent to two peers", "t4", "middle"))
d10.append(box(340, 30, 260, 84, "acc", 8))
d10.append(t(470, 58, "Peer A — Forest Dept", "t2", "middle"))
d10.append(t(470, 80, "read set · write set · signature", "t3", "middle"))
d10.append(box(340, 130, 260, 84, "acc", 8))
d10.append(t(470, 158, "Peer B — Auditor", "t2", "middle"))
d10.append(t(470, 180, "read set · write set · signature", "t3", "middle"))
d10.append(path("M280 90 H330 V72 H334"))
d10.append(path("M280 90 H330 V172 H334"))
d10.append(box(670, 60, 300, 100, "mut", 8))
d10.append(t(820, 88, "Two different organisations", "t2", "middle"))
d10.append(t(820, 112, "two different MSP ids", "t3", "middle"))
d10.append(t(820, 136, "two different signatures", "t3", "middle"))
d10.append(path("M610 72 H640 V100 H664"))
d10.append(path("M610 172 H640 V120 H664"))
d10.append(box(30, 240, 460, 150, "acc", 8))
d10.append(t(50, 266, "Why two, and why two different ones", "t2"))
d10.append(wrap(50, 292, "One approver IS the trust problem. If one organisation can approve by "
                          "itself, you have simply moved the trust from the database owner to the "
                          "approver.", "t4", 58, 15))
d10.append(wrap(50, 338, "So the quorum is two, and the two must come from two different MSPs — "
                          "and no person may review the same item twice.", "t4", 58, 15))
d10.append(box(520, 240, 450, 150, "warn", 8))
d10.append(t(540, 266, "The policy answers who. The contract answers how.", "t2"))
d10.append(wrap(540, 292, "Fabric's endorsement policy is configuration: AND('ForestDeptMSP',"
                           "'AuditorMSP') — these organisations must sign.", "t4", 58, 15))
d10.append(wrap(540, 340, "The contract adds what a policy cannot express: that the two must be "
                           "distinct, and that a participant may not repeat.", "t4", 58, 15))
page("p8", "8", "Endorsement, quorum and determinism", "Part 3 — the machinery", [
    h2("Endorsement, quorum and determinism"),
    svg("".join(d10), h=410, label="A proposal endorsed by two peers in two different organisations"),
    q("Why does a transaction need two approvals, and why must those two approvals come from "
      "different organisations?"),
    p("Because one approval <em>is</em> the trust problem. If a single organisation can approve on "
      "its own, then you have not removed trust from the system — you have only moved it from the "
      "database owner to the approver. The quorum of two, drawn from two distinct member "
      "identities, is what makes the approval independent rather than merely signed."),
    p("Notice the division of labour in the configuration. Fabric's <b>endorsement policy</b> is "
      "channel configuration and answers <em>which organisations</em> must sign. It cannot express "
      "\\u201ctwo, and not the same person twice\\u201d — so those rules live in the chaincode, where "
      "they can be tested."),
    p("And there is one more rule that people forget: the endorsers must be able to <em>agree</em>. "
      "That is the determinism requirement again, arriving for the third time — every peer that "
      "evaluates the same proposal must produce the same answer, or there is no transaction to commit."),
    check("Two signatures, from two different organisations, computed identically by both peers. "
          "The policy says who; the contract says how many and who may not repeat."),
    ours("GreenToken requires exactly this: REQUIRED_ENDORSEMENTS = 2, two distinct MSP identifiers, "
         "one review per participant, and rejection is terminal. A planter cannot get a token minted "
         "alone, however many times they ask."),
])

# ==========================================================================
# 11 — PRIVACY
# ==========================================================================
d11 = []
d11.append(box(30, 40, 430, 150, "ink", 9))
d11.append(t(50, 66, "Fabric's answer: private data collections", "t2"))
d11.append(wrap(50, 94, "The value is distributed to the members of the collection. Every other "
                         "participant sees only its hash — which is still on-chain, so nobody can "
                         "quietly change it afterwards.", "t4", 54, 15))
d11.append(wrap(50, 166, "Fabric v2.5 can go further: PurgePrivateData deletes the value and its "
                         "history while keeping the hash as evidence.", "t4", 54, 15))
d11.append(box(530, 40, 440, 150, "acc", 9))
d11.append(t(550, 66, "GreenToken's answer: never write it at all", "t2"))
d11.append(wrap(550, 94, "The planter's contact number is stripped at the chaincode boundary — "
                         "before it is hashed, before it is stored, before it is emitted.", "t4", 54, 15))
d11.append(wrap(550, 166, "The TreeToken type has no field for it, so it cannot leak: there is "
                          "nothing in the database to leak.", "t4", 54, 15))
d11.append(box(30, 220, 940, 90, "warn", 9))
d11.append(t(50, 246, "Which is better?", "t2"))
d11.append(wrap(50, 272, "For this one field, GreenToken's is stronger: there is no value anywhere "
                         "in the system to disclose. But it is a different mechanism, and if a buyer "
                         "needed the number itself, a real private data collection would be required.",
                         "t4", 128, 15))
d11.append(box(30, 330, 940, 70, "ink", 9))
d11.append(t(50, 356, "And note what is deliberately NOT private", "t2"))
d11.append(wrap(50, 382, "Reads are open. Anyone may look up any token. That is a feature: a carbon "
                         "registry has to be checkable by the buyers and by the public. Only writes "
                         "are role-gated.", "t4", 128, 15))
page("p9", "9", "Privacy, and the choice not to use it", "Part 3 — the machinery", [
    h2("Privacy, and the choice not to use it"),
    svg("".join(d11), h=420, label="Two approaches to keeping a field confidential: distribute it, or never write it"),
    q("A planter's phone number must not be visible to the other three organisations. What are the "
      "options?"),
    p("Fabric's native answer is the <b>private data collection</b>: the value is distributed to the "
      "authorised members, and everyone else sees only its hash. The hash is still on-chain, so the "
      "members can still prove the value was never altered — which is the useful half of "
      "confidentiality that people often forget to want."),
    p("GreenToken makes a different choice for one particular field: it <b>never writes the value at "
      "all</b>. The contact number is stripped at the boundary before anything is hashed or stored. "
      "That is a stronger guarantee for that field — there is nothing to disclose — but it is a "
      "different mechanism, and anyone examining the project should hear it described that way rather "
      "than as \\u201ca private data collection\\u201d."),
    p("The last box is the one that trips people up. Fabric does <em>not</em> make everything "
      "private. In GreenToken every read is open to every member. That is deliberate: the value of a "
      "carbon registry is that a buyer can check it without asking permission."),
    check("Privacy here means one field, handled by never writing it. Everything else is public on "
          "purpose, because verification is the point."),
    ours("privateContact is accepted by the contract for the interface's benefit and then dropped. "
         "The proof is in the type: TreeToken has no contact field at all."),
])

# ==========================================================================
# 12 — OUR PROJECT
# ==========================================================================
d12 = []
d12.append(box(30, 34, 940, 74, "acc", 10))
d12.append(t(500, 62, "Everything so far, in one picture", "t1", "middle"))
d12.append(t(500, 86, "the four parties, the one channel, the two endorsements, the one invoice", "t3", "middle"))
FLOW = [
    ("Plan", "Lakshmi plants 40 neem trees", "photo bytes → SHA-256, geo → SHA-256", "PLANTER"),
    ("Verify", "Forest Dept signs", "endorsement 1 of 2", "VERIFIER"),
    ("Verify", "Auditor signs", "endorsement 2 of 2, two different orgs", "AUDITOR"),
    ("Mint", "token becomes VERIFIED", "now it can be bought", "—"),
    ("Fund", "funder picks a basket", "discount ladder applied by the contract", "FUNDER"),
    ("Settle", "one invoice, one net amount", "Rs 15,525 across 3 invoices", "FUNDER / AUDITOR"),
]
for i, (step, what, detail, who) in enumerate(FLOW):
    x = 30 + (i % 3) * 315
    y = 126 + (i // 3) * 128
    d12.append(box(x, y, 295, 108, "ink", 9))
    d12.append(box(x, y, 62, 26, "acc", 9))
    d12.append(t(x + 31, y + 18, step, "t3c", "middle"))
    d12.append(t(x + 74, y + 18, who, "t4", "start"))
    d12.append(wrap(x + 14, y + 50, what, "t2", 38, 16))
    d12.append(wrap(x + 14, y + 84, detail, "t4", 42, 13))
    if i % 3 < 2:
        d12.append(path("M" + str(x + 297) + " 60 H" + str(x + 313)))
page("p10", "10", "Now put it all together: our project", "Part 4 — our project", [
    h2("Now put it all together: our project"),
    svg("".join(d12), h=400, label="The complete GreenToken workflow from planting to settlement"),
    q("Every idea so far, applied to the problem from page 3. Where does each one land?"),
    p("The fingerprint becomes the photo and geo digests. The chain becomes the block history. The "
      "signatures become the orderer's block signatures and the reviewers' endorsements. The quorum "
      "becomes the two-organisation rule. The role-gated writes become the four MSPs. The contract "
      "becomes the ten functions that hold the price, the discount ladder, the duplicate-photo guard "
      "and the terminal rejection."),
    p("The running system holds 29 blocks and 9 tokens covering 170 trees and 4.7 tonnes of modelled "
      "sequestration, and Rs 15,525 net disbursed across three invoices. But the number worth "
      "remembering is the last one on the demo: <b>the tamper test</b>. Change a signed payload and "
      "the verifier recomputes the whole chain from genesis and names the block and the field. That "
      "is pages 3 and 4 — the chain and the signature — running live, in front of an examiner."),
    check("A token is a photograph and a coordinate, reduced to two fingerprints, signed twice by two "
          "different organisations, and recorded in a chain nobody can rewrite."),
    ours("This is the whole project in one sentence. The rest of Part 4 is detail — but detail you can "
         "now build, because you know why each piece exists."),
])

# ==========================================================================
# 13 — ADVANCED
# ==========================================================================
ADV = [
    ("Fabric Gateway (v2.5)", "One service for Evaluate, Endorse, Submit, commit status and events \u2014 so the client stops discovering peers itself."),
    ("Ledger snapshots", "A new peer joins from a snapshot of the state instead of replaying every block from the beginning."),
    ("PurgePrivateData", "Deletes a private value and its history while keeping the on-chain hash as evidence. Needs V2_5."),
    ("Chaincode as a service", "The contract runs as an external server the peers call, rather than being installed on every peer."),
    ("Raft and BFT orderers", "Raft tolerates a node crashing; BFT tolerates nodes actively trying to disrupt the ordering."),
    ("State-based endorsement", "A different endorsement policy attached to one key in the state, not to the whole contract."),
    ("Channel configuration", "Membership, policies and orderer settings are themselves transactions, agreed by the members."),
    ("Identity revocation and ACLs", "Certificates can be revoked, and ACLs say which peer may host which chaincode."),
]
_cards = []
for _k, _v in ADV:
    _cards.append('<div class="advcard"><b>' + _k + "</b><span>" + _v + "</span></div>")
page("p11", "11", "The advanced shelf", "Part 5 \u2014 beyond", [
    h2("The advanced shelf: what you meet next"),
    '<div class="advgrid">' + "".join(_cards) + "</div>",
    q("You now have the foundations. What is on the shelf for someone who keeps going?"),
    p("The Gateway is the one to learn first, because it is what changed most recently and it "
      "simplifies the client. The snapshots and PurgePrivateData are v2.5 features that solve real "
      "operational problems — the first about joining a large network, the second about data you "
      "must eventually be able to erase."),
    p("The orderer modes are worth understanding as a pair: Raft is the pragmatic choice "
      "for a consortium that trusts its own members not to sabotage the ordering service, and "
      "BFT is the choice when they do not. The last two show Fabric is a real operating system "
      "rather than a demonstration: membership is not a constant but a transaction the members "
      "agree, and a certificate can be revoked \u2014 which is how a consortium handles a member "
      "leaving, something a blockchain that assumes a fixed set of participants cannot do."),
    check("The foundations never change. What changes is the machinery around them, and every piece "
          "of machinery exists to solve an operational problem you can now name."),
    ours("GreenToken is a v2.5 chaincode project: fabric-contract-api 2.5.8, deployed by a script "
         "that packages, installs and approves the definition for all four organisations, with the "
         "channel, the MSPs and the endorsement rules all declared in configuration."),
])

# ==========================================================================
# 14 — BOUNDARIES
# ==========================================================================
page("p12", "12", "Where the edges are", "Part 5 — beyond", [
    h2("Where the edges are"),
    '<div class="two">',
    '<div class="col">',
    h3("Real, and running now"),
    ul([
        "SHA-256 digests of photo bytes and geo payloads",
        "ECDSA P-256 endorsements and block signatures",
        "Merkle roots over transaction hashes",
        "A real hash-linked, signed block chain",
        "All eight business rules, enforced in the contract",
        "Real Fabric v2.5 chaincode, compiled and packaged",
        "A deployed REST + event-stream API",
        "A tamper test that localises the break",
    ]),
    "</div>",
    '<div class="col">',
    h3("Emulated, or deliberately scoped out"),
    ul([
        "The demo host is a Durable Object, not a Fabric peer",
        "Private data is stripped, not distributed in a collection",
        "Keys are derived from participant ids, not CA-issued",
        "Settlement marks an invoice settled; no money moves",
        "GPS accuracy is shown to reviewers, not thresholded",
        "On-chain governance is future work",
    ]),
    "</div>",
    "</div>",
    h3("The one sentence that earns the most marks"),
    p("\\u201cThe business logic is real and the cryptography is real; what I simulated is the network "
      "layer, and the identical contract deploys to a genuine Fabric peer with "
      "<span class=\"mono\">network/deploy.sh</span>.\\u201d"),
    h3("What to read next"),
    ul([
        "<b>The Fabric v2.5 documentation</b> — concepts, then the chaincode page, then the Gateway page.",
        "<b>Shah, <em>Blockchain Technology with Hyperledger Fabric</em></b> — the course text; "
        "read the architecture chapter alongside this document.",
        "<b>Our own study guide and diagram pack</b> — the 30-page text and the 13 full-page "
        "diagrams, which are the reference version of everything in Parts 2 and 3.",
        "<b>The contract itself</b> — <span class=\"mono\">src/core/chaincode.ts</span> is about 800 "
        "lines, and it is the best possible summary of Parts 2 and 3, because it is where they meet.",
    ]),
    check("Knowing where your own work stops is not a weakness in the work. It is the difference "
          "between a system and a demonstration, and it is the first thing an examiner will check."),
])

# ==========================================================================
# 15 — SUMMARY
# ==========================================================================
SUMMARY = [
    ("The problem", "Four parties, four private notebooks, no shared truth. The fix must be shared, "
                    "append-only, independently checkable and attributable."),
    ("The fingerprint", "SHA-256 commits to a piece of data without hiding it. One-way, deterministic, "
                        "collision-resistant."),
    ("The chain", "Each block carries the previous block's fingerprint, so an alteration cascades. "
                   "This makes tampering detectable, not impossible."),
    ("The signature", "The orderer and the endorsers sign. You can recompute every hash; you cannot "
                      "forge a signature. This makes tampering impossible to hide."),
    ("The Merkle tree", "One root that commits to every transaction in a block, and a proof of one "
                        "transaction that is logarithmic in size."),
    ("The parts", "MSP, channel, peer, orderer, chaincode, gateway. Each exists because something "
                  "breaks without it."),
    ("The lifecycle", "Proposal, endorsement, ordering, validation, commit, notification. The code "
                      "runs at phase two."),
    ("The rules", "Two signatures from two different organisations, determinism, and the choice to "
                  "make reads public and writes role-gated."),
    ("Our project", "Two fingerprints, two signatures from two organisations, one chain nobody can "
                    "rewrite, one invoice — and a tamper test you can watch."),
]
_sum = []
for _k, _v in SUMMARY:
    _sum.append('<div class="sum"><b>' + _k + "</b><span>" + _v + "</span></div>")
page("p13", "13", "The whole thing on one page", "Part 5 — beyond", [
    h2("The whole thing on one page"),
    '<div class="sumgrid">' + "".join(_sum) + "</div>",
    q("If you remember nothing else, what should survive?"),
    p("Nine sentences. Each one is checkable against the code, and each one you should be able to "
      "say out loud without notes. If any of them will not come out, go back to the page that "
      "introduced it — that is the entire method."),
    check("Understand it, rebuild it, then say it simply. That is the whole trick, and it works for "
          "smart contracts exactly as it works for physics."),
    ours("GreenToken, in one breath: a planter photographs trees and signs their coordinates; two "
         "independent organisations check the proof and sign it; the contract fixes the price and "
         "the discount; a funder buys a basket and one invoice settles it; and every record sits in "
         "a chain that would announce, loudly and precisely, if anybody ever touched it."),
])


# ==========================================================================
# CSS + assembly
# ==========================================================================
CSS = """
@page { size: A4 portrait; margin: 17mm 16mm 16mm 16mm; }
* { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

:root {
  --paper: #FFFFFF;
  --tint: #F4F8F5;
  --tint2: #E9F4ED;
  --line: #DCE8E0;
  --ink: #12211A;
  --dim: #48654F;
  --faint: #75897D;
  --accent: #1E8E4E;
  --deep: #14663A;
  --warn: #96650C;
  --danger: #C0392B;
  --sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --mono: ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
}

html, body { margin: 0; padding: 0; }
body {
  font-family: var(--sans); font-size: 10.4pt; line-height: 1.52;
  color: var(--ink); background: var(--paper);
  -webkit-font-smoothing: antialiased;
}

@media screen {
  html { background: #d3d3d3; }
  body { padding: 18px 0; }
  body > section { width: 210mm; min-height: 297mm; margin: 0 auto 18px; background: #fff;
                   box-shadow: 0 4px 24px rgba(0,0,0,.18); padding: 17mm 16mm; overflow: hidden; }
}

.page { break-after: page; }
.page:last-child { break-after: auto; }
.cover { break-after: page; }

h2 { font-size: 17pt; margin: 0 0 2.5mm; letter-spacing: -0.5pt; font-weight: 700; }
h3 { font-size: 11pt; margin: 4mm 0 1.6mm; color: var(--deep); font-weight: 700; }
p { margin: 0 0 2.8mm; }
p.lead { font-size: 11pt; color: var(--dim); line-height: 1.55; margin-bottom: 4mm; }
em { font-style: italic; }
strong, b { font-weight: 700; }
.mono { font-family: var(--mono); font-size: 0.92em; }
ul, ol { margin: 0 0 3mm; padding-left: 5mm; }
li { margin-bottom: 1.6mm; }

.dg { width: 100%; height: auto; display: block; margin: 2mm 0 3mm; }
.dg .bx { stroke-width: 1.4; }
.bx--ink { fill: #FFFFFF; stroke: #B9D2C4; }
.bx--acc { fill: var(--tint2); stroke: var(--accent); }
.bx--mut { fill: var(--tint); stroke: var(--line); }
.bx--warn { fill: #FDF6E8; stroke: #D8A64B; }
.bx--bad { fill: #FDECEA; stroke: #C0392B; }
.dg .ln { stroke: #5E7D68; stroke-width: 1.6; fill: none; }
.dg .lnacc { stroke: #1E8E4E; stroke-width: 1.9; fill: none; }
.dg text { font-family: var(--sans); }
.t1 { font-size: 15px; font-weight: 700; fill: var(--ink); }
.t2 { font-size: 13px; font-weight: 600; fill: var(--ink); }
.t3 { font-size: 12px; fill: var(--dim); }
.t3c { font-size: 12px; fill: #1B4A2E; }
.t3w { font-size: 12px; fill: #A15C08; }
.t4 { font-size: 11px; fill: var(--faint); }

.q {
  border-left: 3px solid var(--accent); background: var(--tint);
  padding: 3mm 4mm; border-radius: 0 2mm 2mm 0; margin: 0 0 3mm;
}
.q__k { display: block; font-size: 7.4pt; font-weight: 800; letter-spacing: 1.4pt;
         text-transform: uppercase; color: var(--accent); margin-bottom: 1.2mm; }
.q p { margin: 0; font-size: 10.6pt; }

.check {
  border-left: 3px solid #B7D9C3; background: #FAFDFB;
  padding: 3mm 4mm; border-radius: 0 2mm 2mm 0; margin: 3mm 0;
}
.check__k { display: block; font-size: 7.4pt; font-weight: 800; letter-spacing: 1.4pt;
            text-transform: uppercase; color: var(--deep); margin-bottom: 1.2mm; }
.check p { margin: 0; font-size: 10.2pt; color: #22402F; }

.ours {
  border-left: 3px solid #D8A64B; background: #FDF9F1;
  padding: 3mm 4mm; border-radius: 0 2mm 2mm 0; margin: 3mm 0 0;
}
.ours__k { display: block; font-size: 7.4pt; font-weight: 800; letter-spacing: 1.4pt;
            text-transform: uppercase; color: #A15C08; margin-bottom: 1.2mm; }
.ours p { margin: 0; font-size: 10.2pt; color: #5A4A2C; }

.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; margin: 3mm 0; }
.mini { border: 1px solid var(--line); border-radius: 2mm; padding: 3.4mm; background: var(--tint); }
.mini h3 { margin: 0 0 1.6mm; }
.mini ol, .mini ul { margin: 0; }
.mini li { font-size: 9.8pt; }

.two { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; margin: 3mm 0; }
.two .col { min-width: 0; }

.path { border: 1px solid var(--line); border-radius: 2mm; padding: 3mm 3.4mm; background: #FAFDFB; margin: 3mm 0; }
.path__k { display: block; font-size: 7.4pt; font-weight: 800; letter-spacing: 1.4pt;
           text-transform: uppercase; color: var(--faint); margin-bottom: 2mm; }
.path__row { display: flex; align-items: center; justify-content: space-between; }
.path__s { font-size: 10pt; font-weight: 700; color: var(--deep); text-align: center; line-height: 1.3; }
.path__s i { font-weight: 400; font-style: normal; font-size: 8.4pt; color: var(--faint); }
.path__a { color: var(--accent); font-size: 12pt; }

table { width: 100%; border-collapse: collapse; font-size: 9.6pt; margin: 2mm 0 3mm; }
table.tight { font-size: 9pt; }
table.adv td { padding: 2.2mm 2.6mm; border-bottom: 0.5pt solid var(--line); vertical-align: top; line-height: 1.4; }
table.adv td:first-child { width: 38mm; font-weight: 700; color: var(--deep); }
thead { display: table-header-group; }
th { text-align: left; padding: 2mm 2.6mm; font-size: 7.6pt; text-transform: uppercase;
     letter-spacing: 0.9pt; color: #fff; background: #12211A; font-weight: 700; }
td { padding: 2mm 2.6mm; border-bottom: 0.5pt solid var(--line); vertical-align: top; }
tbody tr:nth-child(even) td { background: #FAFCFA; }

.advgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 2.6mm; margin: 2mm 0 3mm; }
.advcard { border: 1px solid var(--line); border-left: 2.5pt solid var(--accent); border-radius: 0 2mm 2mm 0;
           padding: 2.4mm 3mm; background: var(--tint); break-inside: avoid; }
.advcard b { display: block; font-size: 9.8pt; color: var(--deep); margin-bottom: 0.8mm; }
.advcard span { display: block; font-size: 8.9pt; color: var(--dim); line-height: 1.4; }

.toc { margin: 1mm 0 2mm; }
.tocrow { display: flex; align-items: baseline; gap: 2.4mm; padding: 0.7mm 0;
          border-bottom: 0.5pt dotted #E4EDE7; font-size: 9.4pt; }
.tocn { flex: 0 0 6mm; font-weight: 700; color: var(--accent); font-variant-numeric: tabular-nums; }
.toct { flex: 1; color: var(--ink); }
.tocp { color: var(--faint); font-size: 8.4pt; }

.pgnum {
  font-size: 7.6pt; font-weight: 800; letter-spacing: 1.6pt; text-transform: uppercase;
  color: var(--accent); margin-bottom: 1.6mm;
}

.sumgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm 7mm; margin: 3mm 0 4mm; }
.sum { border-left: 2.5pt solid var(--accent); padding: 0 0 0 3.2mm; break-inside: avoid; }
.sum b { display: block; font-size: 10pt; color: var(--deep); margin-bottom: 0.9mm; }
.sum span { display: block; font-size: 9.2pt; color: var(--dim); line-height: 1.44; }

pre.code { font-family: var(--mono); font-size: 8.6pt; background: var(--tint);
            border-left: 2.5pt solid var(--accent); padding: 2.4mm 3.2mm; margin: 2mm 0 3mm; }

/* cover */
.cover-art { margin-bottom: 7mm; }
.cover-title { font-size: 30pt; line-height: 1.1; margin: 0 0 6mm; font-weight: 700; letter-spacing: -1pt; }
.cvacc { color: var(--accent); }
.cover-sub { font-size: 11.6pt; line-height: 1.52; color: var(--dim); max-width: 165mm; margin: 0 0 9mm; }
.cover-meta { border-top: 1pt solid var(--line); padding-top: 4mm; }
.cover-meta div { display: flex; gap: 5mm; padding: 1.8mm 0; border-bottom: 0.5pt solid var(--line); }
.cover-meta span { flex: 0 0 26mm; font-size: 7.6pt; text-transform: uppercase; letter-spacing: 1.2pt;
                   color: var(--faint); font-weight: 700; padding-top: 0.6mm; }
.cover-meta strong { font-weight: 600; font-size: 10pt; }
.cover-foot { margin-top: 8mm; font-size: 10.4pt; color: var(--accent); font-style: italic; }
"""

parts = [
    "<!DOCTYPE html>", '<html lang="en">', "<head>",
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    "<title>Hyperledger Fabric, taught from first principles</title>",
    "<style>" + CSS + "</style>", "</head>", "<body>",
]
for pg in PAGES:
    parts.append('<section class="page' + (' cover' if pg["id"] == "cover" else '') + '" id="' + pg["id"] + '">')
    if pg["id"] != "cover":
        if pg["subtitle"]:
            parts.append('<div class="pgnum">' + pg["subtitle"] + "</div>")
    parts.append(pg["body"])
    parts.append("</section>")
parts.append("</body></html>")

html = "\n".join(parts)
OUT_HTML.write_text(html, encoding="utf-8")
print("wrote " + str(OUT_HTML) + " (" + str(len(html)) + " bytes, " + str(len(PAGES)) + " pages)")
