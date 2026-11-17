/**
 * appendix.js — the 8 appendix slides (A1–A8).
 * Never spoken in the 10-minute track. They are the Q&A depth and the
 * student handout; promote them into the talk if the slot is longer.
 */
const { C, F, W, H, M, ground, head, foot, panel, stat, chip, arrow, bullets } = require('./theme');

const APP_SOURCE = 'GreenToken contract (src/core/chaincode.ts, src/core/ledger.ts) · read from the deployed build, 17 November 2026';

function a01Principles(pres) {
  const s = pres.addSlide();
  ground(pres, s, false);
  const y = head(s, {
    kicker: 'Appendix A1',
    title: 'The four principles of a carbon credit.',
    deck: 'A credit is only real if it is additional, permanent, quantified — and only counted once. The market fails on the fourth.',
  });

  const rows = [
    ['Additionality', 'The reduction would not have happened without the money from the credit.', 'HELD', C.moss],
    ['Permanence', 'The removal is not reversed by fire, disease or a changed land use.', 'HELD', C.moss],
    ['Robust quantification', 'The baseline is defensible — you can defend the counterfactual.', 'HELD', C.moss],
    ['No double counting', 'One tonne, one owner. The same tonne is never sold twice.', 'BROKEN', C.clay],
  ];
  const body = rows.map((r) => [
    { text: r[0], options: { bold: true, fontSize: 12.5, color: C.ink } },
    { text: r[1], options: { fontSize: 11.5, color: C.muted } },
    { text: r[2], options: { bold: true, fontSize: 12, color: C.white, align: 'center', fill: r[3] } },
  ]);
  s.addTable(body, {
    x: M, y: y + 0.12, w: W - 2 * M,
    colW: [3.1, 7.4, 1.33],
    rowH: 0.68,
    border: { type: 'solid', color: C.line, pt: 1 },
    fill: C.white,
    autoPage: false,
  });

  panel(pres, s, { x: M, y: y + 3.14, w: W - 2 * M, h: 1.3, fill: C.forest, border: C.forest });
  s.addText('The first three are judgements. The fourth is arithmetic — and arithmetic is what code is good at.', {
    x: M + 0.3, y: y + 3.26, w: W - 2 * M - 0.6, h: 0.44, margin: 0,
    fontFace: F.display, fontSize: 17, bold: true, color: C.white, valign: 'middle', align: 'center',
  });
  s.addText('A human registry can argue about a baseline. It cannot accidentally sell the same tonne twice — but it can, and does. '
    + 'GreenToken keeps the human judgement (the Forest Department reviews the planting) and moves the arithmetic (one photo, one token) into the contract.', {
    x: M + 0.9, y: y + 3.72, w: W - 2 * M - 1.8, h: 0.62, margin: 0,
    fontFace: F.body, fontSize: 11, color: 'BFD0C6', valign: 'top', align: 'center', lineSpacing: 15,
  });

  foot(s, { page: 'A1', source: 'The four principles as applied by Verra, Gold Standard and the VCMI; the double-counting failure is documented in UNCTAD (2025) and in the Cambridge/VU study (Science, 2023)' });
  s.addNotes('If the teacher asks "what are the four principles?" — this is the slide. '
    + 'Additionality: would it have happened anyway? Permanence: does it stay removed? Quantification: is the baseline defensible? '
    + 'Double counting: has this tonne already been sold? The first three are argued. The fourth is arithmetic.\n\n'
    + 'Land it: "GreenToken keeps the human judgement and moves the arithmetic into the contract."');
  return s;
}

