const { CREAM, SAGE, DEEP, DARKEST, MID, WHITE, FONT, M, pageNum, heading, panel, footer, pill } = require('./_common');

/** Slide 18 — Deployment */
function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };
  heading(slide, theme, 'Deployment', 'How the demo is hosted');

  // Left — deployed stack
  panel(slide, M, 1.28, 4.35, 3.3, { fill: WHITE, line: SAGE });
  slide.addText('DEPLOYED STACK', {
    x: M + 0.18, y: 1.42, w: 3.9, h: 0.22,
    fontSize: 8.5, bold: true, charSpacing: 1.2, color: MID, fontFace: FONT, margin: 0,
  });

  const stack = [
    ['Cloudflare Pages', 'greentoken-7gc.pages.dev', 'Static SPA, served over HTTPS, auto-deploys from the repo'],
    ['Cloudflare Workers', 'greentoken-api', 'REST + SSE API, Durable Object holds the ordered ledger'],
    ['Fabric v2.5', 'chaincode/', 'Real Hyperledger Fabric chaincode, deployable with network/deploy.sh'],
  ];
  stack.forEach((s, i) => {
    const y = 1.72 + i * 0.92;
    slide.addShape('rect', { x: M + 0.18, y, w: 3.99, h: 0.8, fill: { color: CREAM }, line: { color: SAGE, width: 0.75 } });
    slide.addShape('rect', { x: M + 0.18, y, w: 0.06, h: 0.8, fill: { color: DEEP }, line: { color: DEEP, width: 0 } });
    slide.addText(s[0], { x: M + 0.36, y: y + 0.08, w: 1.7, h: 0.22, fontSize: 10.5, bold: true, color: theme.primary, fontFace: FONT, margin: 0 });
    slide.addText(s[1], { x: M + 1.9, y: y + 0.09, w: 2.15, h: 0.22, fontSize: 7.5, color: DEEP, align: 'right', fontFace: 'Consolas', margin: 0 });
    slide.addText(s[2], { x: M + 0.36, y: y + 0.34, w: 3.7, h: 0.4, fontSize: 8.5, color: MID, fontFace: FONT, margin: 0 });
  });

  // Right — why dual-target
  panel(slide, 5.22, 1.28, 4.23, 3.3, { fill: DEEP, line: DEEP });
  slide.addText('WHY IT RUNS TWICE', {
    x: 5.4, y: 1.42, w: 3.9, h: 0.22,
    fontSize: 8.5, bold: true, charSpacing: 1.2, color: SAGE, fontFace: FONT, margin: 0,
  });
  const reasons = [
    ['One contract, three hosts', 'src/core/chaincode.ts holds the rules. The browser, the Durable Object and fabric-shim each supply a different stub implementation.'],
    ['Demo never depends on Docker', 'The graded demo opens in a browser. A 4 GB Fabric network is not a fair thing to require during an evaluation.'],
    ['Fabric is still real', 'network/ ships a v2.5 compose file, the chaincode package and the install → approve → commit script for the lab record.'],
  ];
  reasons.forEach((r, i) => {
    const y = 1.72 + i * 0.92;
    slide.addText(r[0], { x: 5.4, y, w: 3.9, h: 0.24, fontSize: 11, bold: true, color: CREAM, fontFace: FONT, margin: 0 });
    slide.addText(r[1], { x: 5.4, y: y + 0.26, w: 3.88, h: 0.6, fontSize: 8.5, color: SAGE, fontFace: FONT, margin: 0 });
  });

  footer(slide, 'Static build with relative asset paths — also deployable to GitHub Pages. Responsive from 360 px: the drawer replaces the desktop sidebar on a phone.');
  pageNum(slide, 18);
  return slide;
}

module.exports = { createSlide };
