"""make-cards.py — build the presenter one-pager and the demo card as HTML, then
print them to PDF with headless Chrome.

Usage:  python -I scripts/make-cards.py
"""
import os, subprocess, textwrap

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'output')
HTML = os.path.join(ROOT, 'build', 'cards')
CHROME = r'C:\Program Files\Google\Chrome\Application\chrome.exe'

CSS = """
@page { size: A4 landscape; margin: 8mm; }
* { box-sizing: border-box; }
body { margin:0; font-family: Arial, Helvetica, sans-serif; color:#14201A; font-size:6.7pt; line-height:1.2; }
.wrap { display:table; width:100%; table-layout:fixed; }
.col { display:table-cell; width:33.33%; vertical-align:top; padding:0 3mm; }
.col:first-child { padding-left:0; }
.col:last-child { padding-right:0; border-left:0.6pt solid #D9E0DA; }
h1 { font-size:13pt; margin:0 0 0.8mm 0; letter-spacing:-0.2pt; }
.sub { font-size:6.6pt; color:#5C6B63; margin:0 0 1.6mm 0; }
h2 { font-size:6.7pt; text-transform:uppercase; letter-spacing:0.8pt; color:#2E7D4F;
     margin:0 0 1mm 0; padding-bottom:0.7mm; border-bottom:0.8pt solid #2E7D4F; }
h3 { font-size:6.7pt; text-transform:uppercase; letter-spacing:0.6pt; color:#C8553D;
     margin:2.2mm 0 1mm 0; }
table { width:100%; border-collapse:collapse; }
td, th { padding:0.65mm 1.2mm; vertical-align:top; border-bottom:0.4pt solid #E4EAE5; }
th { background:#1F3D2B; color:#FFFFFF; font-size:6pt; text-transform:uppercase; letter-spacing:0.4pt; }
td.n { font-family:Consolas,'Courier New',monospace; color:#2E7D4F; font-weight:bold; width:4.5mm; }
td.t { font-family:Consolas,'Courier New',monospace; font-size:6.4pt; width:8mm; }
tr.star td.n { color:#C8553D; }
.say { font-style:italic; color:#14201A; }
.note { color:#5C6B63; }
.num { font-family:Consolas,'Courier New',monospace; background:#F2F5F2; border:0.4pt solid #D9E0DA;
       padding:1.4mm 1.8mm; font-size:7.4pt; color:#1F3D2B; }
.call { background:#1F3D2B; color:#FFFFFF; padding:1.3mm 1.8mm; font-size:6.6pt; margin:0 0 1.4mm 0; }
.call b { color:#9FD9B4; }
.q { margin:0 0 1.4mm 0; }
.q b { color:#1F3D2B; }
.foot { margin-top:2mm; padding-top:1mm; border-top:0.4pt solid #D9E0DA;
        font-size:6pt; color:#5C6B63; }
"""

TALK = [
    (1, '15', 'Title', 'Every how-to needs proof. Today I am going to show you a how-to that proves itself.'),
    (2, '40', 'The video', 'In September, Open Planet released a documentary called How to Live on Earth, narrated by Benedict Cumberbatch. Its argument is that the answers already exist. Let me play the first two minutes.'),
    (3, '55', 'Who is doing this', 'Here is the uncomfortable part of that film. The solutions exist — but thirty-two companies are responsible for half the world\u2019s carbon dioxide. Thirty-two. That is good news: a rule for thirty-two companies can be checked.'),
    (4, '40', 'The escape hatch', 'A carbon credit is one tonne that somebody else removed from the atmosphere, sold to you so that your number goes down. Look at the scale of the market that now runs on this.'),
    (5, '70', 'The law arrives', 'So the law caught up. Four layers of it, and every one of them says the same thing — prove it. Paris Article 6. India\u2019s CCTS 2023. EU CBAM. CSRD and ESRS E1. Look very carefully at that red line: none of them says who checks.'),
    (6, '70', 'The receipts', 'So I went and checked. Cambridge and Amsterdam looked at eighteen flagship forest projects. Eighty-nine million credits were in play. Five point four million were real. Six per cent.'),
    (7, '40', 'One photograph', 'Kariba is fifteen million tonnes of forest that nobody can point to. Here is the same failure at a size you can hold in your hand. One photograph. Two buyers. One tree.'),
    (8, '55', 'The three refusals', 'A carbon credit is a promise sold to strangers. A smart contract is a promise that keeps itself. Three refusals do that work.'),
    (9, '70', 'How it works', 'This is the flow. Eight steps, and every one of them is a rule in code, checked by somebody else. Watch step two — the oracle is the weak link, and I will come back to that.'),
    (10, '55', 'Where it applies', 'The same three refusals apply to every promise with a shape. Carbon credits need all three at once — which is exactly why this market broke first.'),
    (11, '70', 'Today vs GreenToken', 'So what changes when the promise is code. Six questions: who owns this, can it be sold twice, who verifies, the price, the audit trail, and a dispute.'),
    (12, '15', 'The proof', 'I am going to try two crimes. Sell the same tree twice. Then edit the ledger. And I want you to watch the system refuse.'),
    (13, '5', 'Close', 'Plant it. Prove it. Tokenise it. Every how-to needs proof — so let the code be the proof.'),
]