function a02StateMachine(pres) {
  const s = pres.addSlide();
  ground(pres, s, false);
  const y = head(s, {
    kicker: 'Appendix A2',
    title: 'The token state machine.',
    deck: 'Four states and the rules that move between them. A rejected token can never be re-reviewed — that is written into the contract.',
  });

  const box = (bx, by, bw, bh, title, sub, fill, border, color) => {
    panel(pres, s, { x: bx, y: by, w: bw, h: bh, fill, border });
    s.addText(title, {
      x: bx + 0.16, y: by + 0.12, w: bw - 0.32, h: 0.4, margin: 0,
      fontFace: F.display, fontSize: 15, bold: true, color, valign: 'middle',
    });
    s.addText(sub, {
      x: bx + 0.16, y: by + 0.52, w: bw - 0.32, h: bh - 0.62, margin: 0,
      fontFace: F.body, fontSize: 10, color: color === C.white ? 'BFD0C6' : C.muted, valign: 'top', lineSpacing: 13,
    });
  };

  s.addText('THE TOKEN', {
    x: M, y: y + 0.06, w: 3, h: 0.26, margin: 0,
    fontFace: F.body, fontSize: 9.5, bold: true, charSpacing: 1.8, color: C.muted, valign: 'middle',
  });
  const by = y + 0.4;
  box(M, by, 2.6, 1.05, 'PENDING', 'Planted, hashed, waiting for two independent endorsements.', C.panel, C.line, C.ink);
  box(M + 3.0, by, 2.6, 1.05, 'VERIFIED', 'Quorum reached. The token is mintable and can be funded.', C.forest, C.forest, C.white);
  box(M + 6.0, by, 2.6, 1.05, 'FUNDED', 'A funder has committed. An invoice is ISSUED against it.', C.moss, C.moss, C.white);
  arrow(pres, s, { x: M + 2.65, y: by + 0.52, w: 0.3, color: C.moss, width: 2 });
  arrow(pres, s, { x: M + 5.65, y: by + 0.52, w: 0.3, color: C.moss, width: 2 });

  box(M + 3.0, by + 1.7, 2.6, 0.95, 'REJECTED', 'Terminal. The contract refuses any further review of this token.', 'FBEDE9', C.clay, C.clay);
  arrow(pres, s, { x: M + 1.3, y: by + 1.05, w: 1.7, h: 0.62, color: C.clay, width: 1.5 });
  arrow(pres, s, { x: M + 4.3, y: by + 1.05, w: 0, h: 0.62, color: C.clay, width: 1.5 });

  // invoice lane
  const ix = M + 9.1;
  const iw = W - M - ix;
  s.addText('THE INVOICE', {
    x: ix, y: y + 0.06, w: iw, h: 0.26, margin: 0,
    fontFace: F.body, fontSize: 9.5, bold: true, charSpacing: 1.8, color: C.muted, valign: 'middle',
  });
  box(ix, by, iw, 0.95, 'ISSUED', 'Raised against a funded token, with the discount tier applied.', C.panel, C.line, C.ink);
  arrow(pres, s, { x: ix + iw / 2, y: by + 0.98, w: 0, h: 0.34, color: C.moss, width: 2 });
  box(ix, by + 1.36, iw, 0.95, 'SETTLED', 'Paid to the planter. Closed forever.', C.forest, C.forest, C.white);

  panel(pres, s, { x: ix, y: by + 2.55, w: iw, h: 1.62, fill: C.panel, border: C.line });
  s.addText('WHAT THE CONTRACT REFUSES', {
    x: ix + 0.18, y: by + 2.64, w: iw - 0.36, h: 0.26, margin: 0,
    fontFace: F.body, fontSize: 9, bold: true, charSpacing: 1.4, color: C.clay, valign: 'middle',
  });
  bullets(s, [
    'A rejected token can never be re-reviewed, re-approved or queued again.',
    'A funded token can never be verified again — verification is closed.',
    'A settled invoice can never be settled twice.',
  ], { x: ix + 0.18, y: by + 2.94, w: iw - 0.36, h: 1.18, size: 9.5, gap: 4, color: C.ink });

  foot(s, { page: 'A2', source: APP_SOURCE });
  s.addNotes('The state machine is what "no rollback" means in practice. Show the four boxes, then the red one.\n\n'
    + 'Point out that the refusals are the point: a rejected token can never come back, a funded token can never be re-verified, a settled invoice can never settle twice. '
    + 'A database would let an administrator flip a status field. This will not.\n\n'
    + 'If asked why REJECTED is terminal: a token that was rejected because the planting was never verified must not be quietly re-queued for a friendlier reviewer.');
  return s;
}

