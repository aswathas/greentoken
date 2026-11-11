/**
 * ACT 1 — THE PROBLEM
 * Slides 1–9. The story opens with one tree; then the scale; then the market;
 * then the evidence that the market does not work; then why it stays broken.
 */
const T = require('./_theme');

function build(pres) {
  const slides = [];

  // ---------------------------------------------------------------- 1 cover
  {
    const s = pres.addSlide();
    s.background = { color: T.NIGHT };
    s.addShape('rect', { x: 0, y: 0, w: T.W, h: 0.07, fill: { color: T.ACC }, line: { color: T.ACC, width: 0 } });
    s.addText('GREENTOKEN  ·  21CSE435T SMART CONTRACT  ·  UNIT 5', {
      x: T.M, y: 0.52, w: 8.6, h: 0.24,
      fontSize: 9.5, bold: true, charSpacing: 1.8, color: T.SAGE, fontFace: T.FONT, margin: 0,
    });
    s.addText('The tree that was\nsold twice', {
      x: T.M, y: 1.25, w: 7.2, h: 1.5,
      fontSize: 42, bold: true, color: T.CREAM, fontFace: T.FONT, margin: 0, valign: 'top',
    });
    s.addShape('rect', { x: T.M, y: 2.92, w: 1.1, h: 0.045, fill: { color: T.ACC }, line: { color: T.ACC, width: 0 } });
    s.addText('A story about four people who cannot agree on what is true —\nand a ledger that finally makes them able to.', {
      x: T.M, y: 3.16, w: 6.4, h: 0.72,
      fontSize: 13, color: T.SAGE, fontFace: T.FONT, margin: 0, valign: 'top', lineSpacingMultiple: 1.15,
    });
    T.treeMark(s, 7.5, 1.35, 1.9, { canopy: T.ACC, trunk: T.SAGE });
    s.addText('Aswath AS  ·  RA2311050010060  ·  Dr. S. Ganesh Kumar', {
      x: T.M, y: 4.75, w: 8.6, h: 0.24,
      fontSize: 9.5, color: T.SAGE, fontFace: T.FONT, margin: 0,
    });
    s.addText('greentoken-7gc.pages.dev', {
      x: T.M, y: 5.02, w: 8.6, h: 0.24,
      fontSize: 9.5, bold: true, color: T.ACC, fontFace: T.FONT, margin: 0,
    });
    slides.push(s);
  }

  // ------------------------------------------------------- 2 the story opens
  {
    const s = pres.addSlide();
    s.background = { color: T.PAPER };
    T.head(s, 'Chapter one', 'One photograph, two buyers, one tree');
    T.para(s, T.M, 1.2, 5.0, 1.9,
      'Ravi plants 40 neem trees on a half-acre plot. He photographs them with his phone and sends the picture to a cooperative, who forwards it to a company that wants to buy the carbon.',
      { size: 11.5, ls: 1.22 });
    T.para(s, T.M, 2.42, 5.0, 1.9,
      'The same photograph is then also attached to a second plantation eight kilometres away, because a photograph of forty neem trees looks exactly like a photograph of forty neem trees.',
      { size: 11.5, ls: 1.22 });
    T.barPanel(s, 5.75, 1.2, 3.7, 2.5, T.CLAY, { fill: T.CLAYBG, line: 'F0D8CC' });
    T.label(s, 5.95, 1.38, 3.3, 'What has to be true for the system to work', T.CLAY);
    T.para(s, 5.95, 1.66, 3.3, 1.9,
      'Nobody can sell the same tree twice.\n\nA buyer can check the claim without asking permission.\n\nA reviewer can approve without trusting the seller.',
      { size: 10.5, ls: 1.15 });
    T.para(s, T.M, 4.3, 8.9, 0.6,
      'None of those is a technical requirement. They are all requirements on the trust between four organisations — and today, the only thing that resolves them is a spreadsheet somebody owns.',
      { size: 11.5, italic: true, color: T.DEEP, ls: 1.2 });
    T.pageNum(s, 2);
    T.source(s, 'The scenario is illustrative; the failure mode is documented in UNCTAD (2025).');
    slides.push(s);
  }

  // ------------------------------------------------------------- 3 the stakes
  {
    const s = pres.addSlide();
    s.background = { color: T.PAPER };
    T.head(s, 'The stakes', 'The warmest year in the 175-year record');
    T.panel(s, T.M, 1.18, 3.55, 1.5, { fill: T.MIST });
    T.stat(s, T.M + 0.22, 1.32, 3.1, '+1.55 °C', '2024 global mean surface temperature above the 1850–1900 average',
      { vsize: 30, vh: 0.6, lsize: 9, lh: 0.62 });
    T.panel(s, T.M, 2.86, 3.55, 1.5, { fill: T.MIST });
    T.stat(s, T.M + 0.22, 3.0, 3.1, '10 / 10', 'Every one of the ten years from 2015 to 2024 is among the ten warmest ever measured',
      { vsize: 30, vh: 0.6, lsize: 9, lh: 0.62 });
    T.panel(s, T.M, 4.46, 3.55, 0.92, { fill: T.MIST, shadow: false });
    T.stat(s, T.M + 0.22, 4.54, 3.1, '1.37 °C', 'human-caused warming, long-term trend to 2025',
      { vsize: 20, vh: 0.36, lsize: 8.2, lh: 0.3 });

    s.addChart(pres.ChartType.bar, [
      { name: 'Above pre-industrial (°C)', labels: ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'], values: [1.11, 1.29, 1.19, 1.12, 1.24, 1.29, 1.11, 1.16, 1.45, 1.55] },
    ], T.chartOpts(pres, {
      x: 4.35, y: 1.18, w: 5.1, h: 3.55,
      chartColors: [T.CLAY],
      valAxisMinVal: 0, valAxisMaxVal: 1.8, valAxisMajorUnit: 0.3,
      catAxisLabelFontSize: 8.5,
      barGapWidthPct: 45,
      showValue: true, dataLabelFontSize: 8, dataLabelColor: T.INK, dataLabelPosition: 'outEnd',
      dataLabelFormatCode: '0.00',
    }));
    T.para(s, 4.35, 4.82, 5.1, 0.5,
      'A single year above 1.5 °C is not the same as crossing the Paris threshold — but it is the clearest signal yet that the budget is nearly spent.',
      { size: 9, italic: true, color: '48654F' });
    T.pageNum(s, 3);
    T.source(s, 'Source: WMO, State of the Global Climate 2024 (annual anomaly, 1850–1900 baseline); Global Carbon Project for the long-term trend.');
    slides.push(s);
  }

  // ---------------------------------------------------------- 4 budget clock
  {
    const s = pres.addSlide();
    s.background = { color: T.PAPER };
    T.head(s, 'The clock', 'Four years of emissions left for 1.5 °C');
    s.addChart(pres.ChartType.bar, [
      { name: 'Remaining carbon budget (GtCO₂)', labels: ['1.5 °C', '1.7 °C', '2.0 °C'], values: [150, 510, 1035] },
    ], T.chartOpts(pres, {
      x: T.M, y: 1.22, w: 5.3, h: 2.85,
      chartColors: [T.CLAY],
      valAxisMinVal: 0, valAxisMaxVal: 1200, valAxisMajorUnit: 200,
      showValue: true, dataLabelFontSize: 11, dataLabelColor: T.INK, dataLabelPosition: 'outEnd',
      catAxisLabelFontSize: 11,
      barGapWidthPct: 55,
    }));
    T.para(s, T.M, 4.12, 5.3, 0.6,
      'Remaining budget from the start of 2027, for a 50% chance of holding 1.5 °C — 150 GtCO₂. At current emissions that is under four years of global output.',
      { size: 10, color: '48654F', ls: 1.15 });

    T.panel(s, 6.15, 1.22, 3.3, 3.42, { fill: T.MIST });
    T.label(s, 6.38, 1.42, 2.9, 'In plain terms');
    T.stat(s, 6.38, 1.68, 2.9, '< 4 years', 'of current global emissions to stay under 1.5 °C',
      { vsize: 26, vh: 0.52, lsize: 9, lh: 0.5 });
    T.bullets(s, 6.38, 2.72, 2.9, [
      '1.5 °C  →  150 GtCO₂  →  about 4 years',
      '1.7 °C  →  510 GtCO₂  →  about 12 years',
      '2.0 °C  →  1,035 GtCO₂  →  about 24 years',
    ], { size: 9.5, gap: 0.34, dot: T.CLAY });
    T.para(s, 6.38, 3.92, 2.9, 0.6,
      'The budget is not a philosophical line. It is a quantity of emissions, and it is shrinking while the market that claims to remove them is worth $1.4 billion a year.',
      { size: 9, italic: true, color: '48654F', ls: 1.12 });
    T.pageNum(s, 4);
    T.source(s, 'Source: Global Carbon Project, Global Carbon Budget (2026 analysis via Carbon Brief). Budgets are probabilistic; 1.5 °C figure is a 50% likelihood.');
    slides.push(s);
  }

  // ----------------------------------------------------------------- 5 CO₂
  {
    const s = pres.addSlide();
    s.background = { color: T.PAPER };
    T.head(s, 'The physics', 'Carbon dioxide is at 153% of its pre-industrial level');
    s.addChart(pres.ChartType.line, [
      { name: 'Mauna Loa annual mean (ppm)', labels: ['1958', '1970', '1980', '1990', '2000', '2010', '2020', '2024'], values: [315.7, 325.7, 338.8, 354.4, 369.6, 389.9, 414.2, 424.6] },
    ], T.chartOpts(pres, {
      x: T.M, y: 1.22, w: 6.0, h: 3.3,
      chartColors: [T.ACC],
      lineDataSymbol: 'circle', lineSize: 2.5, lineSmooth: false,
      valAxisMinVal: 300, valAxisMaxVal: 440, valAxisMajorUnit: 20,
      catAxisLabelFontSize: 9,
    }));
    T.para(s, T.M, 4.56, 6.0, 0.4,
      'Mauna Loa annual means, 1958–2024. The curve has never once been flat.',
      { size: 9, italic: true, color: '48654F' });

    T.panel(s, 6.85, 1.22, 2.6, 1.32, { fill: T.MIST });
    T.stat(s, 7.05, 1.34, 2.2, '426.8 ppm', '2025 global average — a new record (WMO)',
      { vsize: 21, vh: 0.42, lsize: 8.5, lh: 0.44 });
    T.panel(s, 6.85, 2.66, 2.6, 1.32, { fill: T.MIST });
    T.stat(s, 7.05, 2.78, 2.2, '153%', 'of the 1750 pre-industrial concentration',
      { vsize: 21, vh: 0.42, lsize: 8.5, lh: 0.44 });
    T.panel(s, 6.85, 4.1, 2.6, 1.02, { fill: T.MIST, shadow: false });
    T.stat(s, 7.05, 4.18, 2.2, '+56%', 'radiative forcing from long-lived greenhouse gases, 1990–2025',
      { vsize: 17, vh: 0.36, lsize: 8, lh: 0.38 });
    T.pageNum(s, 5);
    T.source(s, 'Sources: NOAA Global Monitoring Laboratory, Trends in CO₂ (Mauna Loa annual means); WMO Greenhouse Gas Bulletin (2025 global mean, 153%, +56% forcing).');
    slides.push(s);
  }

  // ------------------------------------------------------------- 6 the market
  {
    const s = pres.addSlide();
    s.background = { color: T.PAPER };
    T.head(s, 'The market', 'A billion-dollar market that is not buying enough');
    s.addChart(pres.ChartType.bar, [
      { name: 'Issued', labels: ['2025'], values: [294] },
      { name: 'Retired', labels: ['2025'], values: [202] },
    ], T.chartOpts(pres, {
      x: T.M, y: 1.25, w: 4.9, h: 2.5,
      chartColors: [T.CLAY, T.SAGE],
      showLegend: true, legendPos: 'b', legendFontSize: 9, legendColor: '48654F',
      valAxisMinVal: 0, valAxisMaxVal: 320, valAxisMajorUnit: 80,
      showValue: true, dataLabelFontSize: 11, dataLabelColor: T.INK, dataLabelPosition: 'outEnd',
      catAxisLabelFontSize: 10,
      barGapWidthPct: 60,
    }));
    T.label(s, T.M, 3.95, 4.9, 'Million tonnes of CO₂ equivalent, 2025');
    T.para(s, T.M, 4.22, 4.9, 0.8,
      '294 Mt of credits issued against 202 Mt retired. The gap — 71 Mt in 2024 — is a permanent surplus of claims that exist on paper and are never used, and it is why prices keep falling.',
      { size: 10, color: '48654F', ls: 1.15 });

    T.panel(s, 5.75, 1.25, 3.7, 3.9, { fill: T.MIST });
    T.label(s, 5.98, 1.45, 3.3, 'The voluntary carbon market, 2025');
    const rows = [
      ['Primary market value', 'US$ 1.4 bn'],
      ['Credits issued', '294 MtCO₂e'],
      ['Credits retired', '202 MtCO₂e'],
      ['Registered projects', '10,200+'],
      ['Registries tracked', '18'],
      ['Credits issued since Paris', '2.6 bn'],
      ['Issued but never retired', '71 Mt'],
    ];
    rows.forEach((r, i) => {
      const y = 1.78 + i * 0.46;
      s.addText(r[0], { x: 5.98, y, w: 2.1, h: 0.4, fontSize: 9.5, color: '48654F', fontFace: T.FONT, margin: 0, valign: 'middle' });
      s.addText(r[1], { x: 8.0, y, w: 1.25, h: 0.4, fontSize: 11, bold: true, color: T.DEEP, fontFace: T.FONT, margin: 0, valign: 'middle', align: 'right' });
      s.addShape('rect', { x: 5.98, y: y + 0.4, w: 3.27, h: 0.008, fill: { color: T.LINE }, line: { color: T.LINE, width: 0 } });
    });
    T.para(s, 5.98, 4.9, 3.3, 0.3,
      'MSCI (2025) and UNCTAD (2025).',
      { size: 8, italic: true, color: '8A9C92' });
    T.pageNum(s, 6);
    T.source(s, 'Sources: MSCI, "Carbon Credits Come of Age in 2025"; UNCTAD, Role of Voluntary Carbon Markets in Global Climate Action (2025).');
    slides.push(s);
  }

  // ------------------------------------------------------ 7 integrity collapse
  {
    const s = pres.addSlide();
    s.background = { color: T.PAPER };
    T.head(s, 'The evidence', 'Most credits do not deliver what they claim');
    s.addChart(pres.ChartType.bar, [
      { name: 'Credits likely over-credited (%)', labels: ['Deforestation\nprojects, 6 countries', 'Multi-sector\nsynthesis', 'California forest\noffset programme', 'All credits\n(meta-analysis)'], values: [93, 88, 29, 80] },
    ], T.chartOpts(pres, {
      x: T.M, y: 1.22, w: 6.2, h: 3.35,
      chartColors: [T.CLAY],
      valAxisMinVal: 0, valAxisMaxVal: 100, valAxisMajorUnit: 25,
      showValue: true, dataLabelFontSize: 11, dataLabelColor: T.INK, dataLabelPosition: 'outEnd',
      catAxisLabelFontSize: 8.5,
      barGapWidthPct: 45,
    }));
    T.para(s, T.M, 4.62, 6.2, 0.4,
      'Share of issued credits likely to represent less real reduction than claimed.',
      { size: 9, italic: true, color: '48654F' });

    T.panel(s, 7.05, 1.22, 2.4, 1.5, { fill: T.CLAYBG, line: 'F0D8CC' });
    T.stat(s, 7.22, 1.34, 2.1, '> 80%', 'of issued credits had a lower climate impact than claimed (2,346 projects reviewed)',
      { vsize: 24, vh: 0.46, lsize: 8.5, lh: 0.62, color: T.CLAY });
    T.panel(s, 7.05, 2.84, 2.4, 1.36, { fill: T.CLAYBG, line: 'F0D8CC' });
    T.stat(s, 7.22, 2.96, 2.1, '16%', 'of credits likely report their climate impact accurately',
      { vsize: 24, vh: 0.46, lsize: 8.5, lh: 0.5, color: T.CLAY });
    T.panel(s, 7.05, 4.32, 2.4, 0.8, { fill: T.MIST, shadow: false });
    T.stat(s, 7.22, 4.38, 2.1, '64%', 'of Verra-approved auditors validated over-credited projects',
      { vsize: 16, vh: 0.3, lsize: 7.8, lh: 0.34, color: T.CLAY });
    T.pageNum(s, 7);
    T.source(s, 'Sources: Probs et al., Nature Communications (2024); US GAO-25-107128 (2025); Transparency International, Offsetting Accountability (2025).');
    slides.push(s);
  }

  // ------------------------------------------------------- 8 why it stays broken
  {
    const s = pres.addSlide();
    s.background = { color: T.PAPER };
    T.head(s, 'The diagnosis', 'Quality is judged. Identity is not tracked.');
    T.para(s, T.M, 1.18, 8.9, 0.4,
      'Carbon credit quality rests on four principles. The industry has built serious machinery for the first three. The fourth is the one that breaks.',
      { size: 11.5, color: T.INK });

    const princ = [
      ['Additionality', 'Would it have happened without the credit?', 'Worked', T.ACC],
      ['Permanence', 'What if the forest is later cut down?', 'Worked', T.ACC],
      ['Robust quantification', 'Is the tonnes number conservative and measured?', 'Worked', T.ACC],
      ['No double counting', 'Is this tonne sold twice?', 'BROKEN', T.CLAY],
    ];
    princ.forEach((p, i) => {
      const x = T.M + i * 2.28;
      T.panel(s, x, 1.78, 2.12, 1.62, { fill: p[3] === T.CLAY ? T.CLAYBG : T.MIST, line: p[3] === T.CLAY ? 'F0D8CC' : T.LINE });
      s.addText(p[0], { x: x + 0.16, y: 1.94, w: 1.8, h: 0.5, fontSize: 11, bold: true, color: T.DEEP, fontFace: T.FONT, margin: 0 });
      s.addText(p[1], { x: x + 0.16, y: 2.46, w: 1.8, h: 0.62, fontSize: 8.8, color: '48654F', fontFace: T.FONT, margin: 0, lineSpacingMultiple: 1.05 });
      T.pill(s, x + 0.16, 3.08, 0.86, p[2], { fill: p[3], color: T.CREAM });
    });

    T.barPanel(s, T.M, 3.62, 8.9, 1.42, T.CLAY, { fill: T.CLAYBG, line: 'F0D8CC' });
    T.para(s, T.M + 0.22, 3.78, 8.4, 0.9,
      'Double counting is a <b>bookkeeping</b> problem, not a measurement problem. It happens because the record of who owns and has retired a tonne of carbon lives in incompatible registries and trading platforms that cannot talk to each other. UNCTAD puts it plainly: incompatible registries make it difficult to track and verify credits, which increases the risk of double counting and undermines market credibility. When a tonne can be claimed twice, a buyer cannot trust the claim — and the market shrinks. Transaction value fell 61% from $1.9 bn in 2022 to $723 m in 2023.',
      { size: 10, color: '5A3A28', ls: 1.12 });
    T.pageNum(s, 8);
    T.source(s, 'Sources: ICVCM Core Carbon Principles; UNCTAD (2025); Ecosystem Marketplace via Transparency International (2025).');
    slides.push(s);
  }

  // --------------------------------------------------------- 9 India at scale
  {
    const s = pres.addSlide();
    s.background = { color: T.PAPER };
    T.head(s, 'India', 'The verification problem, at Indian scale');
    const kpis = [
      ['8.27 lakh km²', 'forest + tree cover — 25.17% of the country'],
      ['30.43 bn t', 'carbon stock held in Indian forests'],
      ['2.29 of 3.0 bn t', 'NDC carbon-sink target already met'],
      ['268 crore', 'saplings planted under Plant4Mother, 2024-26'],
    ];
    kpis.forEach((k, i) => {
      const x = T.M + (i % 2) * 2.35;
      const y = 1.25 + Math.floor(i / 2) * 1.32;
      T.panel(s, x, y, 2.2, 1.16, { fill: T.MIST });
      T.stat(s, x + 0.16, y + 0.12, 1.9, k[0], k[1], { vsize: 17, vh: 0.4, lsize: 8.3, lh: 0.42 });
    });
    T.panel(s, 5.35, 1.25, 4.1, 3.48, { fill: T.MIST });
    T.label(s, 5.58, 1.45, 3.6, 'The bottleneck is not planting');
    T.bullets(s, 5.58, 1.75, 3.6, [
      { t: '3.20 lakh hectares of compensatory afforestation funded since FY21 — each hectare needs evidence.' },
      { t: 'A billion saplings is a number. Which tree, planted where, by whom, surviving how long — is a ledger.' },
      { t: 'If the registry cannot say which farmer planted what, the credit cannot be defended.' },
      { t: 'The verification step, not the planting step, is what scales badly.' },
    ], { size: 9.8, gap: 0.62, dot: T.ACC });
    T.para(s, 5.58, 4.28, 3.6, 0.4,
      'This is the problem GreenToken addresses.',
      { size: 11, bold: true, color: T.DEEP });
    T.pageNum(s, 9);
    T.source(s, 'Sources: India State of Forest Report (ISFR) 2023, Forest Survey of India; MoEFCC PIB releases on CAMPA and Plant4Mother.');
    slides.push(s);
  }

  return slides;
}

module.exports = { build };