DEMO = [
    (1, 'Dashboard', 'Read the KPI tiles', 'Nine tokens. One hundred and seventy trees. Four point seven tonnes of CO\u2082. Five thousand five hundred and fifty rupees. None of it was typed in — all of it is computed from the ledger.', 1),
    (2, 'Discover', 'Open one token', 'A GPS coordinate, a photo hash, a district. This is a position on the ground, not a claim.', 0),
    (3, 'Invoice', 'Show the price line', 'The price and the discount ladder live in the contract, not in the interface.', 0),
    (4, 'Plant', 'Upload the prepared file', 'One photograph, one hash, one coordinate. The contact number is dropped before anything is hashed.', 1),
    (5, 'Plant again', 'Submit the SAME file', 'Now let me sell you the same tree twice. \u2192 the contract refuses: \u201cThis photo has already been submitted for token GT-000010.\u201d That is the failure mode from slide 11, refused by the code.', 1),
    (6, 'Verify', 'Approve as a second org', 'Two organisations, one review each, quorum of two. The planter cannot approve their own tree.', 1),
    (7, 'Fund + settle', 'Fund, then settle', 'Funding and settlement are contract transitions, not button presses.', 0),
    (8, 'Ledger Explorer', 'Tamper \u2192 red \u2192 Restore', 'Change one transaction and the fingerprint changes. The block names itself. A database lets you rewrite history if you have the keys; a ledger makes the rewrite provable.', 1),
    (9, 'Leaderboard', 'Show the board', 'Nobody can inflate their own carbon number. You can only plant more trees.', 1),
]

QUESTIONS = [
    ('Q1. \u201cIs the photo really the proof? Anyone can upload a stock photo.\u201d',
     'No — and the deck says so (appendix, \u201cThe honest scope\u201d). The photo and the GPS come from the planter; that is the weak link, we call it the oracle. What the contract guarantees is narrower and still valuable: the same photo can never back two tokens, the hash cannot be edited afterwards, and two independent organisations must both agree before anything is funded. The chain makes the claim checkable; it does not make it true.'),
    ('Q2. \u201cWhat is the difference between this and a normal database?\u201d',
     'Three things. A database can be rewritten by whoever holds the credentials, and nobody can prove it afterwards. A ledger appends signed blocks, each carrying the hash of the one before it, so any edit breaks the chain visibly — verifyChain() recomputes all of it. And the transition rules are code, so the outcome does not depend on who is negotiating. A database stores a promise. A ledger enforces one.'),
    ('Q3. \u201cWhy Hyperledger Fabric and not Ethereum?\u201d',
     'Access control. Fabric has real organisation identities — MSPs — and a channel. Here there are four: planters\u2019 association, state forest department, corporate green funders, independent auditor. The endorsement policy requires two different organisations, and the code also forbids one organisation reviewing twice — otherwise one organisation with two officers could manufacture the whole quorum. Also: no gas, no token speculation, and the channel is private.'),
]

CONTINGENCY = [
    ('No network', 'Open output/offline/ (screenshots + PDF + run-of-show) and narrate over the stills. Say plainly that they are captures from this deployment. Do not pretend it is live.'),
    ('Geolocation refused', 'Use \u201cGenerate sample proof\u201d — but then SKIP step 5 and upload the prepared file for both plantings, or the refusal will not fire.'),
    ('Duplicate did not refuse', 'Almost always: a different file, or Generate sample proof. Say \u201clet me use the file I prepared\u201d; if it still refuses nothing, do not fake it — open appendix slide A5 and show the rule in code.'),
    ('Running over time', 'Cut slide 4, then slide 10, then demo steps 2, 3 and 7. Never cut slides 5, 6, 8, 9 — never cut demo step 5.'),
]

