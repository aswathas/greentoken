const { CREAM, SAGE, DEEP, DARKEST, MID, WHITE, FONT, M, pageNum, heading, panel, footer } = require('./_common');

/** Slide 2 — Agenda */
function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };
  heading(slide, theme, 'Contents', 'What this presentation covers');

  const items = [
    ['01', 'The problem', 'Why tree-planting claims are cheap to fake and expensive to trust'],
    ['02', 'The solution', 'GreenToken — proof, trust and money in one ledger'],
    ['03', 'Unit 5 coverage', 'How the project maps onto the prescribed use cases'],
    ['04', 'Architecture', 'Three targets, one smart contract'],
    ['05', 'The smart contract', 'Assets, functions, events and access control'],
    ['06', 'Crypto & privacy', 'Tamper-evidence and role-based visibility'],
    ['07', 'Live demo', 'Plant → verify → fund → settle, and the tamper test'],
    ['08', 'Results & scope', 'Measured outcomes, limits and what comes next'],
  ];

  items.forEach((it, i) => {
    const col = i < 4 ? 0 : 1;
    const row = i % 4;
    const x = M + col * 4.55;
    const y = 1.42 + row * 0.92;
    panel(slide, x, y, 4.25, 0.78, { fill: WHITE, line: SAGE });
    slide.addText(it[0], {
      x: x + 0.16, y: y + 0.16, w: 0.5, h: 0.46,
      fontSize: 20, bold: true, color: SAGE, fontFace: FONT, margin: 0, valign: 'middle',
    });
    slide.addText(it[1], {
      x: x + 0.72, y: y + 0.13, w: 3.4, h: 0.26,
      fontSize: 12.5, bold: true, color: theme.primary, fontFace: FONT, margin: 0,
    });
    slide.addText(it[2], {
      x: x + 0.72, y: y + 0.4, w: 3.4, h: 0.3,
      fontSize: 9.5, color: MID, fontFace: FONT, margin: 0,
    });
  });

  slide.addShape('rect', { x: M, y: 5.02, w: 8.9, h: 0.02, fill: { color: SAGE }, line: { color: SAGE, width: 0 } });
  footer(slide, 'GreenToken  ·  Unit 5 course project  ·  Blockchain Technology with Hyperledger Fabric');
  pageNum(slide, 2);
  return slide;
}

module.exports = { createSlide };