function a03Actors(pres) {
  const s = pres.addSlide();
  ground(pres, s, false);
  const y = head(s, {
    kicker: 'Appendix A3',
    title: 'The actors, and what each of them is allowed to do.',
    deck: 'Four organisations, four MSP identities, one shared channel. The permissions are enforced by the contract, not by the interface.',
  });

  const orgs = [
    ['PLANTER', 'Sahyadri Planters\nAssociation', 'PlantersAssociationMSP', 'Plants the tree and submits the evidence.', 'MAY  submit a planting proof', 'CANNOT  endorse · fund · settle', C.moss],
    ['VERIFIER', 'State Forest\nDepartment', 'ForestDeptMSP', 'Reviews the planting and the geo-stamp.', 'MAY  approve or reject a token', 'CANNOT  fund or settle', C.forest],
    ['FUNDER', 'Corporate Green\nFunders', 'CorporateFundersMSP', 'Buys verified tokens for a carbon claim.', 'MAY  fund a verified token · settle an invoice', 'CANNOT  endorse or plant', C.amber],
    ['AUDITOR', 'Independent Carbon\nAuditor', 'AuditorMSP', 'Reads the whole record after the fact.', 'MAY  read every block and token', 'CANNOT  change anything', C.clay],
  ];
  const cw = 2.75;
  const cg = 0.27;
  orgs.forEach((o, i) => {
    const x = M + i * (cw + cg);
    panel(pres, s, { x, y: y + 0.12, w: cw, h: 3.5, fill: C.panel, border: C.line });
    chip(pres, s, { x: x + 0.18, y: y + 0.3, w: 1.4, h: 0.3, text: o[0], fill: o[6], color: C.white, size: 9 });
    s.addText(o[1], {
      x: x + 0.18, y: y + 0.72, w: cw - 0.36, h: 0.62, margin: 0,
      fontFace: F.display, fontSize: 13, bold: true, color: C.ink, valign: 'top', lineSpacing: 16,
    });
    s.addText(o[2], {
      x: x + 0.18, y: y + 1.36, w: cw - 0.36, h: 0.28, margin: 0,
      fontFace: F.mono, fontSize: 8, color: C.muted, valign: 'middle',
    });
    s.addText(o[3], {
      x: x + 0.18, y: y + 1.7, w: cw - 0.36, h: 0.72, margin: 0,
      fontFace: F.body, fontSize: 10.5, color: C.ink, valign: 'top', lineSpacing: 14,
    });
    s.addShape(pres.ShapeType.rect, { x: x + 0.18, y: y + 2.44, w: cw - 0.36, h: 0.02, fill: { color: C.line }, line: { color: C.line, width: 0.5 } });
    s.addText(o[4], {
      x: x + 0.18, y: y + 2.52, w: cw - 0.36, h: 0.52, margin: 0,
      fontFace: F.body, fontSize: 10, bold: true, color: C.moss, valign: 'top', lineSpacing: 13,
    });
    s.addText(o[5], {
      x: x + 0.18, y: y + 3.08, w: cw - 0.36, h: 0.46, margin: 0,
      fontFace: F.body, fontSize: 10, color: C.clay, valign: 'top', lineSpacing: 13,
    });
  });

  panel(pres, s, { x: M, y: y + 3.82, w: W - 2 * M, h: 0.78, fill: C.forest, border: C.forest });
  s.addText('The planter cannot approve their own tree. An organisation cannot manufacture its own quorum. Those are contract rules, not policy settings.', {
    x: M + 0.3, y: y + 3.9, w: W - 2 * M - 0.6, h: 0.62, margin: 0,
    fontFace: F.display, fontSize: 15, bold: true, color: C.white, valign: 'middle', align: 'center',
  });

  foot(s, { page: 'A3', source: APP_SOURCE });
  s.addNotes('If the teacher asks "how do you know a random planter cannot forge a token?" — this slide. '
    + 'The MSP identity of the caller is resolved to an organisation role inside the chaincode, and every function checks the role before it does anything. '
    + 'An unauthorised call is rejected with an error, not hidden in the UI.\n\n'
    + 'The auditor is deliberately powerless to change anything. That is the point of an independent auditor.');
  return s;
}