PREFLIGHT = [
    'Click \u21ba Reset demo in Ledger Explorer first',
    'One photo file on the Desktop, selected twice (step 5)',
    '2-minute clip open in a second tab, muted',
    'F11, no bookmarks, zoom 100\u2013125 %, test the projector',
    'Route form: greentoken-7gc.pages.dev/#discover (hash, not path)',
    'output/offline/ on a USB stick',
]

NUMBERS = ('9 tokens &middot; 3 verified &middot; 4 funded &middot; 1 pending &middot; 1 rejected<br>'
           '170 trees &middot; 4 743 kg CO&#8322; &middot; &#8377;5 550 &middot; 29 blocks')


TALK_CUE = [
    (1, '15', 'Title', 'Every how-to needs proof. Today I will show you a how-to that proves itself.'),
    (2, '40', 'The video', 'Open Planet released How to Live on Earth. The answers already exist. Play the first two minutes.'),
    (3, '55', 'Who is doing this', 'Thirty-two companies are responsible for half the world\u2019s CO\u2082. Thirty-two \u2014 that is a rule we can check.'),
    (4, '40', 'The escape hatch', 'A credit is one tonne somebody else removed, sold to you so your number goes down.'),
    (5, '70', 'The law arrives', 'Four layers of law, all saying the same thing: prove it. And none of them says who checks.'),
    (6, '70', 'The receipts', 'Eighteen forest projects. Eighty-nine million credits. Five point four million were real. Six per cent.'),
    (7, '40', 'One photograph', 'Kariba is fifteen million tonnes nobody can point to. Here it is at a size you can hold.'),
    (8, '55', 'The three refusals', 'A credit is a promise sold to strangers. A smart contract is a promise that keeps itself.'),
    (9, '70', 'How it works', 'Eight steps, every one a rule in code, checked by somebody else. Step two is the weak link.'),
    (10, '55', 'Where it applies', 'The same three refusals apply to every promise with a shape.'),
    (11, '70', 'Today vs GreenToken', 'Six questions: ownership, double-sale, verification, price, audit trail, dispute.'),
    (12, '15', 'The proof', 'I will try two crimes: sell the same tree twice, then edit the ledger. Watch it refuse.'),
    (13, '5', 'Close', 'Plant it. Prove it. Tokenise it. Every how-to needs proof \u2014 let the code be the proof.'),
]


def talk_rows():
    out = []
    for n, sec, title, line in TALK_CUE:
        out.append(f'<tr><td class="n">{n}</td><td class="t">{sec}s</td>'
                   f'<td><b>{title}</b><br><span class="say">\u201c{line}\u201d</span></td></tr>')
    return '\n'.join(out)


def demo_rows():
    out = []
    for n, scr, act, line, star in DEMO:
        cls = ' class="star"' if star else ''
        star_mark = ' <span style="color:#C8553D">&#9733;</span>' if star else ''
        out.append(f'<tr{cls}><td class="n">{n}</td><td class="t">{scr}{star_mark}<br><span class="note">{act}</span></td>'
                   f'<td class="say">\u201c{line}\u201d</td></tr>')
    return '\n'.join(out)


def q_rows():
    return '\n'.join(f'<div class="q"><b>{q}</b><br><span class="note">{a}</span></div>' for q, a in QUESTIONS)


def c_rows():
    return '\n'.join(f'<tr><td class="t">{k}</td><td class="note">{v}</td></tr>' for k, v in CONTINGENCY)


def p_rows():
    return '\n'.join(f'<tr><td>\u2610</td><td>{i}</td></tr>' for i in PREFLIGHT)


