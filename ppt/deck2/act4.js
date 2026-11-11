/**
 * ACT 4 — GREENTOKEN
 * Slides 23–30. What we built, the rules, the architecture, the proof, the
 * numbers, the honest scope, and the close.
 */
const T = require('./_theme');

function build(pres) {
  const slides = [];

  // ------------------------------------------------------------ 23 act break
  {
    const s = pres.addSlide();
    T.actBreak(s, 'Act four', 'GreenToken',
      'Two fingerprints. Two signatures from two different organisations. One chain nobody can rewrite.', 23);
    slides.push(s);
  }

  // -------------------------------------------------------------- 24 the flow
  {
    const s = pres.addSlide();
    s.background = { color: T.PAPER };
    T.head(s, 'The application', 'The whole flow, end to end');
    const flow = [
      ['Plant', 'Lakshmi plants 40 neem trees', 'photo bytes → SHA-256\ngeo payload → SHA-256', 'PLANTER'],
      ['Verify', 'Forest Dept signs', 'endorsement 1 of 2', 'VERIFIER'],
      ['Verify', 'Auditor signs', 'endorsement 2 of 2\ntwo different orgs', 'AUDITOR'],
      ['Mint', 'token becomes VERIFIED', 'now it can be bought', '—'],
      ['Fund', 'funder picks a basket', 'discount ladder computed\ninside the contract', 'FUNDER'],
      ['Settle', 'one invoice, one net amount', '₹15,525 across 3 invoices', 'FUNDER / AUDITOR'],
    ];
    flow.forEach((f, i) => {
      const x = T.M + (i % 3) * 3.03;
      const y = 1.24 + Math.floor(i / 3) * 1.66;
      T.panel(s, x, y, 2.87, 1.5, { fill: T.MIST });
      T.pill(s, x + 0.16, y + 0.14, 0.72, f[0].toUpperCase(), { fill: T.ACC, h: 0.22, fontSize: 7.5 });
      s.addText(f[3], { x: x + 0.96, y: y + 0.16, w: 1.8, h: 0.2, fontSize: 7.2, color: T.FAINT, fontFace: T.FONT, margin: 0, align: 'right', charSpacing: 0.5 });
      s.addText(f[1], { x: x + 0.16, y: y + 0.48, w: 2.55, h: 0.42, fontSize: 10.5, bold: true, color: T.DEEP, fontFace: T.FONT, margin: 0 });
      s.addText(f[2], { x: x + 0.16, y: y + 0.94, w: 2.55, h: 0.46, fontSize: 8.6, color: '48654F', fontFace: T.FONT, margin: 0, lineSpacingMultiple: 1.04 });
      if (i % 3 < 2) T.chevron(s, x + 2.9, y + 0.68);
    });
    T.para(s, T.M, 4.72, 8.9, 0.42,
      'Every arrow above is a Fabric transaction with a signature, a hash and a place in the chain. The client never writes to the ledger; it asks.',
      { size: 10.5, italic: true, color: T.DEEP });
    T.pageNum(s, 24);
    slides.push(s);
  }

  // ------------------------------------------------------------ 25 invariants
  {
    const s = pres.addSlide();
    s.background = { color: T.PAPER };
    T.head(s, 'The rulebook', 'Eight invariants, and where each one lives');
    const rules = [
      ['Two distinct organisations must endorse', 'VerifyPlanting — quorum check'],
      ['One review per participant', 'VerifyPlanting — duplicate guard'],
      ['Rejection is terminal', 'VerifyPlanting — state machine'],
      ['One photo can back at most one token', 'PlantTree — idx:photo:<sha256>:'],
      ['The price is fixed on-chain', 'BASE_PRICE_INR = 150'],
      ['The discount ladder is in the contract', 'DISCOUNT_TIERS — 0/5/10/15%'],
      ['Only VERIFIED tokens can be funded', 'FundTokens — basket validation'],
      ['Private contact never reaches the ledger', 'PlantTree — stripped at the boundary'],
    ];
    rules.forEach((r, i) => {
      const x = T.M + (i % 2) * 4.55;
      const y = 1.22 + Math.floor(i / 2) * 0.78;
      T.numDot(s, x, y, i + 1, { d: 0.28, fs: 9 });
      s.addText(r[0], { x: x + 0.4, y: y - 0.02, w: 2.55, h: 0.5, fontSize: 10, bold: true, color: T.DEEP, fontFace: T.FONT, margin: 0, lineSpacingMultiple: 1.0 });
      s.addText(r[1], { x: x + 3.0, y: y + 0.02, w: 1.55, h: 0.5, fontSize: 8.6, color: T.ACC, fontFace: T.FONT, margin: 0, lineSpacingMultiple: 1.0 });
    });
    T.barPanel(s, T.M, 4.48, 8.9, 0.66, T.ACC, { fill: T.MIST2, line: 'C9E3D4' });
    T.para(s, T.M + 0.24, 4.6, 8.4, 0.5,
      'Every one of these is enforced by the <b>contract</b>, not by the interface. The interface only shows what the contract decided — and the contract’s decision carries a signature and a transaction hash.',
      { size: 10.5, color: T.DEEP });
    T.pageNum(s, 25);
    slides.push(s);
  }

  // --------------------------------------------------------- 26 three hosts
  {
    const s = pres.addSlide();
    s.background = { color: T.PAPER };
    T.head(s, 'The architecture', 'One contract, three hosts');
    T.panel(s, 2.75, 1.2, 4.5, 1.12, { fill: T.MIST2, line: 'C9E3D4' });
    s.addText('src/core/chaincode.ts', { x: 2.75, y: 1.34, w: 4.5, h: 0.3, fontSize: 13, bold: true, color: T.DEEP, fontFace: T.FONT, margin: 0, align: 'center' });
    s.addText('the business rules — zero platform imports', { x: 2.75, y: 1.68, w: 4.5, h: 0.24, fontSize: 9.5, color: '48654F', fontFace: T.FONT, margin: 0, align: 'center' });
    s.addText('PlantTree · VerifyPlanting · FundTokens · SettleFunding  +  6 read functions', { x: 2.75, y: 1.94, w: 4.5, h: 0.24, fontSize: 8.2, color: T.ACC, fontFace: T.FONT, margin: 0, align: 'center' });

    const hosts = [
      ['Browser', 'MemoryStub', 'state in localStorage', 'the live demo — opens instantly'],
      ['Cloudflare Durable Object', 'Durable Object host', 'ordered ledger · REST + SSE', 'the deployed backend'],
      ['Hyperledger Fabric v2.5', 'fabric-shim Context', 'real peer, real chaincode', 'the lab record'],
    ];
    hosts.forEach((h, i) => {
      const x = T.M + i * 3.03;
      T.panel(s, x, 3.0, 2.87, 1.72, { fill: T.MIST });
      s.addShape('rect', { x, y: 3.0, w: 2.87, h: 0.05, fill: { color: T.ACC }, line: { color: T.ACC, width: 0 } });
      s.addText(h[0], { x: x + 0.16, y: 3.16, w: 2.55, h: 0.46, fontSize: 10.5, bold: true, color: T.DEEP, fontFace: T.FONT, margin: 0, lineSpacingMultiple: 1.0 });
      T.pill(s, x + 0.16, 3.68, 1.6, h[1].toUpperCase(), { fill: T.ACC, h: 0.2, fontSize: 6.8 });
      s.addText(h[2], { x: x + 0.16, y: 3.98, w: 2.55, h: 0.24, fontSize: 9, color: '48654F', fontFace: T.FONT, margin: 0 });
      s.addText(h[3], { x: x + 0.16, y: 4.26, w: 2.55, h: 0.4, fontSize: 8.6, italic: true, color: T.ACC, fontFace: T.FONT, margin: 0, lineSpacingMultiple: 1.0 });
      s.addShape('line', { x: x + 1.43, y: 2.32, w: 0, h: 0.66, line: { color: T.SAGE, width: 1.2, dashType: 'dash' } });
    });
    T.para(s, T.M, 4.86, 8.9, 0.3,
      'The rules are written once. Each host supplies its own ChaincodeStub — getState, putState, getStateByRange, emitEvent, getCallerIdentity.',
      { size: 9.8, italic: true, color: '48654F' });
    T.pageNum(s, 26);
    slides.push(s);
  }

  // ------------------------------------------------------------ 27 the proof
  {
    const s = pres.addSlide();
    s.background = { color: T.NIGHT };
    s.addShape('rect', { x: 0, y: 0, w: T.W, h: 0.06, fill: { color: T.ACC }, line: { color: T.ACC, width: 0 } });
    s.addText('THE PROOF', { x: T.M, y: 0.4, w: 8.5, h: 0.24, fontSize: 9, bold: true, charSpacing: 1.6, color: T.SAGE, fontFace: T.FONT, margin: 0 });
    s.addText('Most projects claim tamper-evidence. We let you watch it happen.', {
      x: T.M, y: 0.66, w: 8.6, h: 0.5, fontSize: 23, bold: true, color: T.CREAM, fontFace: T.FONT, margin: 0,
    });
    const steps = [
      ['1', 'Alter a signed payload', 'The demo changes a transaction’s stored value — after endorsement, without touching the recorded hash.'],
      ['2', 'Recompute the whole chain', 'The verifier walks from the genesis block forward, recomputing every block hash, every payload hash and every Merkle root.'],
      ['3', 'Name the break', 'It reports which block, which field, and why the stored value no longer matches. Not “invalid” — a location and a reason.'],
      ['4', 'Restore', 'The chain is rebuilt from the stored transactions and re-signed. Repeatable, in front of the examiner.'],
    ];
    steps.forEach((st, i) => {
      const x = T.M + i * 2.28;
      s.addShape('roundRect', { x, y: 1.4, w: 2.12, h: 2.5, rectRadius: 0.06, fill: { color: T.NIGHT2 }, line: { color: '2E5F49', width: 0.75 } });
      T.numDot(s, x + 0.16, 1.56, st[0], { fill: T.ACC, d: 0.32, fs: 10.5 });
      s.addText(st[1], { x: x + 0.16, y: 2.0, w: 1.8, h: 0.5, fontSize: 11, bold: true, color: T.CREAM, fontFace: T.FONT, margin: 0, lineSpacingMultiple: 1.0 });
      s.addText(st[2], { x: x + 0.16, y: 2.56, w: 1.8, h: 1.2, fontSize: 8.6, color: T.SAGE, fontFace: T.FONT, margin: 0, lineSpacingMultiple: 1.06 });
    });
    s.addText('This is not a screenshot. It is a button in the running application.', {
      x: T.M, y: 4.2, w: 8.6, h: 0.34, fontSize: 13, bold: true, color: T.ACC, fontFace: T.FONT, margin: 0,
    });
    s.addText('It is the difference between claiming a property and demonstrating one.', {
      x: T.M, y: 4.56, w: 8.6, h: 0.34, fontSize: 11, color: T.SAGE, fontFace: T.FONT, margin: 0,
    });
    T.pageNum(s, 27, true);
    slides.push(s);
  }

  // ------------------------------------------------------------- 28 the numbers
  {
    const s = pres.addSlide();
    s.background = { color: T.PAPER };
    T.head(s, 'The results', 'What the deployed ledger actually holds');
    const nums = [
      ['9', 'tokens on chain'],
      ['170', 'trees recorded'],
      ['4.7 t', 'CO₂ per year'],
      ['29', 'blocks committed'],
      ['₹15,525', 'net disbursed'],
      ['167 / 167', 'automated checks passing'],
    ];
    nums.forEach((n, i) => {
      const x = T.M + (i % 3) * 3.03;
      const y = 1.24 + Math.floor(i / 3) * 1.16;
      T.panel(s, x, y, 2.87, 1.0, { fill: T.MIST });
      T.stat(s, x + 0.18, y + 0.1, 2.5, n[0], n[1], { vsize: 24, vh: 0.5, lsize: 9 });
    });
    T.panel(s, T.M, 3.66, 4.35, 1.4, { fill: T.MIST });
    T.label(s, T.M + 0.2, 3.82, 4.0, 'The invoice arithmetic, in full');
    T.para(s, T.M + 0.2, 4.04, 4.0, 0.92,
      '70 trees at the 5% tier → ₹10,500 gross − ₹525 discount = ₹9,975.\n37 trees at 0% → ₹5,550.\n<b>₹16,050 gross − ₹525 discount = ₹15,525 net.</b>',
      { size: 9.6, color: '48654F', ls: 1.14 });
    T.panel(s, 5.15, 3.66, 4.3, 1.4, { fill: T.MIST });
    T.label(s, 5.35, 3.82, 3.9, 'Status split');
    s.addText('3 VERIFIED   ·   4 FUNDED\n1 PENDING   ·   1 REJECTED', {
      x: 5.35, y: 4.04, w: 3.9, h: 0.44, fontSize: 10.5, bold: true, color: T.DEEP, fontFace: T.FONT, margin: 0, lineSpacingMultiple: 1.05,
    });
    T.para(s, 5.35, 4.52, 3.9, 0.5,
      'A rejected token and a token still awaiting its second endorsement are both visible — because a ledger that only shows happy outcomes is not a ledger.',
      { size: 9.4, italic: true, color: '48654F', ls: 1.1 });
    T.pageNum(s, 28);
    T.source(s, 'Read directly from the deployed ledger at greentoken-api.aswathas13.workers.dev.');
    slides.push(s);
  }

  // ----------------------------------------------------------- 29 honest scope
  {
    const s = pres.addSlide();
    s.background = { color: T.PAPER };
    T.head(s, 'The honest scope', 'What is real, and what is emulated');
    T.panel(s, T.M, 1.24, 4.35, 3.72, { fill: T.MIST2, line: 'C9E3D4' });
    T.label(s, T.M + 0.22, 1.4, 3.9, 'Really implemented, really running', T.ACC);
    T.bullets(s, T.M + 0.22, 1.68, 3.95, [
      'SHA-256 digests of photo bytes and geo payloads',
      'ECDSA P-256 endorsements and block signatures',
      'Merkle roots over transaction hashes',
      'A real hash-linked, signed block chain',
      'All eight invariants, enforced in the contract',
      'Real Fabric v2.5 chaincode, compiled and packaged',
      'A deployed REST + event-stream API',
      'A tamper test that localises the break',
    ], { size: 9.4, gap: 0.4, dot: T.ACC });

    T.panel(s, 5.15, 1.24, 4.3, 3.72, { fill: T.CLAYBG, line: 'F0D8CC' });
    T.label(s, 5.37, 1.4, 3.9, 'Emulated, or deliberately scoped out', T.CLAY);
    T.bullets(s, 5.37, 1.68, 3.9, [
      'The demo host is a Durable Object, not a Fabric peer',
      'Private data is stripped, not distributed in a collection',
      'Keys are derived from participant ids, not CA-issued',
      'Settlement marks an invoice settled; no money moves',
      'GPS accuracy is shown to reviewers, not thresholded',
      'On-chain governance is future work',
    ], { size: 9.4, gap: 0.48, dot: T.CLAY });
    T.pageNum(s, 29);
    slides.push(s);
  }

  // -------------------------------------------------------------- 30 the close
  {
    const s = pres.addSlide();
    s.background = { color: T.NIGHT };
    s.addShape('rect', { x: 0, y: 0, w: T.W, h: 0.07, fill: { color: T.ACC }, line: { color: T.ACC, width: 0 } });
    s.addText('GREENTOKEN', { x: T.M, y: 0.52, w: 8.5, h: 0.24, fontSize: 9.5, bold: true, charSpacing: 2.2, color: T.SAGE, fontFace: T.FONT, margin: 0 });
    s.addText('Plant it. Prove it. Tokenise it.', {
      x: T.M, y: 1.0, w: 8.6, h: 0.7, fontSize: 32, bold: true, color: T.CREAM, fontFace: T.FONT, margin: 0,
    });
    s.addText('The tree that was sold twice is now a token nobody can sell twice.', {
      x: T.M, y: 1.78, w: 8.0, h: 0.34, fontSize: 13, color: T.SAGE, fontFace: T.FONT, margin: 0,
    });

    const demo = ['Open the live demo', 'Discover & fund a basket', 'Plant a tree', 'Verify as two organisations', 'Watch the tamper test', 'Check the ledger'];
    demo.forEach((d, i) => {
      const x = T.M + (i % 3) * 3.03;
      const y = 2.42 + Math.floor(i / 3) * 0.62;
      s.addShape('rect', { x, y, w: 2.87, h: 0.5, fill: { color: T.NIGHT2 }, line: { color: '2E5F49', width: 0.75 } });
      s.addText(String(i + 1), { x: x + 0.14, y: y + 0.12, w: 0.3, h: 0.26, fontSize: 10, bold: true, color: T.ACC, fontFace: T.FONT, margin: 0 });
      s.addText(d, { x: x + 0.5, y: y + 0.13, w: 2.25, h: 0.26, fontSize: 10, color: T.CREAM, fontFace: T.FONT, margin: 0 });
    });

    s.addShape('rect', { x: T.M, y: 3.9, w: 8.9, h: 0.008, fill: { color: '2E5F49' }, line: { color: '2E5F49', width: 0 } });
    s.addText('greentoken-7gc.pages.dev', { x: T.M, y: 4.1, w: 4.4, h: 0.34, fontSize: 16, bold: true, color: T.ACC, fontFace: T.FONT, margin: 0 });
    s.addText('github.com/aswathas/greentoken', { x: 5.1, y: 4.12, w: 4.35, h: 0.3, fontSize: 11, color: T.SAGE, fontFace: T.FONT, margin: 0, align: 'right' });
    s.addText('Aswath AS  ·  RA2311050010060  ·  21CSE435T Smart Contract  ·  Dr. S. Ganesh Kumar', {
      x: T.M, y: 4.62, w: 8.9, h: 0.3, fontSize: 10, color: T.SAGE, fontFace: T.FONT, margin: 0,
    });
    s.addText('Fabric v2.5 · fabric-contract-api 2.5.8 · 10 chaincode functions · 4 MSPs · 14 participants · 167 checks passing', {
      x: T.M, y: 4.95, w: 8.9, h: 0.3, fontSize: 9, color: '5E8A72', fontFace: T.FONT, margin: 0,
    });
    T.pageNum(s, 30, true);
    slides.push(s);
  }

  return slides;
}

module.exports = { build };
