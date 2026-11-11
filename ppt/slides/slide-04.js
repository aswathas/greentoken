const { CREAM, SAGE, DEEP, DARKEST, MID, WHITE, FONT, M, pageNum, heading, panel, footer } = require('./_common');

/** Slide 4 — What blockchain changes (comparison table) */
function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };
  heading(slide, theme, 'The solution', 'What the ledger actually changes');

  const rows = [
    ['Evidence', 'A photo and a self-reported coordinate', 'SHA-256 of the photo + a geo-hash, both fixed at submission'],
    ['Trust', 'One approver\'s word', 'Two independent organisations endorse with digital signatures'],
    ['Identity', 'Whatever the spreadsheet says', 'MSP-backed identity with role attributes enforced in the contract'],
    ['Traceability', 'Reconcile at audit time', 'Every state change is an event on a hash-linked chain'],
    ['Tampering', 'Silently corrected', 'Detected and localised to the exact broken block'],
    ['Payment', 'Invoice reconciled by hand', 'Smart-contract invoice with a bulk discount ladder'],
  ];

  const x0 = M;
  const colW = [1.55, 3.15, 4.2];
  const headH = 0.42;
  const rowH = 0.47;
  const y0 = 1.32;

  // Header
  ['Dimension', 'Today’s register', 'GreenToken on a blockchain'].forEach((t, i) => {
    const x = x0 + colW.slice(0, i).reduce((a, b) => a + b, 0);
    slide.addShape('rect', {
      x, y: y0, w: colW[i], h: headH,
      fill: { color: DEEP }, line: { color: CREAM, width: 0.75 },
    });
    slide.addText(t, {
      x: x + 0.12, y: y0, w: colW[i] - 0.24, h: headH,
      fontSize: 10.5, bold: true, color: CREAM, fontFace: FONT, margin: 0, valign: 'middle',
    });
  });

  rows.forEach((r, ri) => {
    const y = y0 + headH + ri * rowH;
    r.forEach((cell, ci) => {
      const x = x0 + colW.slice(0, ci).reduce((a, b) => a + b, 0);
      const isLast = ci === 2;
      slide.addShape('rect', {
        x, y, w: colW[ci], h: rowH,
        fill: { color: ci === 0 ? (ri % 2 ? SAGE : CREAM) : WHITE },
        line: { color: SAGE, width: 0.5 },
      });
      slide.addText(cell, {
        x: x + 0.12, y: y + 0.05, w: colW[ci] - 0.24, h: rowH - 0.1,
        fontSize: ci === 0 ? 10 : 9.5,
        bold: ci === 0,
        color: ci === 0 ? theme.primary : ci === 1 ? MID : DEEP,
        fontFace: FONT, margin: 0, valign: 'middle',
      });
    });
  });

  slide.addText('Blockchain does not make trees grow. It makes the claim about a tree checkable.', {
    x: M, y: 4.68, w: 8.9, h: 0.32,
    fontSize: 11.5, italic: true, bold: true, color: DEEP, fontFace: FONT, margin: 0, align: 'center',
  });

  footer(slide, 'GreenToken  ·  Unit 5 course project  ·  Blockchain Technology with Hyperledger Fabric');
  pageNum(slide, 4);
  return slide;
}

module.exports = { createSlide };