function a04HashChain(pres) {
  const s = pres.addSlide();
  ground(pres, s, false);
  const y = head(s, {
    kicker: 'Appendix A4',
    title: 'The hash chain, and what tampering looks like.',
    deck: 'Every block carries the hash of the one before it. Change a transaction and the chain stops agreeing with itself.',
  });

  const blocks = [
    ['BLOCK #27', 'prevHash  a41f…9c02', 'merkleRoot  77be…03d1', 'ts  2026-11-17 09:41:02', 'sig  ECDSA P-256'],
    ['BLOCK #28', 'prevHash  3c5e…d880', 'merkleRoot  9f0c…6b48', 'ts  2026-11-17 09:41:19', 'sig  ECDSA P-256'],
    ['BLOCK #29', 'prevHash  88aa…21f7', 'merkleRoot  c402…ae19', 'ts  2026-11-17 09:42:55', 'sig  ECDSA P-256'],
  ];
  const bw = 2.66;
  const bgap = 0.4;
  blocks.forEach((b, i) => {
    const x = M + i * (bw + bgap);
    panel(pres, s, { x, y: y + 0.14, w: bw, h: 2.1, fill: i === 2 ? C.forest : C.panel, border: i === 2 ? C.forest : C.line });
    s.addText(b[0], {
      x: x + 0.16, y: y + 0.26, w: bw - 0.32, h: 0.3, margin: 0,
      fontFace: F.mono, fontSize: 10.5, bold: true, color: i === 2 ? C.mint : C.moss, valign: 'middle',
    });
    b.slice(1).forEach((line, j) => {
      s.addText(line, {
        x: x + 0.16, y: y + 0.66 + j * 0.32, w: bw - 0.32, h: 0.28, margin: 0,
        fontFace: F.mono, fontSize: 8.5, color: i === 2 ? 'C7D6CD' : C.muted, valign: 'middle',
      });
    });
    if (i < 2) {
      arrow(pres, s, { x: x + bw + 0.07, y: y + 1.19, w: 0.26, color: C.moss, width: 2 });
      s.addText('prevHash', {
        x: x + bw - 0.02, y: y + 0.86, w: 0.46, h: 0.26, margin: 0,
        fontFace: F.mono, fontSize: 7, color: C.moss, align: 'center', valign: 'middle',
      });
    }
  });

  // tamper
  const tx = M + 3 * (bw + bgap);
  panel(pres, s, { x: tx, y: y + 0.14, w: W - M - tx, h: 2.1, fill: 'FBEDE9', border: C.clay });
  s.addText('TAMPERED', {
    x: tx + 0.16, y: y + 0.26, w: W - M - tx - 0.32, h: 0.3, margin: 0,
    fontFace: F.mono, fontSize: 10.5, bold: true, color: C.clay, valign: 'middle',
  });
  s.addText('Change one field inside a transaction and the Merkle root no longer matches. The block turns red, and every block after it fails to chain.', {
    x: tx + 0.16, y: y + 0.64, w: W - M - tx - 0.32, h: 1.46, margin: 0,
    fontFace: F.body, fontSize: 10, color: C.ink, valign: 'top', lineSpacing: 13,
  });

  panel(pres, s, { x: M, y: y + 2.5, w: W - 2 * M, h: 0.78, fill: C.panel, border: C.line });
  s.addText('blockHash  =  SHA-256( prevHash  |  merkleRoot  |  number  |  timestamp )', {
    x: M + 0.25, y: y + 2.56, w: W - 2 * M - 0.5, h: 0.34, margin: 0,
    fontFace: F.mono, fontSize: 13, bold: true, color: C.forest, valign: 'middle', align: 'center',
  });
  s.addText('The orderer signs the block header with its own key. verifyChain() recomputes every hash and every Merkle root from scratch and reports the first block that disagrees.', {
    x: M + 0.25, y: y + 2.9, w: W - 2 * M - 0.5, h: 0.32, margin: 0,
    fontFace: F.body, fontSize: 10.5, color: C.muted, valign: 'middle', align: 'center',
  });

  panel(pres, s, { x: M, y: y + 3.46, w: W - 2 * M, h: 0.78, fill: C.forest, border: C.forest });
  s.addText('Why this beats a database: a database with the keys can be rewritten in silence. Here the rewrite is provable, by anyone, with the file.', {
    x: M + 0.3, y: y + 3.54, w: W - 2 * M - 0.6, h: 0.62, margin: 0,
    fontFace: F.display, fontSize: 15, bold: true, color: C.white, valign: 'middle', align: 'center',
  });

  foot(s, { page: 'A4', source: APP_SOURCE });
  s.addNotes('The demo tamper step shows this live. In the appendix: the formula, the signature, and the recomputation.\n\n'
    + 'Key line: "verifyChain() does not trust a stored hash. It recomputes every hash and every Merkle root from scratch, and reports the first block that disagrees."\n\n'
    + 'The live chain at build time: 29 blocks, 29 transactions, verify-chain returned valid: true.');
  return s;
}

