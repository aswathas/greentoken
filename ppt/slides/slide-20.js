const { CREAM, SAGE, DEEP, DARKEST, MID, WHITE, FONT, M, pageNum, heading, panel, footer } = require('./_common');

/** Slide 20 — Learning outcomes and references */
function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };
  heading(slide, theme, 'Outcomes & references', 'What this project demonstrates');

  // Learning outcomes
  panel(slide, M, 1.28, 5.35, 3.5, { fill: WHITE, line: SAGE });
  slide.addText('COURSE OUTCOMES ADDRESSED', {
    x: M + 0.18, y: 1.42, w: 5.0, h: 0.22,
    fontSize: 8.5, bold: true, charSpacing: 1.2, color: MID, fontFace: FONT, margin: 0,
  });

  const outs = [
    ['CO-5', 'Build smart contracts for real-time use cases', 'Ten chaincode functions — four writes, six reads — and a working front end that exercises them.'],
    ['CLR-3', 'Apply hyperledger trade network concepts in business networks', 'Four organisations, one channel, one ordering service, shared state.'],
    ['CLR-4', 'Apply smart contract transactions and ledger data structures', 'Composite-key world state, Merkle-rooted blocks, hash-linked chain.'],
    ['CLR-5', 'Develop smart contracts for any use case', 'Platform-free domain layer that retargets to Fabric, a Worker and a browser.'],
  ];
  outs.forEach((o, i) => {
    const y = 1.74 + i * 0.74;
    slide.addShape('roundRect', { x: M + 0.18, y, w: 0.62, h: 0.26, rectRadius: 0.13, fill: { color: DEEP }, line: { color: DEEP, width: 0.5 } });
    slide.addText(o[0], { x: M + 0.18, y, w: 0.62, h: 0.26, fontSize: 8.5, bold: true, color: CREAM, align: 'center', valign: 'middle', fontFace: FONT, margin: 0 });
    slide.addText(o[1], { x: M + 0.9, y: y - 0.02, w: 4.4, h: 0.24, fontSize: 9.5, bold: true, color: theme.primary, fontFace: FONT, margin: 0 });
    slide.addText(o[2], { x: M + 0.9, y: y + 0.22, w: 4.4, h: 0.4, fontSize: 8.5, color: MID, fontFace: FONT, margin: 0 });
  });

  // References
  panel(slide, 6.12, 1.28, 3.33, 3.5, { fill: DEEP, line: DEEP });
  slide.addText('REFERENCES', {
    x: 6.3, y: 1.42, w: 3.0, h: 0.22,
    fontSize: 8.5, bold: true, charSpacing: 1.2, color: SAGE, fontFace: FONT, margin: 0,
  });
  const refs = [
    'Hyperledger Fabric v2.5 documentation — hyperledger-fabric.readthedocs.io',
    'Nakul Shah, Blockchain for Business with Hyperledger Fabric, BPB 2019',
    'A. Kumar, Hyperledger Fabric In-Depth — Learn, Build and Deploy',
    'M. Zand et al., Hands-On Smart Contract Development with Hyperledger Fabric V2',
    'Yannis Kalfoglou, Blockchain for Business — A Practical Guide, Routledge 2021',
    'Hyperledger Fabric samples and the private-data collection tutorial',
  ];
  refs.forEach((r, i) => {
    const y = 1.72 + i * 0.42;
    slide.addShape('ellipse', { x: 6.3, y: y + 0.05, w: 0.08, h: 0.08, fill: { color: SAGE }, line: { color: SAGE, width: 0 } });
    slide.addText(r, { x: 6.46, y: y - 0.03, w: 2.86, h: 0.46, fontSize: 8.5, color: CREAM, fontFace: FONT, margin: 0 });
  });

  slide.addShape('line', { x: 6.3, y: 4.32, w: 3.0, h: 0, line: { color: SAGE, width: 0.75 } });
  slide.addText('Live demo — greentoken-7gc.pages.dev', {
    x: 6.3, y: 4.4, w: 3.0, h: 0.26,
    fontSize: 8.5, color: SAGE, fontFace: FONT, margin: 0, valign: 'middle',
  });

  footer(slide, 'GreenToken  ·  Unit 5 course project  ·  Blockchain Technology with Hyperledger Fabric');
  pageNum(slide, 20);
  return slide;
}

module.exports = { createSlide };
