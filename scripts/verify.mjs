/**
 * End-to-end verification of the GreenToken demo.
 * Drives the real UI in Chromium: boots the app, walks every page, and
 * exercises plant -> verify -> fund -> settle plus the tamper-detection demo.
 */
import { createRequire } from 'module';
import fs from 'fs';

const require = createRequire('/usr/local/lib/node_modules/');
const { chromium } = require('playwright');

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:4173/';
const SHOTS = process.env.SHOTS_DIR ?? '/workspace/greentoken/docs/screenshots';
fs.mkdirSync(SHOTS, { recursive: true });

const errors = [];
const results = [];

function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}

const shot = async (page, name) => {
  await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: false });
  console.log(`      📸 ${name}.png`);
};

/** Read every toast currently on screen and join their text. */
const toastText = async (page) => {
  const toasts = await page.$$('.toast');
  const parts = [];
  for (const t of toasts) parts.push((await t.textContent()) ?? '');
  return parts.join(' || ');
};

const switchIdentity = async (page, name) => {
  await page.click('.identity__btn');
  await page.waitForSelector('.menu', { state: 'visible' });
  await page.click(`.menu__item:has-text("${name}")`);
  await page.waitForTimeout(250);
};

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH ?? '/root/.cache/ms-playwright/chromium-1243/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const ctx = await browser.newContext({
    viewport: { width: 1600, height: 1000 },
    deviceScaleFactor: 2,
    locale: 'en-IN',
  });
  const page = await ctx.newPage();

  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

  console.log(`\n▶ Loading ${BASE}`);
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForSelector('.hero__title', { timeout: 20000 });
  check('app boots and renders dashboard', true);

  const title = await page.textContent('.hero__title');
  check('hero content present', /Plant it/.test(title ?? ''), title?.trim());

  // --- stats populated from the seeded ledger
  await page.waitForSelector('.stat__value');
  const stats = await page.$$eval('.stat__value', (els) => els.map((e) => e.textContent.trim()));
  check('dashboard stats populated', stats.length >= 6, stats.join(' | '));

  const feedRows = await page.$$('.feed__row');
  check('live event feed populated', feedRows.length > 5, `${feedRows.length} events`);

  const blocks = await page.$$eval('.chainpill__sub', (els) => els.map((e) => e.textContent.trim()));
  const heightMatch = blocks[0]?.match(/(\d+)\s+blocks/);
  check('ledger height > 0', !!heightMatch && Number(heightMatch[1]) > 0, blocks[0]);

  await shot(page, '01-dashboard');

  // --- discover page
  await page.click('.nav__item:has-text("Discover & Fund")');
  await page.waitForSelector('.tgrid');
  await page.waitForTimeout(1200);
  const tokenCards = await page.$$('.tcard');
  check('marketplace lists tokens', tokenCards.length > 0, `${tokenCards.length} cards`);
  await shot(page, '02-discover-map');

  // --- plant a tree as a planter
  await page.click('.nav__item:has-text("Plant a Tree")');
  await page.waitForSelector('.dropzone');
  await switchIdentity(page, 'Lakshmi Gowda');
  await page.click('button:has-text("Generate sample proof")');
  await page.waitForTimeout(600);
  const geoFilled = await page.$eval('.geo__input', (e) => e.value);
  check('sample proof fills coordinates', geoFilled.length > 0, geoFilled);
  await shot(page, '03-plant-form');

  await page.click('button:has-text("Submit planting proof")');
  await page.waitForSelector('.toast', { timeout: 10000 });
  await page.waitForTimeout(900);
  const plantToast = await toastText(page);
  check('planting submitted to ledger', /awaiting verification/i.test(plantToast), plantToast.trim().slice(0, 110));
  await shot(page, '04-plant-submitted');

  // --- verification queue
  await page.click('.nav__item:has-text("Verification")');
  await page.waitForSelector('.qgrid');
  await page.waitForTimeout(400);
  const qcards = await page.$$('.qcard');
  check('verification queue shows the new proof', qcards.length > 0, `${qcards.length} pending`);

  await switchIdentity(page, 'Dr. S. Raghavan');
  const endorseBtns = await page.$$('button:has-text("Endorse")');
  check('endorser can endorse', endorseBtns.length > 0, `${endorseBtns.length} buttons`);
  await endorseBtns[0].click();
  await page.waitForTimeout(1100);
  const endorseToast = await toastText(page);
  check('endorsement recorded', /Endorsement recorded|Quorum/i.test(endorseToast), endorseToast.trim().slice(0, 110));
  await shot(page, '05-verification-queue');

  // --- fund as a funder
  await page.click('.nav__item:has-text("Discover & Fund")');
  await page.waitForSelector('.tgrid');
  await page.waitForTimeout(500);
  await switchIdentity(page, 'Aarav Menon');
  const picks = await page.$$('.tcard__pick');
  check('funder can select verified tokens', picks.length > 0, `${picks.length} selectable`);
  for (const p of picks.slice(0, 2)) await p.click();
  await page.waitForTimeout(500);
  const total = await page.textContent('.invoice__row--total strong');
  check('invoice computes a net total', /₹[\d,]+/.test(total ?? ''), total?.trim());
  await shot(page, '06-funding-basket');

  await page.click('button:has-text("Issue invoice & fund")');
  await page.waitForTimeout(1300);
  const fundToast = await toastText(page);
  check('funding invoice issued', /invoice.*issued/i.test(fundToast), fundToast.trim().slice(0, 110));

  // --- invoices page
  await page.click('.nav__item:has-text("Invoices")');
  await page.waitForSelector('.invgrid');
  await page.waitForTimeout(500);
  const invCards = await page.$$('.invcard');
  check('invoice list renders', invCards.length > 0, `${invCards.length} invoices`);
  await shot(page, '07-invoices');

  // --- leaderboard
  await page.click('.nav__item:has-text("Leaderboard")');
  await page.waitForSelector('.podium');
  await page.waitForTimeout(500);
  const podium = await page.$$('.podium__item');
  check('leaderboard podium renders', podium.length === 3, `${podium.length} podium slots`);
  await shot(page, '08-leaderboard');

  // --- ledger explorer + tamper detection
  await page.click('.nav__item:has-text("Ledger Explorer")');
  await page.waitForSelector('.integritycard');
  await page.waitForTimeout(400);
  const blocksBefore = await page.$$('.block');
  check('ledger explorer lists blocks', blocksBefore.length > 0, `${blocksBefore.length} blocks`);
  await shot(page, '09-ledger-explorer');

  await page.click('button:has-text("Tamper with last block")');
  await page.waitForTimeout(1200);
  const brokenTitle = await page.textContent('.integritycard__title');
  check('tampering is detected', /Tampering detected/i.test(brokenTitle ?? ''), brokenTitle?.trim());
  await shot(page, '10-tamper-detected');

  await page.click('button:has-text("Restore chain")');
  await page.waitForTimeout(1200);
  const restoredTitle = await page.textContent('.integritycard__title');
  check('chain restores cleanly', /integrity verified/i.test(restoredTitle ?? ''), restoredTitle?.trim());

  // expand a block
  await page.click('.block__head');
  await page.waitForTimeout(500);
  const hasTx = await page.$$('.tx');
  check('block expands to show transactions', hasTx.length > 0, `${hasTx.length} tx`);
  await shot(page, '11-block-detail');

  // --- token detail
  await page.click('.nav__item:has-text("Discover & Fund")');
  await page.waitForSelector('.filters');
  await page.selectOption('.filters select >> nth=0', 'ALL');
  await page.waitForTimeout(700);
  await page.click('.tcard__media');
  await page.waitForSelector('.tdhead');
  await page.waitForTimeout(600);
  const hasRaw = await page.$('.json');
  check('token detail shows readable token', hasRaw !== null);
  await shot(page, '12-token-provenance');

  // --- error summary
  const realErrors = errors.filter((e) => !/favicon|tile\.openstreetmap|ERR_INTERNET|net::ERR/i.test(e));
  check('no console errors', realErrors.length === 0, realErrors.slice(0, 3).join(' / '));

  await browser.close();

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${'='.repeat(60)}`);
  console.log(`RESULT: ${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    console.log('FAILURES:');
    failed.forEach((f) => console.log(`  ✗ ${f.name} ${f.detail}`));
  }
  process.exit(failed.length ? 1 : 0);
})().catch((e) => {
  console.error('VERIFY CRASHED:', e);
  process.exit(2);
});