function a05Rules(pres) {
  const s = pres.addSlide();
  ground(pres, s, false);
  const y = head(s, {
    kicker: 'Appendix A5',
    title: 'The contract rules, exactly as written.',
    deck: 'Six rules do the work. Each one is a line of code in src/core/chaincode.ts.',
  });

  const rules = [
    ['01', 'QUORUM OF TWO', 'Two approvals are needed before a token is mintable — REQUIRED_ENDORSEMENTS = 2.', C.moss],
    ['02', 'ONE REVIEW PER ORGANISATION', 'A second officer of the same organisation cannot create the quorum. One review per person, one per organisation.', C.moss],
    ['03', '₹150 A TREE', 'BASE_PRICE_INR = 150 for one verified tree. One token equals one tree.', C.forest],
    ['04', 'THE DISCOUNT LADDER', '1 tree → 0 % · 50 → 5 % · 200 → 10 % · 500 → 15 %. The tier is computed in the contract, not in the invoice screen.', C.forest],
    ['05', 'ONE PHOTO, ONE TOKEN', 'The SHA-256 of the photo bytes is indexed. A second planting on the same file is refused at creation, with the first token named.', C.clay],
    ['06', 'NOTHING PRIVATE REACHES THE LEDGER', 'The contact number is dropped before the payload is hashed, before it is stored, and before any read function returns it.', C.clay],
  ];
  const cw = 3.85;
  const ch = 1.72;
  rules.forEach((r, i) => {
    const x = M + (i % 3) * (cw + 0.14);
    const ry = y + 0.12 + Math.floor(i / 3) * (ch + 0.16);
    panel(pres, s, { x, y: ry, w: cw, h: ch, fill: C.panel, border: C.line });
    s.addText(r[0], {
      x: x + 0.2, y: ry + 0.12, w: 0.55, h: 0.3, margin: 0,
      fontFace: F.mono, fontSize: 15, bold: true, color: r[3], valign: 'middle',
    });
    s.addText(r[1], {
      x: x + 0.2, y: ry + 0.46, w: cw - 0.4, h: 0.54, margin: 0,
      fontFace: F.display, fontSize: 12.5, bold: true, color: C.ink, valign: 'top', lineSpacing: 15,
    });
    s.addText(r[2], {
      x: x + 0.2, y: ry + 1.06, w: cw - 0.4, h: 0.6, margin: 0,
      fontFace: F.body, fontSize: 10.5, color: C.muted, valign: 'top', lineSpacing: 14,
    });
  });

  panel(pres, s, { x: M, y: y + 3.86, w: W - 2 * M, h: 0.72, fill: C.forest, border: C.forest });
  s.addText('A rule that lives in code cannot be quietly waived, and cannot be applied differently to the friend of the reviewer.', {
    x: M + 0.3, y: y + 3.92, w: W - 2 * M - 0.6, h: 0.6, margin: 0,
    fontFace: F.display, fontSize: 15, bold: true, color: C.white, valign: 'middle', align: 'center',
  });

  foot(s, { page: 'A5', source: APP_SOURCE });
  s.addNotes('This is the slide to open if the class wants to read the contract rather than the story. '
    + 'Every rule here has a constant and a file location behind it.\n\n'
    + 'The one to dwell on is rule 02: "one review per organisation" was a fix, because without it a single organisation could produce both endorsements by signing with two of its own officers. '
    + 'That is the difference between a quorum of two people and a quorum of two organisations.');
  return s;
}

