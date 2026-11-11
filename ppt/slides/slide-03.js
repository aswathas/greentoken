const { CREAM, SAGE, DEEP, DARKEST, MID, WHITE, FONT, M, pageNum, heading, panel, footer, numDot } = require('./_common');

/** Slide 3 — The problem */
function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };
  heading(slide, theme, 'The problem', 'Tree-planting claims are cheap to fake');

  const pains = [
    ['A paper register is not evidence', 'Photos on a phone, GPS coordinates anyone can edit and a signature from one person are the entire trust model of most plantation schemes.'],
    ['Buyers pay for a number, not a tree', 'A corporate buyer cannot tell whether 500 trees were planted, where they are, or whether the same photo was submitted twice for different plots.'],
    ['Money and impact never meet', 'The planter, the verifier and the funder keep separate records. Reconciliation happens in spreadsheets, months after the fact.'],
  ];

  pains.forEach((p, i) => {
    const y = 1.35 + i * 0.92;
    panel(slide, M, y, 5.35, 0.8, { fill: WHITE, line: SAGE });
    numDot(slide, M + 0.18, y + 0.23, i + 1, { fill: DEEP });
    slide.addText(p[0], {
      x: M + 0.66, y: y + 0.12, w: 4.5, h: 0.26,
      fontSize: 12, bold: true, color: theme.primary, fontFace: FONT, margin: 0,
    });
    slide.addText(p[1], {
      x: M + 0.66, y: y + 0.37, w: 4.55, h: 0.38,
      fontSize: 9.5, color: MID, fontFace: FONT, margin: 0,
    });
  });

  // Right: the trust gap
  panel(slide, 6.2, 1.35, 3.25, 2.64, { fill: DEEP, line: DEEP });
  slide.addText('THE TRUST GAP', {
    x: 6.4, y: 1.5, w: 2.9, h: 0.26,
    fontSize: 9.5, bold: true, charSpacing: 1.4, color: SAGE, fontFace: FONT, margin: 0,
  });
  slide.addText('One planter', {
    x: 6.4, y: 1.9, w: 2.9, h: 0.26, fontSize: 11.5, bold: true, color: CREAM, fontFace: FONT, margin: 0,
  });
  slide.addText('self-reports the tree', {
    x: 6.4, y: 2.14, w: 2.9, h: 0.24, fontSize: 9.5, color: SAGE, fontFace: FONT, margin: 0,
  });
  slide.addText('Verifier', {
    x: 6.4, y: 2.52, w: 2.9, h: 0.26, fontSize: 11.5, bold: true, color: CREAM, fontFace: FONT, margin: 0,
  });
  slide.addText('approves on their word alone', {
    x: 6.4, y: 2.76, w: 2.9, h: 0.24, fontSize: 9.5, color: SAGE, fontFace: FONT, margin: 0,
  });
  slide.addText('Funder', {
    x: 6.4, y: 3.14, w: 2.9, h: 0.26, fontSize: 11.5, bold: true, color: CREAM, fontFace: FONT, margin: 0,
  });
  slide.addText('pays against a spreadsheet', {
    x: 6.4, y: 3.38, w: 2.9, h: 0.24, fontSize: 9.5, color: SAGE, fontFace: FONT, margin: 0,
  });
  slide.addShape('line', { x: 6.4, y: 3.72, w: 2.85, h: 0, line: { color: SAGE, width: 0.75 } });
  slide.addText('No shared record. No proof of work. No audit trail.', {
    x: 6.4, y: 3.8, w: 2.9, h: 0.24, fontSize: 9, italic: true, color: SAGE, fontFace: FONT, margin: 0,
  });

  // Bottom strip — the requirement
  panel(slide, M, 4.16, 8.9, 0.82, { fill: WHITE, line: DEEP, lineWidth: 1.25 });
  slide.addText('The requirement', {
    x: M + 0.2, y: 4.3, w: 1.6, h: 0.24,
    fontSize: 10, bold: true, charSpacing: 1, color: MID, fontFace: FONT, margin: 0,
  });
  slide.addText(
    'A single shared record that every organisation signs, that nobody can quietly edit, and that lets a funder check exactly what they are buying.',
    { x: M + 1.85, y: 4.27, w: 6.85, h: 0.6, fontSize: 11, color: theme.primary, fontFace: FONT, margin: 0, valign: 'middle' },
  );

  footer(slide, 'Unit 5 — Use case 1 (trade/supply chain) and use case 2 (government) share one root problem: verifiable provenance.');
  pageNum(slide, 3);
  return slide;
}

module.exports = { createSlide };
