const { CREAM, SAGE, DEEP, DARKEST, MID, WHITE, FONT, M, pageNum, heading, panel, footer } = require('./_common');

/** Slide 7 — System architecture */
function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };
  heading(slide, theme, 'Architecture', 'One smart contract, three deployment targets');

  const tiers = [
    {
      y: 1.26, h: 0.92, name: 'PRESENTATION',
      tag: 'React + Vite + TypeScript',
      body: 'Seven screens: dashboard, plant, verify, discover, leaderboard, ledger explorer, invoices.\nIdentity switcher lets any organisation act for itself.',
      fill: WHITE, line: SAGE,
    },
    {
      y: 2.42, h: 0.92, name: 'API / NETWORK',
      tag: 'Cloudflare Worker + Durable Object',
      body: 'The Durable Object is the channel: one ordered ledger, serialised writes, chaincode events\nstreamed over SSE. Same REST surface as a Fabric gateway.',
      fill: DEEP, line: DEEP, dark: true,
    },
    {
      y: 3.58, h: 0.92, name: 'SMART CONTRACT',
      tag: 'TypeScript chaincode (Fabric-compatible)',
      body: 'PlantTree · VerifyPlanting · FundTokens · SettleFunding — plus read models.\nPlatform-free domain module; the host supplies the stub.',
      fill: WHITE, line: SAGE,
    },
  ];

  tiers.forEach((t) => {
    panel(slide, M, t.y, 5.9, t.h, { fill: t.fill, line: t.line });
    const dark = !!t.dark;
    slide.addText(t.name, {
      x: M + 0.16, y: t.y + 0.13, w: 2.0, h: 0.22,
      fontSize: 8.5, bold: true, charSpacing: 1.2,
      color: dark ? SAGE : MID, fontFace: FONT, margin: 0,
    });
    slide.addText(t.tag, {
      x: M + 0.16, y: t.y + 0.35, w: 5.5, h: 0.24,
      fontSize: 11.5, bold: true, color: dark ? CREAM : theme.primary, fontFace: FONT, margin: 0,
    });
    slide.addText(t.body, {
      x: M + 0.16, y: t.y + 0.59, w: 5.6, h: 0.32,
      fontSize: 8.5, color: dark ? SAGE : MID, fontFace: FONT, margin: 0,
    });
  });

  // Connectors
  [2.18, 3.34].forEach((y) => {
    slide.addShape('downArrow', { x: 3.2, y, w: 0.2, h: 0.24, fill: { color: MID }, line: { color: MID, width: 0.5 } });
  });

  // Right column: the shared domain module
  panel(slide, 6.68, 1.26, 2.77, 3.24, { fill: WHITE, line: DEEP, lineWidth: 1.25 });
  slide.addText('ONE DOMAIN MODULE', {
    x: 6.86, y: 1.42, w: 2.45, h: 0.24,
    fontSize: 8.5, bold: true, charSpacing: 1.2, color: MID, fontFace: FONT, margin: 0,
  });
  slide.addText('src/core/chaincode.ts', {
    x: 6.86, y: 1.68, w: 2.45, h: 0.26,
    fontSize: 12, bold: true, color: theme.primary, fontFace: FONT, margin: 0,
  });
  slide.addText(
    'Contains only business rules — no platform imports. A thin adapter binds it to each host.',
    { x: 6.86, y: 1.96, w: 2.45, h: 0.5, fontSize: 9, color: MID, fontFace: FONT, margin: 0 },
  );

  const hosts = [
    ['Browser', 'MemoryStub'],
    ['Worker', 'DO-backed stub'],
    ['Fabric', 'fabric-shim Context'],
  ];
  hosts.forEach((h, i) => {
    const y = 2.58 + i * 0.52;
    slide.addShape('rect', { x: 6.86, y, w: 2.45, h: 0.42, fill: { color: CREAM }, line: { color: SAGE, width: 0.75 } });
    slide.addText(h[0], { x: 6.98, y, w: 0.85, h: 0.42, fontSize: 9.5, bold: true, color: theme.primary, fontFace: FONT, margin: 0, valign: 'middle' });
    slide.addText(h[1], { x: 7.85, y, w: 1.4, h: 0.42, fontSize: 8.5, color: MID, fontFace: FONT, margin: 0, valign: 'middle' });
  });

  slide.addShape('line', { x: 6.86, y: 4.18, w: 2.45, h: 0, line: { color: SAGE, width: 0.75 } });
  slide.addText('A change to the contract changes all three hosts at once.', {
    x: 6.86, y: 4.22, w: 2.45, h: 0.26,
    fontSize: 8.5, italic: true, color: MID, fontFace: FONT, margin: 0,
  });

  footer(slide, 'chaincode/src/contract.ts is the Fabric adapter; worker/src/index.ts is the Durable Object host; src/core/ledger.ts is the in-browser host.');
  pageNum(slide, 7);
  return slide;
}

module.exports = { createSlide };