function a06Evidence(pres) {
  const s = pres.addSlide();
  ground(pres, s, false);
  const y = head(s, {
    kicker: 'Appendix A6',
    title: 'The evidence behind the numbers.',
    deck: 'Every figure in this deck, with its publisher and its date. Anything not on this table did not go on a slide.',
  });

  const rows = [
    ['The claim', 'The figure', 'Publisher', 'Year'],
    ['Carbon majors: 32 producers = half of global CO₂', '50 %', 'InfluenceMap, via The Guardian', '2026'],
    ['Saudi Aramco emissions', '1.7 bn t CO₂', 'Company disclosure / Carbon Majors dataset', '2024'],
    ['ExxonMobil emissions', '610 Mt CO₂', 'Company disclosure / Carbon Majors dataset', '2024'],
    ['Credits issued vs retired, 2025', '294 Mt / 202 Mt', 'MSCI', '2025'],
    ['Credits linked to real additional reductions', '6 % of 89 M', 'West et al., Science (Cambridge + VU Amsterdam)', '2023'],
    ['Kariba project excess credits', '15.2 M (10.3 M used)', 'Verra, reported by Carbonplan', '2025'],
    ['Credits likely over-credited', '80 %+', 'Probst et al., Nature Comms; US GAO-25-107128', '2024–25'],
    ['Carbon Credit Trading Scheme, India', 'in force', 'Ministry of Power / CERC / BEE (ICM registry)', '2023'],
    ['EU Carbon Border Adjustment Mechanism', 'definitive', 'European Commission', 'from 1 Jan 2026'],
    ['CSRD / ESRS E1-6 and E1-7', 'gross, no netting', 'EFRAG / European Commission', '2023–24'],
    ['GreenToken live chain', '29 blocks · 29 txs', 'greentoken-api.aswathas13.workers.dev (GET)', '17 Nov 2026'],
  ];
  const body = rows.map((r, ri) => [
    { text: r[0], options: ri === 0 ? { bold: true, color: C.white, fill: C.forest, fontSize: 10.5 } : { fontSize: 10.5, color: C.ink } },
    { text: r[1], options: ri === 0 ? { bold: true, color: C.white, fill: C.forest, fontSize: 10.5, align: 'center' } : { fontSize: 10.5, bold: true, color: C.forest, align: 'center' } },
    { text: r[2], options: ri === 0 ? { bold: true, color: C.white, fill: C.forest, fontSize: 10 } : { fontSize: 10, color: C.muted } },
    { text: r[3], options: ri === 0 ? { bold: true, color: C.white, fill: C.forest, fontSize: 10, align: 'center' } : { fontSize: 10, color: C.muted, align: 'center' } },
  ]);
  s.addTable(body, {
    x: M, y: y + 0.1, w: W - 2 * M,
    colW: [4.85, 1.85, 4.0, 1.13],
    rowH: 0.36,
    border: { type: 'solid', color: C.line, pt: 1 },
    fill: C.white,
    autoPage: false,
  });

  foot(s, { page: 'A6', source: 'Full citations with URLs and retrieval dates: sources/sources.md, in the deck folder and in the GitHub folder' });
  s.addNotes('Hand this slide to the class if they want to check the work. The full citation list with URLs and retrieval dates is in sources/sources.md.\n\n'
    + 'If a figure is challenged, the honest answer is the row that names its publisher. The Cambridge study is peer-reviewed in Science; the Kariba figure is Verra\'s own admission; the CBAM credit provision is a draft and is labelled as one on slide 5.');
  return s;
}

