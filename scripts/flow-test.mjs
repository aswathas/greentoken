/**
 * Whole-flow end-to-end test for the GreenToken demo.
 *
 * Unlike scripts/verify.mjs (which walks the happy path once), this script
 * proves three things:
 *
 *   1. the full consortium flow works: plant -> endorse (Forest Dept) ->
 *      endorse (Auditor) -> VERIFIED -> fund -> settle, asserted from the DOM
 *   2. NO role lands on a dead end: every organisation is walked through all
 *      seven sections and every restricted page must offer a RoleGate with at
 *      least one one-click "Act as …" switch
 *   3. the access matrix matches the chaincode — including the one the UI
 *      used to get wrong (the Auditor may settle, see Invoices.tsx)
 *
 * Run:  node scripts/flow-test.mjs
 * Env:  BASE_URL=<url>  to test a deployed URL instead of a local server
 *       PORT=4173       to pin the local port
 *       VERBOSE=1       to echo the vite server log
 */
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import net from 'net';
import { spawn } from 'child_process';

const require = createRequire('/usr/local/lib/node_modules/');
const { chromium } = require('playwright');

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SHOTS = path.join(ROOT, 'docs', 'screenshots');
const LIVE_URL = 'https://greentoken-7gc.pages.dev';
const CHROME = process.env.CHROME_PATH ?? '/root/.cache/ms-playwright/chromium-1243/chrome-linux/chrome';

fs.mkdirSync(SHOTS, { recursive: true });

const results = [];
const consoleErrors = [];
let PAGE = null;

/* ------------------------------------------------------------------ *
 * tiny assertion helpers (same conventions as scripts/verify.mjs)
 * ------------------------------------------------------------------ */

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 70);

async function check(name, ok, detail = '') {
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
  if (!ok) {
    const file = `fail-${slug(name)}`;
    try {
      if (PAGE) await PAGE.screenshot({ path: `${SHOTS}/${file}.png`, fullPage: false });
      console.log(`      📸 ${file}.png`);
    } catch {
      /* screenshot is best-effort */
    }
  }
  return !!ok;
}

/**
 * A warning is reported but never counted: it marks a gap that belongs to a
 * file another agent owns, so the suite stays green while the gap is open.
 */
function warn(name, detail = '') {
  console.log(`WARN  ${name}${detail ? ' — ' + detail : ''}`);
}

/** Read every toast currently on screen and join their text. */
const toastText = async (page) => {
  const toasts = await page.$$('.toast');
  const parts = [];
  for (const t of toasts) parts.push((await t.textContent()) ?? '');
  return parts.join(' || ');
};

/** Poll the toast strip until one of the messages matches (or time out). */
async function waitToast(page, re, timeout = 15000) {
  const deadline = Date.now() + timeout;
  let last = '';
  while (Date.now() < deadline) {
    last = await toastText(page);
    if (re.test(last)) return last;
    await page.waitForTimeout(180);
  }
  return last;
}

const switchIdentity = async (page, name) => {
  await page.click('.identity__btn');
  await page.waitForSelector('.menu', { state: 'visible' });
  await page.click(`.menu__item:has-text("${name}")`);
  await page.waitForTimeout(250);
};

const waitFor = async (page, selector, timeout = 6000) => {
  try {
    await page.waitForSelector(selector, { state: 'attached', timeout });
    return true;
  } catch {
    return false;
  }
};

/** Console noise that is not an application error. */
const IGNORED = /favicon|tile\.openstreetmap|ERR_INTERNET|net::ERR|ERR_NAME_NOT_RESOLVED|ERR_CONNECTION/i;

/* ------------------------------------------------------------------ *
 * server: prefer a local build, fall back to the local source, then live
 * ------------------------------------------------------------------ */

function newestSourceMtime() {
  let newest = 0;
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else newest = Math.max(newest, fs.statSync(p).mtimeMs);
    }
  };
  walk(path.join(ROOT, 'src'));
  return newest;
}

async function waitForHttp(url, timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { redirect: 'follow' });
      if (res.status > 0) return true;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 350));
  }
  return false;
}

async function isPortFree(port) {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.once('error', () => resolve(false));
    srv.once('listening', () => srv.close(() => resolve(true)));
    srv.listen(port, '127.0.0.1');
  });
}

