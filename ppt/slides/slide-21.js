const { CREAM, SAGE, DEEP, DARKEST, MID, WHITE, FONT, M, pageNum, headingDark, panel, pill, treeMark } = require('./_common');

/** Slide 21 — Closing */
function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: DARKEST };

  slide.addShape('ellipse', { x: 6.9, y: -1.2, w: 5.2, h: 5.2, fill: { color: DEEP, transparency: 30 }, line: { color: DEEP, transparency: 100 } });
  slide.addShape('rect', { x: 0, y: 0, w: 0.16, h: 5.625, fill: { color: SAGE }, line: { color: SAGE, width: 0.5 } });

  pill(slide, M, 1.32, 1.9, 'THANK YOU', { fill: SAGE, color: DARKEST, h: 0.28, fontSize: 9 });

  slide.addText('Plant it. Prove it.\nTokenise it.', {
    x: M, y: 1.78, w: 6.6, h: 1.5,
    fontSize: 40, bold: true, color: CREAM, fontFace: FONT, margin: 0, lineSpacing: 46,
  });

  slide.addShape('line', { x: M, y: 3.42, w: 2.2, h: 0, line: { color: SAGE, width: 1.5 } });

  slide.addText('GreenToken — verifiable blue-green carbon tokens on a tamper-evident ledger', {
    x: M, y: 3.62, w: 6.4, h: 0.3,
    fontSize: 13, color: SAGE, fontFace: FONT, margin: 0,
  });

  const links = [
    ['Live demo', 'greentoken-7gc.pages.dev'],
    ['Backend', 'Worker + Durable Object'],
    ['Fabric chaincode', 'chaincode/src/contract.ts'],
  ];
  links.forEach((l, i) => {
    const x = M + i * 2.25;
    slide.addShape('roundRect', {
      x, y: 4.12, w: 2.1, h: 0.68, rectRadius: 0.06,
      fill: { color: DARKEST }, line: { color: SAGE, width: 0.75 },
    });
    slide.addText(l[0].toUpperCase(), {
      x: x + 0.14, y: 4.2, w: 1.85, h: 0.2,
      fontSize: 7.5, bold: true, charSpacing: 1.1, color: SAGE, fontFace: FONT, margin: 0,
    });
    slide.addText(l[1], {
      x: x + 0.14, y: 4.42, w: 1.85, h: 0.28,
      fontSize: 8.5, color: CREAM, fontFace: 'Consolas', margin: 0,
    });
  });

  slide.addShape('roundRect', {
    x: 7.35, y: 1.9, w: 2.1, h: 2.1, rectRadius: 0.16,
    fill: { color: DARKEST }, line: { color: SAGE, width: 1.5 },
  });
  treeMark(slide, 7.75, 2.24, 1.3, { canopy: SAGE, trunk: CREAM });

  slide.addText('Questions welcome', {
    x: M, y: 5.0, w: 5.0, h: 0.3,
    fontSize: 12, bold: true, color: SAGE, fontFace: FONT, margin: 0,
  });

  pageNum(slide, 21, true);
  return slide;
}

module.exports = { createSlide };
