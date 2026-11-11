/**
 * ACT 3 — HYPERLEDGER FABRIC, TAUGHT
 * Slides 16–22. Six components, the hash chain, the signature, the six-phase
 * lifecycle, endorsement and quorum, and the two storage layers.
 */
const T = require('./_theme');

function build(pres) {
  const slides = [];

  // ------------------------------------------------------------ 16 act break
  {
    const s = pres.addSlide();
    T.actBreak(s, 'Act three', 'Hyperledger Fabric, taught',
      'Six components. One idea underneath them all: a record nobody can rewrite without being caught.', 16);
    slides.push(s);
  }

  // ------------------------------------------------------------- 17 the parts
  {
    const s = pres.addSlide();
    s.background = { color: T.PAPER };
    T.head(s, 'The vocabulary', 'Six components, and what each is for');
    const parts = [
      ['MSP', 'passport office', 'One organisation’s identity directory: who holds which certificate, and what they may do.'],
      ['Channel', 'private meeting room', 'One ledger plus its ordering service, and the rules that govern both.'],
      ['Peer', 'the office keeping the record', 'Holds the block history and current values, runs the chaincode, signs approvals.'],
      ['Orderer', 'the postman', 'Puts transactions in order and posts the blocks. It never checks whether they are correct.'],
      ['Chaincode', 'the rulebook', 'The business logic. Must give the same answer every time it is asked.'],
      ['Gateway', 'the front desk', 'One door for the client: submit, query, wait for commit, listen for events.'],
    ];
    parts.forEach((p, i) => {
      const x = T.M + (i % 3) * 3.03;
      const y = 1.2 + Math.floor(i / 3) * 1.78;
      T.panel(s, x, y, 2.87, 1.62, { fill: T.MIST });
      s.addShape('rect', { x, y, w: 2.87, h: 0.05, fill: { color: T.ACC }, line: { color: T.ACC, width: 0 } });
      s.addText(p[0], { x: x + 0.18, y: y + 0.16, w: 2.5, h: 0.3, fontSize: 13, bold: true, color: T.DEEP, fontFace: T.FONT, margin: 0 });
      s.addText(p[1], { x: x + 0.18, y: y + 0.48, w: 2.5, h: 0.24, fontSize: 9, italic: true, color: T.ACC, fontFace: T.FONT, margin: 0 });
      T.para(s, x + 0.18, y + 0.78, 2.5, 0.76, p[2], { size: 9.2, color: '48654F', ls: 1.08 });
    });
    T.pageNum(s, 17);
    slides.push(s);
  }

  // ---------------------------------------------------------- 18 the chain
  {
    const s = pres.addSlide();
    s.background = { color: T.PAPER };
    T.head(s, 'The foundation', 'The hash chain: tamper-*evidence*');
    // blocks
    for (let i = 0; i < 3; i++) {
      const x = T.M + i * 2.35;
      T.panel(s, x, 1.3, 2.05, 1.28, { fill: T.MIST, shadow: false });
      s.addText('Block ' + (i + 1), { x: x + 0.16, y: 1.42, w: 1.7, h: 0.26, fontSize: 10.5, bold: true, color: T.DEEP, fontFace: T.FONT, margin: 0 });
      s.addText('tx hashes', { x: x + 0.16, y: 1.72, w: 1.7, h: 0.2, fontSize: 8.5, color: '48654F', fontFace: T.FONT, margin: 0 });
      s.addText('merkleRoot  a91f…', { x: x + 0.16, y: 1.94, w: 1.7, h: 0.2, fontSize: 8.5, color: '48654F', fontFace: T.FONT, margin: 0 });
      s.addText('prevHash  ' + (i === 0 ? '0000…' : (i === 1 ? 'a91f…' : '7d03…')), { x: x + 0.16, y: 2.16, w: 1.7, h: 0.2, fontSize: 8.5, color: '48654F', fontFace: T.FONT, margin: 0 });
      if (i < 2) {
        s.addShape('rightArrow', { x: x + 2.08, y: 1.82, w: 0.22, h: 0.16, fill: { color: T.SAGE }, line: { color: T.SAGE, width: 0.5 } });
      }
    }
    T.para(s, T.M, 2.72, 6.7, 0.4, 'Each block carries the previous block’s fingerprint.', { size: 10, italic: true, color: '48654F' });

    T.barPanel(s, T.M, 3.12, 4.25, 1.6, T.ACC, { fill: T.MIST2, line: 'C9E3D4' });
    T.label(s, T.M + 0.2, 3.26, 3.9, 'What it buys');
    T.para(s, T.M + 0.2, 3.5, 3.9, 1.1,
      'Change one transaction in block 2 and block 2’s fingerprint changes — so block 3’s prevHash is now wrong, so block 3’s fingerprint changes, and the change cascades to the tip. Nobody can hide an edit.',
      { size: 9.8, color: '2C4A36', ls: 1.12 });

    T.barPanel(s, 5.15, 3.12, 4.3, 1.6, T.CLAY, { fill: T.CLAYBG, line: 'F0D8CC' });
    T.label(s, 5.35, 3.26, 3.9, 'What it does not buy', T.CLAY);
    T.para(s, 5.35, 3.5, 3.9, 1.1,
      'It does not stop the edit. An attacker who controls the database can recompute every fingerprint and the chain looks perfect again. The chain tells you <b>where</b> history was changed. Something else must make it <b>impossible</b>.',
      { size: 9.8, color: '5A3A28', ls: 1.12 });
    T.pageNum(s, 18);
    slides.push(s);
  }

  // -------------------------------------------------------- 19 the signature
  {
    const s = pres.addSlide();
    s.background = { color: T.PAPER };
    T.head(s, 'The crux', 'The signature: making it unforgeable');
    const steps = [
      ['Block header', 'prevHash · merkleRoot · number · timestamp'],
      ['Orderer signs it', 'ECDSA P-256. The private key never leaves its host.'],
      ['Signature travels with it', 'Anyone can verify. Nobody but the holder can create one.'],
    ];
    steps.forEach((st, i) => {
      const x = T.M + i * 3.03;
      T.panel(s, x, 1.25, 2.87, 1.2, { fill: i === 2 ? T.MIST2 : T.MIST, line: i === 2 ? 'C9E3D4' : T.LINE });
      s.addText(st[0], { x: x + 0.18, y: 1.38, w: 2.5, h: 0.28, fontSize: 11, bold: true, color: T.DEEP, fontFace: T.FONT, margin: 0 });
      T.para(s, x + 0.18, 1.72, 2.5, 0.62, st[1], { size: 9.2, color: '48654F', ls: 1.08 });
      if (i < 2) T.chevron(s, x + 2.9, 1.78);
    });

    T.panel(s, T.M, 2.72, 8.9, 1.5, { fill: T.MIST });
    T.label(s, T.M + 0.24, 2.9, 8.4, 'Now the attacker is stuck — and here is precisely why');
    T.bullets(s, T.M + 0.24, 3.18, 8.4, [
      'They can still recompute every hash. That was never the defence.',
      'But the new block header needs the orderer’s signature over it.',
      'And the altered transaction needs each endorser’s signature over it.',
      'Neither can be produced without the matching private keys.',
    ], { size: 9.8, gap: 0.24, dot: T.ACC });

    T.barPanel(s, T.M, 4.38, 8.9, 0.68, T.ACC, { fill: T.MIST2, line: 'C9E3D4' });
    T.para(s, T.M + 0.24, 4.5, 8.4, 0.5,
      '<b>Hashes tell you where history was changed. Signatures make it impossible to change history unnoticed. You need both.</b>',
      { size: 11, color: T.DEEP });
    T.pageNum(s, 19);
    slides.push(s);
  }

  // ---------------------------------------------------------- 20 the lifecycle
  {
    const s = pres.addSlide();
    s.background = { color: T.PAPER };
    T.head(s, 'The lifecycle', 'Six phases, and the surprise inside them');
    const ph = [
      ['Proposal', 'the client asks'],
      ['Endorsement', 'peers run the code and sign'],
      ['Ordering', 'the postman sequences'],
      ['Validation', 'every peer checks'],
      ['Commit', 'peers append'],
      ['Notification', 'the client is told'],
    ];
    ph.forEach((p, i) => {
      const x = T.M + i * 1.51;
      const hot = i === 1 || i === 3;
      T.panel(s, x, 1.28, 1.38, 1.12, { fill: hot ? T.MIST2 : T.PAPER, line: hot ? 'C9E3D4' : T.LINE });
      s.addText((i + 1) + '.', { x: x + 0.1, y: 1.36, w: 0.3, h: 0.26, fontSize: 10, bold: true, color: hot ? T.ACC : T.SAGE, fontFace: T.FONT, margin: 0 });
      s.addText(p[0], { x: x + 0.1, y: 1.6, w: 1.18, h: 0.28, fontSize: 9.5, bold: true, color: T.DEEP, fontFace: T.FONT, margin: 0 });
      s.addText(p[1], { x: x + 0.1, y: 1.9, w: 1.18, h: 0.44, fontSize: 8, color: '48654F', fontFace: T.FONT, margin: 0, lineSpacingMultiple: 1.02 });
      if (i < 5) T.chevron(s, x + 1.39, 1.78, hot ? T.ACC : T.SAGE);
    });

    T.barPanel(s, T.M, 2.66, 8.9, 1.16, T.ACC, { fill: T.MIST2, line: 'C9E3D4' });
    T.label(s, T.M + 0.24, 2.82, 8.4, 'The bit that surprises everyone');
    T.para(s, T.M + 0.24, 3.06, 8.4, 0.7,
      '<b>The code runs at phase 2, not phase 5.</b> By commit time the business logic has already executed; the peers are only checking that the right organisations agreed. That is why Fabric chaincode may not read the wall clock, generate randomness, or call out to the network — if two peers could reach different answers, the network would have two truths.',
      { size: 9.8, color: '2C4A36', ls: 1.1 });

    T.panel(s, T.M, 3.98, 4.35, 1.1, { fill: T.MIST });
    T.label(s, T.M + 0.2, 4.12, 3.9, 'Why the orderer is not trusted');
    T.para(s, T.M + 0.2, 4.36, 4.0, 0.66,
      'It decides sequence, never meaning. If it gave two peers different views, the endorsement policy and the validation phase would reject the block. Trust is moved out of the sequencer and into the protocol.',
      { size: 9.4, color: '48654F', ls: 1.08 });
    T.panel(s, 5.15, 3.98, 4.3, 1.1, { fill: T.MIST });
    T.label(s, 5.35, 4.12, 3.9, 'Two layers of storage');
    T.para(s, 5.35, 4.36, 3.9, 0.66,
      'The <b>transaction log</b> is append-only and hash-linked — the truth. <b>World state</b> is a key–value cache of current values, rebuilt from the log. Queries hit the cache; audits read the log.',
      { size: 9.4, color: '48654F', ls: 1.08 });
    T.pageNum(s, 20);
    slides.push(s);
  }

  // ------------------------------------------------------- 21 endorsement etc.
  {
    const s = pres.addSlide();
    s.background = { color: T.PAPER };
    T.head(s, 'The rules', 'Endorsement, quorum and determinism');
    T.panel(s, T.M, 1.24, 4.35, 1.86, { fill: T.MIST });
    T.label(s, T.M + 0.2, 1.4, 4.0, 'Why two, and why two different ones');
    T.para(s, T.M + 0.2, 1.64, 4.0, 1.4,
      'One approval <b>is</b> the trust problem. If one organisation can approve on its own, trust has not been removed — it has only been moved from the database owner to the approver. Quorum of two, drawn from two distinct member identities, makes the approval <b>independent</b> rather than merely <b>signed</b>.',
      { size: 9.8, color: '48654F', ls: 1.12 });

    T.panel(s, 5.15, 1.24, 4.3, 1.86, { fill: T.MIST });
    T.label(s, 5.35, 1.4, 3.9, 'The policy says who. The contract says how.');
    T.para(s, 5.35, 1.64, 3.9, 1.4,
      'Fabric’s endorsement policy is <b>configuration</b>: <span class="mono">AND(\'ForestDeptMSP\',\'AuditorMSP\')</span> — these organisations must sign. It cannot express <em>two, and not the same person twice</em>, so those rules live in the chaincode, where they can be tested.',
      { size: 9.8, color: '48654F', ls: 1.12 });

    T.barPanel(s, T.M, 3.28, 8.9, 1.62, T.ACC, { fill: T.MIST2, line: 'C9E3D4' });
    T.label(s, T.M + 0.24, 3.44, 8.4, 'And there is a third rule people forget');
    T.para(s, T.M + 0.24, 3.68, 8.4, 1.1,
      '<b>The endorsers must be able to agree.</b> That is the determinism requirement arriving for the third time. Every peer that evaluates the same proposal must produce the same answer, or there is no transaction to commit. It is why our contract takes its timestamp from the host’s block time rather than from <span class="mono">Date.now()</span> — every endorser has to see the same clock.',
      { size: 10.2, color: '2C4A36', ls: 1.12 });
    T.pageNum(s, 21);
    slides.push(s);
  }

  // ------------------------------------------------------------- 22 privacy
  {
    const s = pres.addSlide();
    s.background = { color: T.PAPER };
    T.head(s, 'Privacy', 'Two answers, and a deliberate choice');
    T.panel(s, T.M, 1.26, 4.35, 2.5, { fill: T.MIST });
    T.label(s, T.M + 0.2, 1.42, 4.0, 'Fabric’s answer — private data collections');
    T.para(s, T.M + 0.2, 1.68, 4.0, 1.5,
      'The value is distributed to the authorised members. Everyone else sees only its hash — which stays on-chain, so members can still prove the value was never altered. Fabric v2.5 can go further: <span class="mono">PurgePrivateData</span> deletes the value and its history while keeping the hash as evidence.',
      { size: 9.8, color: '48654F', ls: 1.12 });
    T.para(s, T.M + 0.2, 3.22, 4.0, 0.4,
      'Best when a downstream party needs the value itself.',
      { size: 9.4, italic: true, color: T.ACC, ls: 1.08 });

    T.panel(s, 5.15, 1.26, 4.3, 2.5, { fill: T.MIST });
    T.label(s, 5.35, 1.42, 3.9, 'Our answer — never write it at all');
    T.para(s, 5.35, 1.68, 3.9, 1.5,
      'The planter’s contact number is stripped at the chaincode boundary — before it is hashed, before it is stored, before it is emitted. The <span class="mono">TreeToken</span> type has no field for it, so there is nothing in the database to disclose.',
      { size: 9.8, color: '48654F', ls: 1.12 });
    T.para(s, 5.35, 3.22, 3.9, 0.4,
      'Stronger for this field — and a different mechanism, honestly described.',
      { size: 9.4, italic: true, color: T.ACC, ls: 1.08 });

    T.barPanel(s, T.M, 3.94, 8.9, 1.1, T.CLAY, { fill: T.CLAYBG, line: 'F0D8CC' });
    T.label(s, T.M + 0.24, 4.08, 8.4, 'And what is deliberately not private', T.CLAY);
    T.para(s, T.M + 0.24, 4.32, 8.4, 0.64,
      '<b>Reads are open.</b> Anyone may look up any token, its coordinates, its photo digest and its endorsements. That is the point: a carbon registry has to be checkable by the buyers and by the public, without asking permission. Only <b>writes</b> are role-gated.',
      { size: 10, color: '5A3A28', ls: 1.1 });
    T.pageNum(s, 22);
    slides.push(s);
  }

  return slides;
}

module.exports = { build };
