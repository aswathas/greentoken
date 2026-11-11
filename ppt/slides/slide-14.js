const path = require('path');
const { CREAM, SAGE, DEEP, DARKEST, MID, WHITE, FONT, M, pageNum, heading, panel, footer } = require('./_common');

const SHOTS = path.join(__dirname, '..', '..', 'docs', 'screenshots');

/** Slide 14 — Live demo: discovery and verification */
function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };
  heading(slide, theme, 'Live demo  ·  2 of 4', 'Funders find real plantings');

  // Left image — discovery
  slide.addImage({
    path: path.join(SHOTS, '02-discover-map.png'),
    x: M, y: 1.32, w: 4.38, h: 2.74,
  });
  slide.addShape('rect', { x: M, y: 1.32, w: 4.38, h: 2.74, fill: { type: 'none' }, line: { color: SAGE, width: 1 } });

  // Right image — verification queue
  slide.addImage({
    path: path.join(SHOTS, '05-verification-queue.png'),
    x: 5.08, y: 1.32, w: 4.38, h: 2.74,
  });
  slide.addShape('rect', { x: 5.08, y: 1.32, w: 4.38, h: 2.74, fill: { type: 'none' }, line: { color: SAGE, width: 1 } });

  // Captions
  slide.addText('DISCOVER  —  every verified token carries a GPS coordinate, a photo hash and a species rate. A funder can filter by district or species and see exactly what they are buying.', {
    x: M, y: 4.14, w: 4.38, h: 0.66,
    fontSize: 8.5, color: MID, fontFace: FONT, margin: 0,
  });
  slide.addText('VERIFY  —  the queue shows the geo-stamp accuracy, the photo hash and how many of the two required endorsements are in. The Forest Department and the Independent Auditor sign separately.', {
    x: 5.08, y: 4.14, w: 4.38, h: 0.66,
    fontSize: 8.5, color: MID, fontFace: FONT, margin: 0,
  });

  footer(slide, 'A rejected proof stays on the ledger — rejection is evidence too, and the token can never be funded.');
  pageNum(slide, 14);
  return slide;
}

module.exports = { createSlide };