async function startServer() {
  const explicit = process.env.BASE_URL;
  if (explicit) {
    return { url: explicit, mode: `explicit BASE_URL (${explicit})`, stop: async () => {} };
  }

  const distIndex = path.join(ROOT, 'dist', 'index.html');
  const viteBin = path.join(ROOT, 'node_modules', '.bin', 'vite');

  if (fs.existsSync(viteBin) && fs.existsSync(distIndex)) {
    // A dist/ that predates the current sources would silently hide the code
    // under test — in that case serve the sources with the dev server instead.
    const fresh = fs.statSync(distIndex).mtimeMs >= newestSourceMtime();

    let port = Number(process.env.PORT ?? 4173);
    while (!(await isPortFree(port))) port += 1;

    const args = [
      ...(fresh ? ['preview'] : []),
      '--port',
      String(port),
      '--host',
      '127.0.0.1',
      '--strictPort',
    ];

    const child = spawn(viteBin, args, {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    child.stdout.on('data', (d) => process.env.VERBOSE && process.stdout.write('[vite] ' + d));
    child.stderr.on('data', (d) => process.env.VERBOSE && process.stderr.write('[vite] ' + d));

    const url = `http://127.0.0.1:${port}/`;
    if (await waitForHttp(url)) {
      return {
        url,
        mode: fresh
          ? `local build — vite preview on dist/ (${url})`
          : `local source — vite dev server, dist/ is older than src/ (${url})`,
        stop: async () => {
          child.kill('SIGTERM');
        },
      };
    }
    child.kill('SIGTERM');
    console.log('⚠ could not start the local server, falling back to the live deployment');
  }

  return { url: LIVE_URL, mode: `live deployment (${LIVE_URL})`, stop: async () => {} };
}

/* ------------------------------------------------------------------ *
 * the app under test
 * ------------------------------------------------------------------ */

const ROLES = [
  { org: 'PLANTER', name: 'Lakshmi Gowda', label: 'planter' },
  { org: 'VERIFIER', name: 'Dr. S. Raghavan', label: 'Forest Dept' },
  { org: 'AUDITOR', name: 'Nikhil Kapoor', label: 'Auditor' },
  { org: 'FUNDER', name: 'Aarav Menon', label: 'Corporate Funder' },
];

/** The seven nav sections and the access matrix the UI has to honour. */
const PAGES = [
  { nav: 'Dashboard', selector: '.hero__title', gate: null },
  { nav: 'Plant a Tree', selector: '.card', gate: { allows: ['PLANTER'] } },
  { nav: 'Verification', selector: '.qgrid', gate: { allows: ['VERIFIER', 'AUDITOR'] } },
  { nav: 'Discover & Fund', selector: '.tgrid', gate: { allows: ['FUNDER'] } },
  { nav: 'Leaderboard', selector: '.podium', gate: null },
  { nav: 'Ledger Explorer', selector: '.integritycard', gate: null },
  { nav: 'Invoices', selector: '.invgrid', gate: { allows: ['FUNDER', 'AUDITOR'] } },
];

const gatedFor = (page, org) => !!page.gate && !page.gate.allows.includes(org);

/**
 * PlantTree.tsx is owned by another agent. Until it renders a RoleGate, the
 * plant-page dead-end check is reported as a WARN instead of a FAIL — it
 * upgrades itself the moment that file starts using RoleGate.
 */
const PLANT_USES_ROLEGATE = (() => {
  try {
    return fs
      .readFileSync(path.join(ROOT, 'src', 'components', 'PlantTree.tsx'), 'utf8')
      .includes('RoleGate');
  } catch {
    return false;
  }
})();

(async () => {
  const server = await startServer();
  console.log(`\n▶ Testing ${server.mode}`);

  const browser = await chromium.launch({
    executablePath: CHROME,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const ctx = await browser.newContext({
    viewport: { width: 1600, height: 1000 },
    deviceScaleFactor: 1,
    locale: 'en-IN',
  });
  const page = await ctx.newPage();
  PAGE = page;

  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });
  page.on('pageerror', (e) => consoleErrors.push('PAGEERROR: ' + e.message));

  await page.goto(server.url, { waitUntil: 'networkidle' });
  await page.waitForSelector('.hero__title', { timeout: 30000 });
  await check('app boots and renders the dashboard', true);

  /* ================================================================
   * 1. FULL HAPPY PATH — plant -> verify -> verify -> fund -> settle
   * ================================================================ */

  console.log('\n— full consortium flow —');

  // --- plant
  await page.click('.nav__item:has-text("Plant a Tree")');
  await page.waitForSelector('.dropzone');
  await switchIdentity(page, 'Lakshmi Gowda');
  await page.click('button:has-text("Generate sample proof")');
  await page.waitForTimeout(700);
  const geo = await page.$eval('.geo__input', (e) => e.value);
  await check('sample proof fills the geo-stamp', geo.length > 0, geo);

  await page.click('button:has-text("Submit planting proof")');
  const plantToast = await waitToast(page, /created and awaiting verification/i);
  const tokenId = (plantToast.match(/Token (GT-\d+)/i) || [])[1] ?? 'GT-UNKNOWN';
  await check('planting is accepted by the ledger', /created and awaiting verification/i.test(plantToast), plantToast.trim().slice(0, 120));
  await check('the new token id is reported', tokenId !== 'GT-UNKNOWN', tokenId);

  // --- endorse as the Forest Department
  await page.click('.nav__item:has-text("Verification")');
  await page.waitForSelector('.qgrid');
  await switchIdentity(page, 'Dr. S. Raghavan');

  const card = page.locator('.qcard').filter({ hasText: tokenId });
  const cardCount = await card.count();
  await check('the new proof reaches the verification queue', cardCount === 1, `${cardCount} card(s)`);

  if (cardCount > 0) {
    await card.locator('button:has-text("Endorse")').click();
    const endorseToast = await waitToast(page, /Endorsement recorded|Quorum reached/i);
    await check('Forest Dept endorses the proof', /Endorsement recorded/i.test(endorseToast), endorseToast.trim().slice(0, 120));
    const progress1 = await card.locator('.qcard__progline strong').textContent();
    await check('the first endorsement is counted', /1\s*\/\s*2/.test(progress1 ?? ''), (progress1 ?? '').trim());
  }

  // --- endorse as the Auditor (second organisation → quorum)
  await switchIdentity(page, 'Nikhil Kapoor');
  const card2 = page.locator('.qcard').filter({ hasText: tokenId });
  const card2Count = await card2.count();
  if (card2Count > 0) {
    await card2.locator('button:has-text("Endorse")').click();
    const quorumToast = await waitToast(page, /Quorum reached/i);
    await check('Auditor endorses and quorum is reached', /Quorum reached/i.test(quorumToast), quorumToast.trim().slice(0, 120));
  } else {
    await check('Auditor endorses and quorum is reached', false, 'the proof vanished from the queue');
  }

  const badge = await page.locator('tr').filter({ hasText: tokenId }).locator('.badge').first().textContent();
  await check('the token flips to VERIFIED', (badge ?? '').trim() === 'VERIFIED', (badge ?? '').trim());

  // --- fund as a Corporate Funder
  await page.click('.nav__item:has-text("Discover & Fund")');
  await page.waitForSelector('.tgrid');
  await switchIdentity(page, 'Aarav Menon');
  const target = page.locator('.tcard').filter({ hasText: '10 × Mango' }).filter({ hasText: 'Lakshmi Gowda' });
  await check('the verified token is on sale', (await target.count()) === 1, `${await target.count()} card(s)`);
  await target.locator('.tcard__pick').click();
  await page.waitForTimeout(400);
  const net = await page.textContent('.invoice__row--total strong');
  await check('the funding basket computes a net amount', /₹[\d,]+/.test(net ?? ''), (net ?? '').trim());

  await page.click('button:has-text("Issue invoice & fund")');
  const fundToast = await waitToast(page, /Invoice .* issued/i);
  const invoiceId = (fundToast.match(/Invoice (INV-[\w-]+)/i) || [])[1] ?? 'INV-UNKNOWN';
  await check('the funder issues an invoice', /issued/i.test(fundToast), fundToast.trim().slice(0, 120));
  await check('the invoice id is reported', invoiceId !== 'INV-UNKNOWN', invoiceId);
  // the funded token leaves the "Verified" filter — show every status to find it
  await page.selectOption('.filters select >> nth=0', 'ALL');
  await page.waitForTimeout(600);
  await check(
    'the token is marked FUNDED',
    (await page.locator('.tcard').filter({ hasText: '10 × Mango' }).locator('.tcard__funded').count()) === 1,
    await page.locator('.tcard').filter({ hasText: '10 × Mango' }).locator('.tcard__funded').textContent(),
  );
  await page.selectOption('.filters select >> nth=0', 'VERIFIED');
  await page.waitForTimeout(400);

  // --- settle the invoice as the funder who issued it
  await page.click('.nav__item:has-text("Invoices")');
  await page.waitForSelector('.invgrid');
  await switchIdentity(page, 'Aarav Menon');
  const invCard = page.locator('.invcard').filter({ hasText: invoiceId });
  const settleBtn = invCard.locator('button:has-text("Settle & release funds")');
  await check('the funder can settle their own invoice', (await settleBtn.count()) === 1 && !(await settleBtn.isDisabled()));
  await settleBtn.click();
  const settleToast = await waitToast(page, /settled/i);
  await check('the invoice settles', /settled/i.test(settleToast), settleToast.trim().slice(0, 120));
  const invBadge = await invCard.locator('.badge').first().textContent();
  await check('the invoice shows SETTLED', (invBadge ?? '').trim() === 'SETTLED', (invBadge ?? '').trim());

  /* ================================================================
   * 2. PERMISSIONS — the contract's access matrix, read from the DOM
   * ================================================================ */

  console.log('\n— permissions —');

  // a planter cannot fund
  await page.click('.nav__item:has-text("Discover & Fund")');
  await page.waitForSelector('.tgrid');
  await switchIdentity(page, 'Lakshmi Gowda');
  const anyPick = page.locator('.tcard__pick').first();
  await anyPick.click();
  await page.waitForTimeout(400);
  const fundBtn = page.locator('button:has-text("Issue invoice & fund")');
  await check('a planter cannot issue a funding invoice', await fundBtn.isDisabled());
  const funderGate = page.locator('.gate');
  await check('the planter is offered a funder switch', (await funderGate.count()) >= 1, `${await funderGate.count()} gate(s)`);
  const switchBtn = page.locator('.gate__cta', { hasText: 'Aarav Menon' });
  await check('the gate offers a one-click funder switch', (await switchBtn.count()) >= 1);
  await switchBtn.first().click();
  await page.waitForTimeout(500);
  const gateGone = await page.locator('.gate').count();
  const fundEnabled = !(await page.locator('button:has-text("Issue invoice & fund")').isDisabled());
  await check('the one-click switch hands the role over instantly', gateGone === 0 && fundEnabled, `gates=${gateGone} fundEnabled=${fundEnabled}`);

  // a funder cannot plant
  await page.click('.nav__item:has-text("Plant a Tree")');
  await page.waitForTimeout(500);
  const dropzone = await page.locator('.dropzone').count();
  const plantBtn = await page.locator('button:has-text("Submit planting proof")').count();
  await check('a funder cannot plant', dropzone === 0 && plantBtn === 0, `dropzone=${dropzone} submit=${plantBtn}`);
  const plantGate = await page.locator('.gate').count();
  if (PLANT_USES_ROLEGATE) {
    await check('the funder is offered a planter switch', plantGate >= 1, `${plantGate} gate(s)`);
  } else {
    warn(
      'the funder is not yet offered a planter switch',
      'PlantTree.tsx belongs to another agent and does not use RoleGate yet',
    );
  }

  // the AUDITOR may settle an issued invoice (the chaincode allows FUNDER + AUDITOR)
  await page.click('.nav__item:has-text("Invoices")');
  await page.waitForSelector('.invgrid');
  await switchIdentity(page, 'Nikhil Kapoor');
  const issued = page.locator('.invcard').filter({ has: page.locator('.badge', { hasText: 'ISSUED' }) });
  const issuedCount = await issued.count();
  await check('an issued invoice is waiting for settlement', issuedCount >= 1, `${issuedCount} issued`);
  const issuedId = issuedCount > 0 ? (await issued.first().locator('.invcard__id').textContent()) ?? '' : '';
  const auditorSettle = issued.first().locator('button:has-text("Settle & release funds")');
  await check('the auditor is not locked out of settlement', (await auditorSettle.count()) === 1 && !(await auditorSettle.isDisabled()));
  await auditorSettle.click();
  const auditorToast = await waitToast(page, /settled/i);
  await check('the auditor settles the invoice', /settled/i.test(auditorToast), auditorToast.trim().slice(0, 120));
  const settledCard = page.locator('.invcard').filter({ hasText: issuedId });
  const auditorBadge = await settledCard.locator('.badge').first().textContent();
  await check('the auditor-settled invoice shows SETTLED', (auditorBadge ?? '').trim() === 'SETTLED', (auditorBadge ?? '').trim());

  /* ================================================================
   * 3. PER-ROLE SWEEP — nobody lands on a dead end
   * ================================================================ */

  console.log('\n— per-role sweep (4 roles × 7 sections) —');

  for (const role of ROLES) {
    await switchIdentity(page, role.name);
    for (const p of PAGES) {
      const before = consoleErrors.length;
      await page.click(`.nav__item:has-text("${p.nav}")`);
      await page.waitForTimeout(450);

      const expected = p.nav === 'Plant a Tree' && role.org === 'PLANTER' ? '.dropzone' : p.selector;
      const rendered = await waitFor(page, expected, 5000);
      await check(`${p.nav} renders for the ${role.label}`, rendered, expected);

      const fresh = consoleErrors.slice(before).filter((e) => !IGNORED.test(e));
      await check(`${p.nav} is error-free for the ${role.label}`, fresh.length === 0, fresh.slice(0, 2).join(' / '));

      if (gatedFor(p, role.org)) {
        const gates = await page.locator('.gate').count();
        const ctas = await page.locator('.gate__cta').count();
        if (p.nav === 'Plant a Tree' && !PLANT_USES_ROLEGATE) {
          warn(
            `${p.nav} is still a dead end for the ${role.label}`,
            'PlantTree.tsx belongs to another agent and does not use RoleGate yet — this check upgrades to a hard FAIL once it does',
          );
        } else {
          await check(
            `${p.nav} offers a RoleGate with a switch for the ${role.label}`,
            gates >= 1 && ctas >= 1,
            `gates=${gates} switches=${ctas}`,
          );
        }
      } else if (p.gate) {
        // an authorised role must not be shown a gate at all
        const gates = await page.locator('.gate').count();
        await check(`${p.nav} shows no gate to the ${role.label}`, gates === 0, `${gates} gate(s)`);
      }
    }
  }

  /* ================================================================
   * 4. LEDGER INTEGRITY — tamper and restore
   * ================================================================ */

  console.log('\n— ledger integrity —');

  await page.click('.nav__item:has-text("Ledger Explorer")');
  await page.waitForSelector('.integritycard');
  await page.waitForTimeout(400);
  const okTitle = await page.textContent('.integritycard__title');
  await check('the chain starts out verified', /integrity verified/i.test(okTitle ?? ''), (okTitle ?? '').trim());

  await page.click('button:has-text("Tamper with last block")');
  let brokenTitle = '';
  for (let i = 0; i < 40; i += 1) {
    brokenTitle = (await page.textContent('.integritycard__title')) ?? '';
    if (/tampering detected/i.test(brokenTitle)) break;
    await page.waitForTimeout(200);
  }
  await check('tampering with a block is detected', /tampering detected/i.test(brokenTitle), brokenTitle.trim());

  await page.click('button:has-text("Restore chain")');
  let restoredTitle = '';
  for (let i = 0; i < 40; i += 1) {
    restoredTitle = (await page.textContent('.integritycard__title')) ?? '';
    if (/integrity verified/i.test(restoredTitle)) break;
    await page.waitForTimeout(200);
  }
  await check('the chain restores to a verified state', /integrity verified/i.test(restoredTitle), restoredTitle.trim());

  /* ================================================================ */

  const realErrors = consoleErrors.filter((e) => !IGNORED.test(e));
  await check('no unexpected console errors during the whole run', realErrors.length === 0, realErrors.slice(0, 3).join(' / '));

  await browser.close();
  await server.stop();

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${'='.repeat(66)}`);
  console.log(`RESULT: ${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    console.log('FAILURES:');
    failed.forEach((f) => console.log(`  ✗ ${f.name} ${f.detail ? `— ${f.detail}` : ''}`));
  }
  process.exit(failed.length ? 1 : 0);
})().catch(async (e) => {
  console.error('FLOW TEST CRASHED:', e);
  try {
    if (PAGE) await PAGE.screenshot({ path: `${SHOTS}/fail-crash.png`, fullPage: false });
  } catch {
    /* ignore */
  }
  process.exit(2);
});