function a07Scope(pres) {
  const s = pres.addSlide();
  ground(pres, s, false);
  const y = head(s, {
    kicker: 'Appendix A7',
    title: 'The honest scope.',
    deck: 'What is genuinely running, and what the browser is standing in for. Say this out loud before somebody in the room finds it.',
  });

  const col = (x, title, sub, color, items) => {
    panel(pres, s, { x, y: y + 0.12, w: 5.79, h: 3.75, fill: C.panel, border: C.line });
    chip(pres, s, { x: x + 0.24, y: y + 0.32, w: 2.0, h: 0.32, text: title, fill: color, color: C.white, size: 9.5 });
    s.addText(sub, {
      x: x + 0.24, y: y + 0.76, w: 5.3, h: 0.3, margin: 0,
      fontFace: F.body, fontSize: 10.5, italic: true, color: C.muted, valign: 'middle',
    });
    bullets(s, items, { x: x + 0.24, y: y + 1.14, w: 5.3, h: 2.6, size: 11, gap: 8, color: C.ink });
  };

  col(M, 'WHAT IS REAL', 'The part that would survive a hostile audit.', C.moss, [
    'The contract logic: quorum, the review rules, the discount ladder, the terminal states — all enforced in code.',
    'The photo hash: SHA-256 over the actual file bytes. Change one pixel and the hash changes.',
    'The chain: hash-linked blocks with a Merkle root per block, an orderer signature, and a chain verifier that recomputes everything.',
    'The evidence: every token carries a GPS fix, a species, a district and a photo digest.',
    'The privacy rule: the contact number is dropped before anything is hashed.',
  ]);

  col(M + 6.04, 'WHAT IS EMULATED', 'Be straight about this one. It is a demonstration, not a production network.', C.clay, [
    'The peer network: the four organisations are emulated in one browser profile, not four separate nodes with their own MSP certificates.',
    'The ledger store: the chain lives in the browser\'s localStorage, so the presenter\'s copy is the authoritative copy during the demo.',
    'The orderer: a single in-browser key plays the role of the Fabric ordering service.',
    'The carbon science: kg CO₂ per tree is a published species rate multiplied by a count — not a measured sequestration model.',
    'The money: the invoice and settlement are simulated; no payment instrument is involved.',
  ]);

  panel(pres, s, { x: M, y: y + 4.02, w: W - 2 * M, h: 0.72, fill: C.forest, border: C.forest });
  s.addText('A smart contract is only as good as the fact you feed it — and only as honest as the network you run it on. Both of those are design decisions, not accidents.', {
    x: M + 0.3, y: y + 4.08, w: W - 2 * M - 0.6, h: 0.6, margin: 0,
    fontFace: F.display, fontSize: 14.5, bold: true, color: C.white, valign: 'middle', align: 'center',
  });

  foot(s, { page: 'A7', source: 'Read from the deployed build and its source at aswathas/greentoken · the emulated layers are documented in the case study (GreenToken-Case-Study-21CSE435T.pdf)' });
  s.addNotes('This slide protects you. Say it before somebody else finds it.\n\n'
    + '"Everything on the left is real — the rules, the hashing, the chain, the privacy rule. Everything on the right is emulated in one browser: the four organisations are one profile, the orderer is one in-browser key, and the ledger is in localStorage."\n\n'
    + 'Then the line: "A smart contract is only as good as the fact you feed it, and only as honest as the network you run it on."');
  return s;
}

