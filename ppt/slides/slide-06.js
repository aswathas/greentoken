const { CREAM, SAGE, DEEP, DARKEST, MID, WHITE, FONT, M, pageNum, heading, panel, footer, pill } = require('./_common');

/** Slide 6 — Unit 5 syllabus coverage map */
function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };
  heading(slide, theme, 'Unit 5 coverage', 'Mapping the project onto the prescribed use cases');

  const rows = [
    ['UC1 (i)', 'Provenance of goods', 'PlantTree — photo SHA-256 + geo-hash bound to every token', '●'],
    ['UC1 (ii)', 'Visibility', 'Search + map over every token; full read-only ledger for auditors', '●'],
    ['UC1 (iii)', 'Trade / supply chain finance', 'FundTokens + SettleFunding move money against verified stock', '●'],
    ['UC1 (iv)', 'Invoice management & discounting', 'Bulk discount ladder 0/5/10/15% computed in the contract', '●'],
    ['UC2 (i)', 'Digital identity', 'MSP identities with role attributes; contact never written to state', '●'],
    ['UC2 (ii)', 'Record keeping between government entities', 'Forest Dept, Auditor and Planters share one channel', '◐'],
    ['UC2 (iii)', 'Public distribution / social welfare', 'Subsidy-style disbursement and entitlement accounting', '◐'],
    ['SEC', 'Cryptography, privacy & security', 'ECDSA signing, hash-linked blocks, role-gated writes', '●'],
    ['PRAC', 'Build a network, deploy a contract', 'Fabric v2.5 chaincode + Cloudflare Durable Object network', '●'],
  ];

  const x0 = M;
  const colW = [0.82, 2.42, 4.86, 0.8];
  const headH = 0.36;
  const rowH = 0.34;
  const y0 = 1.24;

  ['Ref', 'Syllabus requirement', 'Implemented in GreenToken as', 'Status'].forEach((t, i) => {
    const x = x0 + colW.slice(0, i).reduce((a, b) => a + b, 0);
    slide.addShape('rect', { x, y: y0, w: colW[i], h: headH, fill: { color: DEEP }, line: { color: CREAM, width: 0.75 } });
    slide.addText(t, {
      x: x + 0.1, y: y0, w: colW[i] - 0.2, h: headH,
      fontSize: 9.5, bold: true, color: CREAM, fontFace: FONT, margin: 0, valign: 'middle',
    });
  });

  rows.forEach((r, ri) => {
    const y = y0 + headH + ri * rowH;
    r.forEach((cell, ci) => {
      const x = x0 + colW.slice(0, ci).reduce((a, b) => a + b, 0);
      slide.addShape('rect', {
        x, y, w: colW[ci], h: rowH,
        fill: { color: ci === 3 ? (cell === '●' ? DEEP : SAGE) : ri % 2 ? CREAM : WHITE },
        line: { color: SAGE, width: 0.5 },
      });
      slide.addText(cell, {
        x: x + 0.1, y: y, w: colW[ci] - 0.2, h: rowH,
        fontSize: ci === 0 ? 8.5 : ci === 3 ? 11 : 9,
        bold: ci === 0 || ci === 3,
        align: ci === 3 ? 'center' : 'left',
        color: ci === 3 ? (cell === '●' ? CREAM : DARKEST) : ci === 0 ? MID : theme.primary,
        fontFace: FONT, margin: 0, valign: 'middle',
      });
    });
  });

  slide.addText('● fully implemented      ◐ implemented at the model level, extension planned', {
    x: M, y: 4.76, w: 8.9, h: 0.26,
    fontSize: 9, italic: true, color: MID, fontFace: FONT, margin: 0, align: 'center',
  });

  footer(slide, 'GreenToken  ·  Unit 5 course project  ·  Blockchain Technology with Hyperledger Fabric');
  pageNum(slide, 6);
  return slide;
}

module.exports = { createSlide };
