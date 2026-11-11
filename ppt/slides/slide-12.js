const { CREAM, SAGE, DEEP, DARKEST, MID, WHITE, FONT, M, pageNum, heading, panel, footer } = require('./_common');

/** Slide 12 — Trade finance: invoices and bulk discounting */
function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };
  heading(slide, theme, 'Trade finance', 'Invoices, bulk discounting and settlement');

  // Left: discount ladder
  panel(slide, M, 1.28, 4.35, 2.42, { fill: WHITE, line: SAGE });
  slide.addText('THE DISCOUNT LADDER', {
    x: M + 0.18, y: 1.42, w: 3.9, h: 0.22,
    fontSize: 8.5, bold: true, charSpacing: 1.2, color: MID, fontFace: FONT, margin: 0,
  });
  const ladder = [
    ['1+', '0%', 12],
    ['50+', '5%', 32],
    ['200+', '10%', 60],
    ['500+', '15%', 88],
  ];
  ladder.forEach((l, i) => {
    const y = 1.72 + i * 0.46;
    slide.addText(l[0] + ' units', {
      x: M + 0.18, y, w: 0.8, h: 0.24, fontSize: 9.5, bold: true, color: theme.primary, fontFace: FONT, margin: 0,
    });
    slide.addShape('rect', { x: M + 1.05, y: y + 0.04, w: 2.1, h: 0.16, fill: { color: CREAM }, line: { color: CREAM, width: 0 } });
    slide.addShape('rect', { x: M + 1.05, y: y + 0.04, w: (2.1 * l[2]) / 100, h: 0.16, fill: { color: DEEP }, line: { color: DEEP, width: 0 } });
    slide.addText(l[1], {
      x: M + 3.25, y, w: 0.85, h: 0.24, fontSize: 10, bold: true, color: DEEP, align: 'right', fontFace: FONT, margin: 0,
    });
  });
  slide.addText('Applied inside FundTokens — the client cannot choose its own discount.', {
    x: M + 0.18, y: 3.4, w: 3.9, h: 0.22,
    fontSize: 8.5, italic: true, color: MID, fontFace: FONT, margin: 0,
  });

  // Right: worked example
  panel(slide, 5.22, 1.28, 4.23, 2.42, { fill: DEEP, line: DEEP });
  slide.addText('WORKED EXAMPLE  ·  BULK PURCHASE', {
    x: 5.4, y: 1.42, w: 3.9, h: 0.22,
    fontSize: 8.5, bold: true, charSpacing: 1.2, color: SAGE, fontFace: FONT, margin: 0,
  });
  const ex = [
    ['70 trees bought', '2 verified batches'],
    ['× ₹150 per tree', 'gross ₹10,500'],
    ['− 5% bulk discount', '− ₹525'],
    ['Net payable', '₹9,975'],
  ];
  ex.forEach((e, i) => {
    const y = 1.74 + i * 0.44;
    const strong = i === 3;
    slide.addText(e[0], {
      x: 5.4, y, w: 2.1, h: 0.26,
      fontSize: strong ? 11 : 9.5, bold: strong, color: CREAM, fontFace: FONT, margin: 0, valign: 'middle',
    });
    slide.addText(e[1], {
      x: 7.5, y, w: 1.8, h: 0.26,
      fontSize: strong ? 12 : 9.5, bold: strong, color: strong ? SAGE : CREAM,
      align: 'right', fontFace: FONT, margin: 0, valign: 'middle',
    });
    if (i === 2) slide.addShape('line', { x: 5.4, y: y + 0.36, w: 3.9, h: 0, line: { color: SAGE, width: 0.75 } });
  });

  // Bottom: three finance concepts
  const concepts = [
    ['Provenance-priced', 'A token can only be funded after its provenance is verified, so the finance follows the evidence.'],
    ['Basket invoices', 'One invoice covers many tokens from many planters — one settlement, one audit trail.'],
    ['Settlement on chain', 'Settlement marks the invoice settled and makes each planter\u2019s share queryable. The bank transfer itself is out of scope.'],
  ];
  concepts.forEach((c, i) => {
    const x = M + i * 3.0;
    panel(slide, x, 3.9, 2.86, 1.06, { fill: WHITE, line: SAGE });
    slide.addText(c[0], {
      x: x + 0.16, y: 4.02, w: 2.56, h: 0.24,
      fontSize: 10.5, bold: true, color: DEEP, fontFace: FONT, margin: 0,
    });
    slide.addText(c[1], {
      x: x + 0.16, y: 4.28, w: 2.56, h: 0.6,
      fontSize: 8.5, color: MID, fontFace: FONT, margin: 0,
    });
  });

  footer(slide, 'Unit 5 use case 1 (iii) trade & supply chain finance and (iv) invoice management with discounting.');
  pageNum(slide, 12);
  return slide;
}

module.exports = { createSlide };
