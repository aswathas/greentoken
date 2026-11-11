const { CREAM, SAGE, DEEP, DARKEST, MID, WHITE, FONT, M, pageNum, heading, panel, footer, numDot, arrow } = require('./_common');

/** Slide 8 — Token lifecycle */
function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };
  heading(slide, theme, 'The token lifecycle', 'Plant → prove → verify → mint → fund → settle');

  const steps = [
    { t: 'Plant', d: 'Planter submits species, count, geo-stamp and a photo. Both are hashed.', tag: 'PlantTree' },
    { t: 'Verify', d: 'Two reviewers from two different organisations inspect the proof and sign it.', tag: 'VerifyPlanting' },
    { t: 'Mint', d: 'At quorum of 2 the token becomes VERIFIED and mintable as a credit.', tag: 'state change' },
    { t: 'Discover', d: 'Funders browse verified tokens on the map with real coordinates.', tag: 'read model' },
    { t: 'Fund', d: 'One invoice per basket; the bulk discount ladder is applied in-contract.', tag: 'FundTokens' },
    { t: 'Settle', d: 'Funds are released to the planter and recorded on chain.', tag: 'SettleFunding' },
  ];

  const y = 1.55;
  const h = 1.9;
  steps.forEach((s, i) => {
    const x = M + i * 1.5;
    panel(slide, x, y, 1.38, h, { fill: WHITE, line: SAGE });
    numDot(slide, x + 0.12, y + 0.14, i + 1, { fill: DEEP });
    slide.addText(s.t, {
      x: x + 0.12, y: y + 0.56, w: 1.14, h: 0.28,
      fontSize: 13, bold: true, color: theme.primary, fontFace: FONT, margin: 0,
    });
    slide.addText(s.d, {
      x: x + 0.12, y: y + 0.86, w: 1.14, h: 0.78,
      fontSize: 8.5, color: MID, fontFace: FONT, margin: 0,
    });
    slide.addShape('rect', { x: x + 0.12, y: y + h - 0.32, w: 1.14, h: 0.2, fill: { color: CREAM }, line: { color: SAGE, width: 0.5 } });
    slide.addText(s.tag, {
      x: x + 0.12, y: y + h - 0.32, w: 1.14, h: 0.2,
      fontSize: 7, color: DEEP, align: 'center', valign: 'middle', fontFace: FONT, margin: 0,
    });
    if (i < steps.length - 1) arrow(slide, x + 1.38, y + 0.24, 0.12, MID);
  });

  // State machine strip
  const states = [
    ['PENDING', 'submitted, awaiting review', SAGE],
    ['VERIFIED', 'quorum reached — mintable', DEEP],
    ['FUNDED', 'bought and settled', DARKEST],
  ];
  states.forEach((st, i) => {
    const x = M + i * 3.0;
    panel(slide, x, 3.78, 2.86, 0.62, { fill: WHITE, line: st[2], lineWidth: 1.1 });
    slide.addText(st[0], { x: x + 0.14, y: 3.86, w: 1.1, h: 0.24, fontSize: 11, bold: true, color: st[2], fontFace: FONT, margin: 0 });
    slide.addText(st[1], { x: x + 0.14, y: 4.1, w: 2.6, h: 0.22, fontSize: 8.5, color: MID, fontFace: FONT, margin: 0 });
    if (i < 2) arrow(slide, x + 2.86, 4.02, 0.14, MID);
  });

  slide.addText('REJECTED — a reviewer may reject a proof; rejection is final and the token can never be funded.', {
    x: M, y: 4.58, w: 8.9, h: 0.26,
    fontSize: 9.5, italic: true, color: MID, fontFace: FONT, margin: 0, align: 'center',
  });

  footer(slide, 'Every transition is a chaincode function call — the contract, not the UI, decides what is legal.');
  pageNum(slide, 8);
  return slide;
}

module.exports = { createSlide };
