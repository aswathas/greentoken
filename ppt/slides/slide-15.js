const path = require('path');
const { CREAM, SAGE, DEEP, DARKEST, MID, WHITE, FONT, M, pageNum, heading, panel, footer } = require('./_common');

const SHOTS = path.join(__dirname, '..', '..', 'docs', 'screenshots');

/** Slide 15 — Live demo: funding and settlement */
function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };
  heading(slide, theme, 'Live demo  ·  3 of 4', 'Funding a basket, then settling the invoice');

  // Left image — funding basket
  slide.addImage({
    path: path.join(SHOTS, '06-funding-basket.png'),
    x: M, y: 1.32, w: 4.38, h: 2.74,
  });
  slide.addShape('rect', { x: M, y: 1.32, w: 4.38, h: 2.74, fill: { type: 'none' }, line: { color: SAGE, width: 1 } });

  // Right image — invoices
  slide.addImage({
    path: path.join(SHOTS, '07-invoices.png'),
    x: 5.08, y: 1.32, w: 4.38, h: 2.74,
  });
  slide.addShape('rect', { x: 5.08, y: 1.32, w: 4.38, h: 2.74, fill: { type: 'none' }, line: { color: SAGE, width: 1 } });

  slide.addText('FUND  —  selected tokens go into one basket. The contract prices the basket, applies the bulk discount and issues a single invoice covering every token and every planter in it.', {
    x: M, y: 4.14, w: 4.38, h: 0.66,
    fontSize: 8.5, color: MID, fontFace: FONT, margin: 0,
  });
  slide.addText('SETTLE  —  each invoice keeps the gross amount, the discount and the net side by side, and lists the tokens it covers. Settling marks it settled on chain and makes each planter\u2019s share queryable.', {
    x: 5.08, y: 4.14, w: 4.38, h: 0.66,
    fontSize: 8.5, color: MID, fontFace: FONT, margin: 0,
  });

  footer(slide, 'Only VERIFIED tokens can enter a basket — the contract rejects the whole invoice if a single token is not eligible.');
  pageNum(slide, 15);
  return slide;
}

module.exports = { createSlide };
