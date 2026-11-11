const { CREAM, SAGE, DEEP, DARKEST, FONT, M, pageNum, pill, treeMark } = require('./_common');

/** Slide 1 — Cover */
function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: DARKEST };

  // Decorative leaf field on the right
  slide.addShape('ellipse', { x: 6.5, y: -1.5, w: 5.6, h: 5.6, fill: { color: DEEP, transparency: 25 }, line: { color: DEEP, transparency: 100 } });
  slide.addShape('ellipse', { x: 7.4, y: 2.3, w: 3.4, h: 3.4, fill: { color: SAGE, transparency: 82 }, line: { color: SAGE, transparency: 100 } });

  slide.addShape('rect', { x: 0, y: 0, w: 0.16, h: 5.625, fill: { color: SAGE }, line: { color: SAGE, width: 0.5 } });

  pill(slide, M, 0.72, 2.55, '21CSE432IT  ·  UNIT 5', { fill: SAGE, color: DARKEST, h: 0.28, fontSize: 9 });

  slide.addText('GreenToken', {
    x: M, y: 1.22, w: 8.0, h: 0.95,
    fontSize: 52, bold: true, color: CREAM, fontFace: FONT, margin: 0,
  });
  slide.addText('Verifiable blue-green carbon tokens on a tamper-evident ledger', {
    x: M, y: 2.18, w: 7.2, h: 0.42,
    fontSize: 17, color: SAGE, fontFace: FONT, margin: 0,
  });

  slide.addShape('line', { x: M, y: 2.78, w: 2.2, h: 0, line: { color: SAGE, width: 1.5 } });

  slide.addText(
    [
      { text: 'A working application and smart contract that turn a geo-stamped planting photo', options: { breakLine: true } },
      { text: 'into a verifiable carbon token — planted by citizens, endorsed by the Forest Department,' },
      { text: 'discovered and funded by corporate buyers.', options: { breakLine: true } },
    ],
    { x: M, y: 2.95, w: 7.6, h: 0.9, fontSize: 12.5, color: CREAM, fontFace: FONT, margin: 0, lineSpacing: 17 },
  );

  slide.addText('Developing Smart Contracts and Use Cases  ·  Blockchain Technology with Hyperledger Fabric', {
    x: M, y: 4.42, w: 7.6, h: 0.3,
    fontSize: 11, bold: true, color: SAGE, fontFace: FONT, margin: 0,
  });
  slide.addText('Course project presentation  ·  Live demo, deployed and reproducible', {
    x: M, y: 4.72, w: 7.6, h: 0.3,
    fontSize: 10.5, color: SAGE, fontFace: FONT, margin: 0,
  });

  slide.addShape('roundRect', {
    x: 7.55, y: 1.05, w: 1.95, h: 1.95, rectRadius: 0.16,
    fill: { color: DARKEST }, line: { color: SAGE, width: 1.5 },
  });
  treeMark(slide, 7.95, 1.42, 1.15, { canopy: SAGE, trunk: CREAM });
  slide.addText('verified carbon token', {
    x: 7.55, y: 3.05, w: 1.95, h: 0.3, fontSize: 9, color: SAGE, align: 'center', fontFace: FONT, margin: 0,
  });

  return slide;
}

module.exports = { createSlide };