PRESENTER = f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>
<div class="wrap">
<div class="col">
<h1>A Promise That Keeps Itself</h1>
<p class="sub">21CSE435T &middot; Smart Contracts and Application Development &middot; Aswath AS &middot; RA2311050010060 &middot; 10-minute talk + live demo</p>
<div class="call"><b>The callback line.</b> \u201cEvery how-to needs proof.\u201d It returns after every act, meaning something new each time: a solution nobody can verify is a story &rarr; no law says who checks &rarr; six per cent is the normal case &rarr; the proof is code, not a document &rarr; watch it refuse.</div>
<h2>The talk &mdash; 13 slides, 600 seconds</h2>
<table><tr><th class="n">#</th><th class="t">Sec</th><th>Opening line &mdash; say it verbatim</th></tr>
{talk_rows()}
</table>
</div>
<div class="col">
<h2>The demo &mdash; nine steps</h2>
<table><tr><th class="n">#</th><th class="t">Screen</th><th>Verbatim line</th></tr>
{demo_rows()}
</table>
<p class="note" style="margin-top:1.2mm">&#9733; = keep in the 4-minute version. The demo sits <b>on top of</b> the 10-minute talk, not inside it. Full run 6&ndash;7 min.</p>
<h3>The nine numbers &mdash; read the screen, not this sheet</h3>
<div class="num">{NUMBERS}</div>
<p class="note" style="margin-top:0.8mm">Snapshot 17 Nov 2026, live API, GET only. verify-chain &rarr; valid: true, 29 blocks, 29 txs. These drift &mdash; read the screen.</p>
</div>
<div class="col">
<h3>Likely questions</h3>
{q_rows()}
<h3>Contingencies</h3>
<table>{c_rows()}</table>
<h3>Pre-flight</h3>
<table>{p_rows()}</table>
<div class="foot">Greentoken &mdash; greentoken-7gc.pages.dev &middot; api: greentoken-api.aswathas13.workers.dev<br>Slide A8 is the same cheat-sheet, in the deck &middot; full script: output/run-of-show.md</div>
</div>
</div></body></html>"""

CARD_CSS = CSS.replace('@page { size: A4 landscape; margin: 8mm; }',
                       '@page { size: A5 portrait; margin: 6mm; }') + """
body { font-size:7.4pt; line-height:1.2; }
h1 { font-size:13pt; }
h2 { font-size:7pt; margin-top:1.6mm; }
h3 { margin-top:1.8mm; }
td, th { padding:0.8mm 1.2mm; }
td.t { width:19mm; }
.num { font-size:7.6pt; padding:1.2mm 1.4mm; }
.call { font-size:7.2pt; }
"""

CARD_SHORT = [
    ('No network', 'open output/offline/ and narrate over the stills — say they are captures'),
    ('Geolocation refused', 'use Generate sample proof, but SKIP step 5 (it must be the same file)'),
    ('No refusal', 'wrong file? use the prepared one. If still nothing, show rule A5 — never fake it'),
    ('Over time', 'cut slides 4, 10; cut demo steps 2, 3, 7. Never cut demo step 5'),
]


def c_short_rows():
    return '\n'.join(f'<tr><td class="t">{k}</td><td class="note">{v}</td></tr>' for k, v in CARD_SHORT)


CARD = f"""<!doctype html><html><head><meta charset="utf-8"><style>{CARD_CSS}</style></head><body>
<h1>A Promise That Keeps Itself</h1>
<p class="sub">Demo card &middot; 21CSE435T &middot; Aswath AS &middot; greentoken-7gc.pages.dev</p>
<div class="call"><b>Every how-to needs proof.</b> Step 5 is the climax: the contract refuses the same photo twice. Never fake it.</div>
<table><tr><th class="n">#</th><th class="t">Screen</th><th>Say</th></tr>
{demo_rows()}
</table>
<h3>The nine numbers</h3>
<div class="num">{NUMBERS}</div>
<h3>If it goes wrong</h3>
<table>{c_short_rows()}</table>
</body></html>"""


def print_pdf(html_path, pdf_path):
    cmd = [CHROME, '--headless', '--disable-gpu', '--no-sandbox',
           '--print-to-pdf=' + pdf_path, '--no-pdf-header-footer',
           '--run-all-compositor-stages-before-draw', '--virtual-time-budget=8000',
           'file:///' + html_path.replace('\\', '/')]
    subprocess.run(cmd, check=True, capture_output=True)
    return os.path.getsize(pdf_path)


if __name__ == '__main__':
    os.makedirs(HTML, exist_ok=True)
    os.makedirs(OUT, exist_ok=True)
    p1 = os.path.join(HTML, 'presenter-script.html')
    p2 = os.path.join(HTML, 'demo-card.html')
    open(p1, 'w', encoding='utf-8').write(PRESENTER)
    open(p2, 'w', encoding='utf-8').write(CARD)
    for src, dst in ((p1, os.path.join(OUT, 'presenter-script.pdf')),
                     (p2, os.path.join(OUT, 'DEMO-CARD.pdf'))):
        size = print_pdf(src, dst)
        print(f'{os.path.basename(dst)}  {size//1024} KB')
