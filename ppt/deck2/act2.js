/**
 * ACT 2 — THE TRUST GAME
 * Slides 10–15. Who the four parties are, the game they are stuck in, why the
 * bad equilibrium is stable, what the ledger changes about the game, and why
 * this design wins.
 */
const T = require('./_theme');

function build(pres) {
  const slides = [];

  // ------------------------------------------------------------ 10 act break
  {
    const s = pres.addSlide();
    T.actBreak(s, 'Act two', 'The trust problem',
      'Four parties. Four incompatible records. One tonne of carbon that can be claimed twice.', 10);
    slides.push(s);
  }

  // ------------------------------------------------------------- 11 the four
  {
    const s = pres.addSlide();
    s.background = { color: T.PAPER };
    T.head(s, 'The cast', 'Four parties, four incompatible records');
    const parties = [
      ['Planters Association', '9 members', 'Sells the credit', 'Risk: the buyer cannot tell a real plot from a re-used photograph'],
      ['State Forest Department', '2 members', 'Approves the proof', 'Risk: is both the seller of approvals and their only reviewer'],
      ['Independent Carbon Auditor', '1 member', 'Second opinion', 'Risk: paid by the same ecosystem it is meant to check'],
      ['Corporate Green Funders', '2 members', 'Pays for the credit', 'Risk: cannot audit 2.6 billion credits or see whether one was already sold'],
    ];
    parties.forEach((p, i) => {
      const x = T.M + i * 2.28;
      T.panel(s, x, 1.25, 2.12, 3.0, { fill: T.MIST });
      s.addShape('rect', { x, y: 1.25, w: 2.12, h: 0.05, fill: { color: T.ACC }, line: { color: T.ACC, width: 0 } });
      s.addText(p[0], { x: x + 0.16, y: 1.42, w: 1.8, h: 0.46, fontSize: 10.5, bold: true, color: T.DEEP, fontFace: T.FONT, margin: 0 });
      s.addText(p[1] + '  ·  ' + p[2], { x: x + 0.16, y: 1.9, w: 1.8, h: 0.24, fontSize: 8, color: T.ACC, fontFace: T.FONT, margin: 0, charSpacing: 0.4 });
      s.addShape('rect', { x: x + 0.16, y: 2.24, w: 1.8, h: 0.008, fill: { color: T.LINE }, line: { color: T.LINE, width: 0 } });
      s.addText(p[3], { x: x + 0.16, y: 2.38, w: 1.8, h: 1.7, fontSize: 9.2, color: '48654F', fontFace: T.FONT, margin: 0, lineSpacingMultiple: 1.08 });
    });
    T.barPanel(s, T.M, 4.45, 8.9, 0.62, T.CLAY, { fill: T.CLAYBG, line: 'F0D8CC' });
    T.para(s, T.M + 0.22, 4.56, 8.5, 0.45,
      'Every one of these risks is an <b>information</b> risk, not a computational one. None of them is solved by a better database — because each party still has to take somebody else\'s word for it.',
      { size: 10.5, color: '5A3A28' });
    T.pageNum(s, 11);
    slides.push(s);
  }

  // --------------------------------------------------------- 12 the commons
  {
    const s = pres.addSlide();
    s.background = { color: T.PAPER };
    T.head(s, 'The game', 'The verification commons');
    T.para(s, T.M, 1.16, 4.6, 1.5,
      'A creditable token needs <b>two</b> endorsements. There are two verifiers. Each verification costs effort; each wants the benefit of a credible market.',
      { size: 11, ls: 1.16 });

    // payoff matrix
    const gx = 5.25, gy = 1.35, cw = 1.95, rh = 0.92;
    s.addText('Payoffs to (V1, V2)', { x: gx, y: gy - 0.28, w: 3.9, h: 0.22, fontSize: 8.5, bold: true, color: T.FAINT, fontFace: T.FONT, margin: 0, charSpacing: 0.8 });
    s.addShape('rect', { x: gx, y: gy, w: cw, h: rh, fill: { color: T.MIST }, line: { color: T.LINE, width: 0.75 } });
    s.addShape('rect', { x: gx + cw, y: gy, w: cw, h: rh, fill: { color: T.MIST }, line: { color: T.LINE, width: 0.75 } });
    s.addShape('rect', { x: gx, y: gy + rh, w: cw, h: rh, fill: { color: T.MIST }, line: { color: T.LINE, width: 0.75 } });
    s.addShape('rect', { x: gx + cw, y: gy + rh, w: cw, h: rh, fill: { color: T.MIST }, line: { color: T.LINE, width: 0.75 } });
    s.addText('V2 verifies', { x: gx, y: gy, w: cw, h: rh, fontSize: 10, bold: true, color: T.DEEP, fontFace: T.FONT, margin: 0, align: 'center', valign: 'middle' });
    s.addText('V2 skips', { x: gx + cw, y: gy, w: cw, h: rh, fontSize: 10, bold: true, color: T.DEEP, fontFace: T.FONT, margin: 0, align: 'center', valign: 'middle' });
    s.addText('V1 verifies', { x: gx - 1.25, y: gy + rh / 2 - 0.15, w: 1.15, h: 0.3, fontSize: 9.5, color: T.DEEP, fontFace: T.FONT, margin: 0, align: 'right' });
    s.addText('V1 skips', { x: gx - 1.25, y: gy + rh + rh / 2 - 0.15, w: 1.15, h: 0.3, fontSize: 9.5, color: T.DEEP, fontFace: T.FONT, margin: 0, align: 'right' });

    const cell = (cx, cy, big, small, fill, bigCol) => {
      s.addShape('rect', { x: cx, y: cy, w: cw, h: rh, fill: { color: fill }, line: { color: T.LINE, width: 0.75 } });
      s.addText(big, { x: cx, y: cy + 0.16, w: cw, h: 0.36, fontSize: 15, bold: true, color: bigCol ?? T.DEEP, fontFace: T.FONT, margin: 0, align: 'center' });
      s.addText(small, { x: cx + 0.08, y: cy + 0.52, w: cw - 0.16, h: 0.34, fontSize: 8, color: '48654F', fontFace: T.FONT, margin: 0, align: 'center', lineSpacingMultiple: 1.0 });
    };
    cell(gx, gy, 'b − c,  b − c', 'both verify · credible token', T.MIST2);
    cell(gx + cw, gy, '−c,  0', 'wasted effort · no token', T.PAPER);
    cell(gx, gy + rh, '0,  −c', 'symmetric', T.PAPER);
    cell(gx + cw, gy + rh, '0,  0', 'nobody verifies · no credible market', 'FBF0EA', T.CLAY);

    T.barPanel(s, T.M, 2.42, 4.6, 1.28, T.CLAY, { fill: T.CLAYBG, line: 'F0D8CC' });
    T.label(s, T.M + 0.2, 2.56, 4.2, 'The bad equilibrium', T.CLAY);
    T.para(s, T.M + 0.2, 2.8, 4.25, 0.85,
      'Nobody verifies. It <b>is</b> a Nash equilibrium: from (skip, skip), a unilateral verifier earns −c while the other earns 0 — so nobody moves. Yet (verify, verify) makes <b>both</b> strictly better off when b > c. This is a tragedy of the commons, and it is the actual reason carbon credits are not credible.',
      { size: 9.6, color: '5A3A28', ls: 1.1 });

    T.para(s, 5.25, 3.48, 3.9, 1.0,
      '<b>b</b> — each verifier’s share of the value a credible market creates.\n<b>c</b> — the cost of verifying.\n<b>Two endorsements</b> are required, so one verifier alone cannot make a token creditable.',
      { size: 9.4, color: '48654F', ls: 1.1 });
    T.para(s, 5.25, 4.62, 3.9, 0.5,
      'Coordination solves it. Nobody has ever coordinated a global verification commons.',
      { size: 10.2, italic: true, bold: true, color: T.DEEP, ls: 1.1 });
    T.pageNum(s, 12);
    slides.push(s);
  }

  // ------------------------------------------------------ 13 why it is stable
  {
    const s = pres.addSlide();
    s.background = { color: T.PAPER };
    T.head(s, 'The diagnosis', 'Why the market cannot coordinate its way out');
    const reasons = [
      ['Verification is rivalrous', 'My audit makes <em>my</em> claim credible. It does not make yours credible. So I have no reason to pay for yours.', T.CLAY],
      ['The cost falls on one side', 'The department bears the cost of verification. The buyer receives the benefit of a credible price.', T.CLAY],
      ['The registry cannot see it', 'Issued and retired credits live in incompatible registries, so nobody can tell whether a tonne was already sold.', T.CLAY],
      ['Reputation is not enforceable', 'A verifier who quietly rubber-stamps loses nothing that anyone can prove or punish.', T.CLAY],
    ];
    reasons.forEach((r, i) => {
      const x = T.M + (i % 2) * 4.55;
      const y = 1.2 + Math.floor(i / 2) * 1.32;
      T.barPanel(s, x, y, 4.35, 1.16, r[2], { fill: T.CLAYBG, line: 'F0D8CC' });
      s.addText(r[0], { x: x + 0.2, y: y + 0.12, w: 4.0, h: 0.3, fontSize: 11.5, bold: true, color: T.CLAY, fontFace: T.FONT, margin: 0 });
      T.para(s, x + 0.2, y + 0.46, 4.0, 0.62, r[1], { size: 9.8, color: '5A3A28', ls: 1.1 });
    });
    T.para(s, T.M, 3.95, 8.9, 0.4,
      'And the market has voted with its money. Voluntary carbon transaction value fell <b>61%</b> from $1.9 bn in 2022 to $723 m in 2023.',
      { size: 11, color: T.INK });
    T.barPanel(s, T.M, 4.42, 8.9, 0.66, T.ACC, { fill: T.MIST2, line: 'C9E3D4' });
    T.para(s, T.M + 0.22, 4.54, 8.5, 0.5,
      'The problem is not that nobody wants to verify. It is that the <b>game</b> rewards skipping. Change the game and the behaviour follows.',
      { size: 11, color: T.DEEP });
    T.pageNum(s, 13);
    T.source(s, 'Sources: UNCTAD (2025); Transparency International, Offsetting Accountability (2025); Ecosystem Marketplace.');
    slides.push(s);
  }

  // ------------------------------------------------------ 14 how we change it
  {
    const s = pres.addSlide();
    s.background = { color: T.PAPER };
    T.head(s, 'The move', 'Three levers that change the game');
    T.para(s, T.M, 1.16, 8.9, 0.34,
      'A shared, append-only, attributable record does not persuade anyone to be honest. It restructures the payoffs so that honest behaviour is the cheaper strategy.',
      { size: 11 });

    const levers = [
      ['1', 'Verification becomes non-rival', 'Once two endorsements exist on a shared ledger, every later party — the buyer, the next planter, the regulator — consumes the same verification for the price of a query. The first verifier’s effort stops being private.',
        'The good free-rider equilibrium: nobody needs to verify twice, because the record is already credible.'],
      ['2', 'Contribution becomes observable', 'The quorum rule requires two distinct organisations. A free-rider’s silence is not neutral — it is a missing signature on a shared record, visible to everyone in the channel.',
        'Reputation stops being a private promise and becomes an on-chain asset.'],
      ['3', 'A token becomes provably unique', 'The photo digest is indexed. A second token carrying the same digest is refused at creation. Double issuance is not detected after the fact; it is prevented.',
        'Double counting stops being a bookkeeping problem to be audited and becomes a state the contract cannot represent.'],
    ];
    levers.forEach((l, i) => {
      const x = T.M + i * 3.03;
      T.panel(s, x, 1.62, 2.87, 3.42, { fill: T.MIST });
      s.addShape('rect', { x, y: 1.62, w: 2.87, h: 0.05, fill: { color: T.ACC }, line: { color: T.ACC, width: 0 } });
      T.numDot(s, x + 0.18, 1.8, l[0], { d: 0.34, fs: 11 });
      s.addText(l[1], { x: x + 0.6, y: 1.82, w: 2.15, h: 0.5, fontSize: 11, bold: true, color: T.DEEP, fontFace: T.FONT, margin: 0, valign: 'top' });
      T.para(s, x + 0.18, 2.42, 2.52, 1.5, l[2], { size: 9.3, color: '48654F', ls: 1.1 });
      s.addShape('rect', { x: x + 0.18, y: 3.92, w: 2.52, h: 0.008, fill: { color: T.LINE }, line: { color: T.LINE, width: 0 } });
      T.para(s, x + 0.18, 4.04, 2.52, 0.9, l[3], { size: 9, italic: true, color: T.ACC, ls: 1.08 });
    });
    T.pageNum(s, 14);
    slides.push(s);
  }

  // ---------------------------------------------------------- 15 why this wins
  {
    const s = pres.addSlide();
    s.background = { color: T.PAPER };
    T.head(s, 'The strategy', 'Why this wins');
    T.para(s, T.M, 1.16, 8.9, 0.34,
      'Not because a blockchain is better technology. Because it makes a compliance problem cheap.',
      { size: 11.5, color: T.DEEP });

    const wins = [
      ['Demand is already mandatory', 'Buyers no longer treat verification as a premium. Integrity bodies, disclosure regimes and corporate climate claims all require it. We are not selling a nice-to-have; we are selling the thing buyers must show their own auditor.'],
      ['The cost is negligible against the value', 'The entire cost of making one token creditable is two signatures and one transaction. The value of one creditable token is the difference between a price of zero and a price of ₹150 a tree.'],
      ['The moat is institutional, not code', 'Anyone can copy a contract. Nobody else can copy four organisations having signed the same channel configuration. The first mover sets the quorum, the price rules and the data model that every later participant inherits.'],
      ['Adding a member compounds the record', 'Each new organisation is a new independent source of endorsement, and new demand for the credits. The channel configuration is itself a transaction, so membership is governed, not negotiated by email.'],
      ['It survives contact with auditors', 'A buyer can open the ledger and recompute the entire history without asking anybody for anything. That is what turns a claim into evidence — and evidence is what gets a credit past due diligence.'],
    ];
    wins.forEach((w, i) => {
      const y = 1.6 + i * 0.68;
      s.addShape('ellipse', { x: T.M, y: y + 0.07, w: 0.1, h: 0.1, fill: { color: T.ACC }, line: { color: T.ACC, width: 0.25 } });
      s.addText(w[0], { x: T.M + 0.2, y: y - 0.02, w: 2.5, h: 0.3, fontSize: 10.5, bold: true, color: T.DEEP, fontFace: T.FONT, margin: 0 });
      T.para(s, T.M + 2.75, y - 0.02, 6.15, 0.6, w[1], { size: 9.6, color: '48654F', ls: 1.1 });
    });
    T.pageNum(s, 15);
    slides.push(s);
  }

  return slides;
}

module.exports = { build };
