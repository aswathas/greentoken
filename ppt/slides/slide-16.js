const path = require('path');
const { CREAM, SAGE, DEEP, DARKEST, MID, WHITE, FONT, M, pageNum, heading, panel, footer } = require('./_common');

const SHOTS = path.join(__dirname, '..', '..', 'docs', 'screenshots');

/** Slide 16 — Live demo: ledger explorer and tamper detection */
function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };
  heading(slide, theme, 'Live demo  ·  4 of 4', 'Proving the ledger cannot be edited');

  // Left image — ledger explorer
  slide.addImage({
    path: path.join(SHOTS, '09-ledger-explorer.png'),
    x: M, y: 1.32, w: 4.38, h: 2.74,
  });
  slide.addShape('rect', { x: M, y: 1.32, w: 4.38, h: 2.74, fill: { type: 'none' }, line: { color: SAGE, width: 1 } });

  // Right image — tamper detected
  slide.addImage({
    path: path.join(SHOTS, '10-tamper-detected.png'),
    x: 5.08, y: 1.32, w: 4.38, h: 2.74,
  });
  slide.addShape('rect', { x: 5.08, y: 1.32, w: 4.38, h: 2.74, fill: { type: 'none' }, line: { color: SAGE, width: 1 } });

  slide.addText('EXPLORE  —  every block shows its previous hash, its Merkle root and the ordering service’s signature. Expanding a block shows the transactions, their payload hashes and who endorsed them.', {
    x: M, y: 4.14, w: 4.38, h: 0.66,
    fontSize: 8.5, color: MID, fontFace: FONT, margin: 0,
  });
  slide.addText('TAMPER  —  one click rewrites a signed transaction. The verifier recomputes every hash from scratch, names the broken block and explains exactly what no longer matches. “Restore chain” re-signs it.', {
    x: 5.08, y: 4.14, w: 4.38, h: 0.66,
    fontSize: 8.5, color: MID, fontFace: FONT, margin: 0,
  });

  footer(slide, 'This is the single best slide for the examiner: the property is executed, not asserted.');
  pageNum(slide, 16);
  return slide;
}

module.exports = { createSlide };