function a08CheatSheet(pres) {
  const s = pres.addSlide();
  ground(pres, s, false);
  const y = head(s, {
    kicker: 'Appendix A8',
    title: 'Demo cheat-sheet.',
    deck: 'Nine steps. If you forget a step, it is on this sheet. If you lose the room, drop steps 2, 3 and 7 and keep going.',
  });

  const rows = [
    ['1', 'Dashboard', '"Nine tokens, 170 trees, 4.7 tonnes — all of it computed, none of it typed in."', 'Read the tiles'],
    ['2', 'Discover', '"A GPS coordinate, a photo hash, a district. A position on the ground, not a claim."', 'Open a token'],
    ['3', 'Invoice', '"The price and the discount ladder live in the contract, not in the interface."', 'Show the tier'],
    ['4', 'Plant', '"One photograph, one hash, one coordinate. The contact number is dropped before hashing."', 'Upload the prepared file'],
    ['5', 'PLANT AGAIN', '"Now let me sell you the same tree twice." → the contract refuses it.', 'Upload the SAME file'],
    ['6', 'Verify', '"Two organisations, one review each. The planter cannot approve their own tree."', 'Approve ×2'],
    ['7', 'Fund + settle', '"Funding and settlement are contract transitions, not button presses."', 'Fund, then settle'],
    ['8', 'Ledger Explorer', '"Change one transaction and the fingerprint changes. Red names the block."', 'Tamper, then restore'],
    ['9', 'Leaderboard', '"Nobody can inflate their own carbon number. You can only plant more trees."', 'Show the board'],
  ];
  const body = rows.map((r, i) => [
    { text: r[0], options: { bold: true, fontSize: 11, color: C.white, fill: i === 4 ? C.clay : C.forest, align: 'center' } },
    { text: r[1], options: { bold: true, fontSize: 10.5, color: i === 4 ? C.clay : C.ink } },
    { text: r[2], options: { fontSize: 10, color: C.muted } },
    { text: r[3], options: { fontSize: 10, color: C.forest, bold: true } },
  ]);
  s.addTable(body, {
    x: M, y: y + 0.1, w: W - 2 * M,
    colW: [0.42, 1.62, 7.24, 2.55],
    rowH: 0.36,
    border: { type: 'solid', color: C.line, pt: 1 },
    fill: C.white,
    autoPage: false,
  });

  panel(pres, s, { x: M, y: y + 3.76, w: W - 2 * M, h: 0.86, fill: C.forest, border: C.forest });
  s.addText('THE NINE NUMBERS', {
    x: M + 0.25, y: y + 3.82, w: 2.0, h: 0.26, margin: 0,
    fontFace: F.body, fontSize: 9, bold: true, charSpacing: 1.6, color: C.mint, valign: 'middle',
  });
  s.addText('9 tokens   ·   3 verified   ·   4 funded   ·   1 pending   ·   1 rejected   ·   170 trees   ·   4 743 kg CO₂   ·   ₹5 550   ·   29 blocks', {
    x: M + 0.25, y: y + 4.1, w: W - 2 * M - 0.5, h: 0.44, margin: 0,
    fontFace: F.mono, fontSize: 11, bold: true, color: C.white, valign: 'middle', align: 'center',
  });

  foot(s, { page: 'A8', source: 'Ledger figures read from the live API on 17 November 2026 (GET only) · the numbers drift as people plant, so read the screen, not this sheet' });
  s.addNotes('The paper copy of this slide is the safety net. Keep it on the lectern.\n\n'
    + 'Three contingencies, printed at the bottom of the one-page PDF:\n'
    + '1. No network → the offline pack (screenshots + PDF + narration) carries the demo.\n'
    + '2. Geolocation refused → type the coordinates by hand, or use the prepared photo file for both plantings (but never "Generate sample proof" for step 5 — it mints a new hash every time).\n'
    + '3. Map tiles blank → the markers still plot; the tokens are the evidence, not the map.\n\n'
    + 'And the timing: the full run is six to seven minutes. Trimmed to four: keep 1, 4, 5, 6, 8, 9 and say one line for 2, 3 and 7.');
  return s;
}

module.exports = [a01Principles, a02StateMachine, a03Actors, a04HashChain, a05Rules, a06Evidence, a07Scope, a08CheatSheet];
