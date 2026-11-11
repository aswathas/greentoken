const path = require('path');
const { CREAM, SAGE, DEEP, DARKEST, MID, WHITE, FONT, M, pageNum, heading, panel, footer, pill } = require('./_common');

const SHOTS = path.join(__dirname, '..', '..', 'docs', 'screenshots');

/** Slide 13 — Live demo: dashboard */
function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };
  heading(slide, theme, 'Live demo  ·  1 of 4', 'The consortium at a glance');

  const notes = [
    ['9 tokens on chain', 'Every token is a real transaction with a hash and an endorser — seeded by replaying the actual chaincode, not hand-written rows.'],
    ['170 trees · 4.7 t CO₂', 'Estimated sequestration is derived from species and tree count inside the contract.'],
    ['₹5,550 settled', 'Two invoices settled; the third is issued and awaiting settlement.'],
    ['29 blocks, chain verified', 'The integrity ring re-hashes the entire chain on every render — it is not a hard-coded badge.'],
  ];

  notes.forEach((n, i) => {
    const y = 1.24 + i * 0.9;
    slide.addShape('ellipse', { x: M, y: y + 0.05, w: 0.11, h: 0.11, fill: { color: MID }, line: { color: MID, width: 0 } });
    slide.addText(n[0], {
      x: M + 0.2, y: y - 0.04, w: 2.5, h: 0.24,
      fontSize: 11, bold: true, color: theme.primary, fontFace: FONT, margin: 0,
    });
    slide.addText(n[1], {
      x: M + 0.2, y: y + 0.2, w: 2.55, h: 0.58,
      fontSize: 8.5, color: MID, fontFace: FONT, margin: 0,
    });
  });

  slide.addImage({
    path: path.join(SHOTS, '01-dashboard.png'),
    x: 3.42, y: 1.2, w: 6.03, h: 3.77,
  });
  slide.addShape('rect', {
    x: 3.42, y: 1.2, w: 6.03, h: 3.77,
    fill: { type: 'none' }, line: { color: SAGE, width: 1 },
  });

  footer(slide, 'Deployed live at greentoken-7gc.pages.dev  ·  identity switcher in the top-right lets you act as any organisation.');
  pageNum(slide, 13);
  return slide;
}

module.exports = { createSlide };
