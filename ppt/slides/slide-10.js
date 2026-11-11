const { CREAM, SAGE, DEEP, DARKEST, MID, WHITE, FONT, M, pageNum, heading, panel, footer, numDot } = require('./_common');

/** Slide 10 — Cryptography and tamper-evidence */
function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };
  heading(slide, theme, 'Cryptography & security', 'Four layers make the ledger tamper-evident');

  const layers = [
    ['Evidence hash', 'SHA-256(photo bytes)', 'Change one pixel of the photo and the hash on chain no longer matches the image.'],
    ['Geo hash', 'SHA-256(lat, lng, acc, ts)', 'The whole geo payload is bound to the submission, so it cannot be moved later.'],
    ['Transaction + Merkle', 'txHash → merkleRoot', 'Every transaction hash is folded into one root — one altered tx breaks the block.'],
    ['Chained block header', 'SHA-256(prevHash | root | n | ts)', 'Each block commits to the previous one, so an edit cascades down the whole chain.'],
  ];

  layers.forEach((l, i) => {
    const y = 1.28 + i * 0.78;
    panel(slide, M, y, 6.1, 0.68, { fill: WHITE, line: SAGE });
    numDot(slide, M + 0.16, y + 0.17, i + 1, { fill: DEEP });
    slide.addText(l[0], {
      x: M + 0.62, y: y + 0.1, w: 1.8, h: 0.24,
      fontSize: 11, bold: true, color: theme.primary, fontFace: FONT, margin: 0,
    });
    slide.addText(l[1], {
      x: M + 0.62, y: y + 0.36, w: 2.2, h: 0.22,
      fontSize: 8, color: DEEP, fontFace: 'Consolas', margin: 0,
    });
    slide.addText(l[2], {
      x: M + 2.95, y: y + 0.13, w: 3.05, h: 0.46,
      fontSize: 8.5, color: MID, fontFace: FONT, margin: 0, valign: 'middle',
    });
  });

  // Right: the tamper test
  panel(slide, 6.86, 1.28, 2.59, 3.02, { fill: DEEP, line: DEEP });
  slide.addText('LIVE PROOF', {
    x: 7.04, y: 1.42, w: 2.25, h: 0.22,
    fontSize: 8.5, bold: true, charSpacing: 1.2, color: SAGE, fontFace: FONT, margin: 0,
  });
  slide.addText('Tap “Tamper with last block”', {
    x: 7.04, y: 1.68, w: 2.25, h: 0.44,
    fontSize: 11.5, bold: true, color: CREAM, fontFace: FONT, margin: 0,
  });
  slide.addText('The verifier recomputes every hash from scratch and reports the first broken block — and the reason it broke.', {
    x: 7.04, y: 2.16, w: 2.25, h: 0.72,
    fontSize: 8.5, color: SAGE, fontFace: FONT, margin: 0,
  });
  slide.addShape('rect', { x: 7.04, y: 2.98, w: 2.25, h: 0.02, fill: { color: SAGE }, line: { color: SAGE, width: 0 } });
  slide.addText('“Transaction payload was altered after endorsement — its stored payload no longer hashes to the signed payloadHash.”', {
    x: 7.04, y: 3.08, w: 2.25, h: 0.86,
    fontSize: 8, italic: true, color: CREAM, fontFace: FONT, margin: 0,
  });

  // Bottom bar
  panel(slide, M, 4.48, 8.9, 0.5, { fill: WHITE, line: DEEP, lineWidth: 1.1 });
  slide.addText('Signatures: every endorsement and every block is signed with ECDSA P-256, using the organisation’s MSP identity.', {
    x: M + 0.2, y: 4.48, w: 8.5, h: 0.5,
    fontSize: 10, bold: true, color: theme.primary, fontFace: FONT, margin: 0, valign: 'middle',
  });

  footer(slide, 'This is the Unit-5 requirement “Blockchain cryptography and security”, demonstrated rather than asserted.');
  pageNum(slide, 10);
  return slide;
}

module.exports = { createSlide };
