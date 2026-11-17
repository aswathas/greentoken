/**
 * build-deck.js — assembles "A Promise That Keeps Itself".
 *
 *   node build/build-deck.js
 *
 * 13 spoken slides (exactly 10:00) + 8 appendix slides = 21.
 * Every slide carries a visual and real speaker notes.
 */
const path = require('path');
const fs = require('fs');
const PptxGenJS = require('pptxgenjs');

const spoken = require('./spoken');
const appendix = require('./appendix');

const OUT_DIR = path.join(__dirname, '..', 'output');
const OUT_FILE = path.join(OUT_DIR, 'SmartContract-A-Promise-That-Keeps-Itself.pptx');

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const pres = new PptxGenJS();
  pres.layout = 'LAYOUT_WIDE'; // 13.333 x 7.5 in
  pres.author = 'Aswath AS';
  pres.company = 'SRM Institute of Science and Technology';
  pres.title = 'A Promise That Keeps Itself — Smart Contract and its Applications';
  pres.subject = '21CSE435T · Smart Contracts and Application Development · GreenToken';

  spoken.forEach((fn) => fn(pres));
  appendix.forEach((fn) => fn(pres));

  return pres.writeFile({ fileName: OUT_FILE }).then(() => {
    const kb = (fs.statSync(OUT_FILE).size / 1024).toFixed(1);
    console.log(`wrote ${OUT_FILE}`);
    console.log(`slides: ${spoken.length} spoken + ${appendix.length} appendix = ${spoken.length + appendix.length}`);
    console.log(`size: ${kb} KB`);
  });
}

main().catch((e) => {
  console.error('BUILD FAILED:', e);
  process.exit(1);
});
