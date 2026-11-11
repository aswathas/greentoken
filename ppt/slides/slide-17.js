const { CREAM, SAGE, DEEP, DARKEST, MID, WHITE, FONT, M, pageNum, heading, panel, footer } = require('./_common');

/** Slide 17 — Results measured in the running demo */
function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };
  heading(slide, theme, 'Results', 'What the running demo actually produced');

  const stats = [
    ['9', 'tokens minted', 'from 9 planting submissions'],
    ['170', 'trees recorded', 'across 8 planters in 7 districts'],
    ['4.7 t', 'CO₂ / year', 'estimated by species rate × tree count'],
    ['₹15,525', 'net funder value', 'across 3 invoices · ₹5,550 settled'],
    ['29 → 32', 'blocks', 'grew with every demo interaction'],
    ['167 / 167', 'automated checks', '22 E2E · 42 contract · 103 full-flow'],
  ];

  stats.forEach((s, i) => {
    const x = M + (i % 3) * 3.0;
    const y = 1.28 + Math.floor(i / 3) * 1.32;
    panel(slide, x, y, 2.86, 1.16, { fill: WHITE, line: SAGE });
    slide.addText(s[0], {
      x: x + 0.18, y: y + 0.12, w: 2.5, h: 0.46,
      fontSize: 27, bold: true, color: DEEP, fontFace: FONT, margin: 0,
    });
    slide.addText(s[1], {
      x: x + 0.18, y: y + 0.6, w: 2.5, h: 0.24,
      fontSize: 10.5, bold: true, color: theme.primary, fontFace: FONT, margin: 0,
    });
    slide.addText(s[2], {
      x: x + 0.18, y: y + 0.83, w: 2.55, h: 0.24,
      fontSize: 8.5, color: MID, fontFace: FONT, margin: 0,
    });
  });

  panel(slide, M, 4.0, 8.9, 0.96, { fill: DEEP, line: DEEP });
  slide.addText('HOW THESE NUMBERS ARE TRUSTWORTHY', {
    x: M + 0.2, y: 4.12, w: 3.2, h: 0.22,
    fontSize: 8.5, bold: true, charSpacing: 1.2, color: SAGE, fontFace: FONT, margin: 0,
  });
  slide.addText(
    'Every figure above is read back out of ledger state by the same read models the app exposes over HTTP. Nothing on the dashboard is typed in by hand, and the leaderboard is a query — not a stored score.',
    { x: M + 0.2, y: 4.36, w: 8.5, h: 0.52, fontSize: 10, color: CREAM, fontFace: FONT, margin: 0 },
  );

  footer(slide, 'Seeded by replaying the real chaincode — PlantTree → VerifyPlanting → FundTokens → SettleFunding — so every hash is genuine.');
  pageNum(slide, 17);
  return slide;
}

module.exports = { createSlide };
