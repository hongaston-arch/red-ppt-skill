#!/usr/bin/env node
// Optional browser QA. Install Playwright separately; it is not a runtime dependency of a deck.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

const { values } = parseArgs({ options: {
  url: { type: 'string' }, output: { type: 'string' },
  'playwright-module': { type: 'string' }, chrome: { type: 'string' },
  'lucide-umd': { type: 'string' }, 'system-fonts': { type: 'boolean', default: false },
} });
if (!values.url || !values.output || !values['playwright-module']) {
  throw new Error('Required: --url <served-example-url> --output <qa-directory> --playwright-module <index.mjs>; optional --chrome <binary> --lucide-umd <file> --system-fonts');
}
const { chromium } = await import(pathToFileURL(resolve(values['playwright-module'])).href);
const output = resolve(values.output);
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({
  ...(values.chrome ? { executablePath: values.chrome } : {}), headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const report = { browser: await browser.version(),
  fontMode: values['system-fonts'] ? 'system fallback; Google Fonts blocked' : 'normal font loading',
  lucideMode: values['lucide-umd'] ? 'served from supplied local UMD' : 'normal CDN loading',
  measurements: [], interactions: [], pageErrors: [] };

async function context(viewport) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  if (values['system-fonts']) await ctx.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//, route => route.abort());
  if (values['lucide-umd']) await ctx.route(/https:\/\/unpkg\.com\/lucide[^/]*\//,
    route => route.fulfill({ path: resolve(values['lucide-umd']), contentType: 'application/javascript' }));
  ctx.on('page', page => page.on('pageerror', error => report.pageErrors.push(error.message)));
  return ctx;
}
async function settled(page) {
  // go() defers the recipe by 450ms and guards navigation for 700ms.
  await page.waitForTimeout(800);
  await page.waitForFunction(() => document.getAnimations().every(animation => animation.playState !== 'running'), null, { timeout: 10000 });
}

try {
  for (const viewport of [{ width: 1920, height: 1080 }, { width: 1600, height: 900 }, { width: 1280, height: 720 }]) {
    const ctx = await context(viewport), page = await ctx.newPage();
    await page.goto(values.url, { waitUntil: 'load' });
    await settled(page);
    for (let index = 0; index < 2; index++) {
      if (index) { await page.keyboard.press('ArrowRight'); await page.waitForFunction(() => window.__currentSlideIndex === 1); await settled(page); }
      const result = await page.evaluate(() => {
        const slide = document.querySelectorAll('#deck > .slide')[window.__currentSlideIndex || 0];
        const origin = slide.getBoundingClientRect();
        const rect = node => { const r = node.getBoundingClientRect(); return {
          left: r.left - origin.left, top: r.top - origin.top,
          right: r.right - origin.left, bottom: r.bottom - origin.top,
          width: r.width, height: r.height,
        }; };
        const grid = slide.querySelector('.matrix-fill'), css = getComputedStyle(grid);
        const cells = [...slide.querySelectorAll('.matrix-cell')];
        const issues = [];
        for (const node of slide.querySelectorAll('[data-anim],.matrix-cell')) {
          if (Number(getComputedStyle(node).opacity) < .99) issues.push(`not revealed: ${node.className}`);
        }
        for (const node of slide.querySelectorAll('h1,.matrix-index,.matrix-title,.hero-stat-value,.hero-stat-label,.hero-stat-context')) {
          const r = rect(node);
          if (r.left < -1 || r.top < -1 || r.right > origin.width + 1 || r.bottom > origin.height + 1) issues.push(`outside slide: ${node.className}`);
        }
        for (const cell of cells) {
          const r = rect(cell);
          for (const node of cell.children) {
            const child = rect(node);
            if (child.left < r.left - 1 || child.top < r.top - 1 || child.right > r.right + 1 || child.bottom > r.bottom + 1) issues.push(`outside cell: ${node.textContent}`);
          }
        }
        return { slideId: slide.dataset.slideId, count: cells.length,
          columns: css.gridTemplateColumns.split(/\s+/).length, rows: css.gridTemplateRows.split(/\s+/).length,
          grid: rect(grid), footer: rect(slide.querySelector('.hero-stat-bottom')), nav: rect(document.querySelector('#nav')),
          weights: cells.map(cell => getComputedStyle(cell.querySelector('.matrix-title')).fontWeight), issues };
      });
      assert.equal(result.count, index ? 12 : 8);
      assert.equal(result.columns, 4); assert.equal(result.rows, 3);
      assert.deepEqual(result.issues, []);
      assert.ok(result.weights.every(weight => Number(weight) >= 400 && Number(weight) <= 500));
      assert.ok(result.footer.bottom <= viewport.height * .93, 'footer exceeds current validator safe line');
      assert.ok(result.nav.top - result.footer.bottom >= 16, 'footer too close to pagination');
      report.measurements.push({ viewport, ...result });
      if (viewport.width === 1920) await page.screenshot({ path: join(output, `s15-${result.count}.png`) });
    }
    await page.keyboard.press('Home'); await page.waitForFunction(() => window.__currentSlideIndex === 0); await settled(page);
    await page.keyboard.press('Escape'); assert.equal(await page.locator('#overview').isVisible(), true);
    await page.keyboard.press('Escape'); assert.equal(await page.locator('#overview').isVisible(), false);
    await page.keyboard.press('b'); assert.equal(await page.evaluate(() => window.__lowPowerMode), true);
    const opacities = await page.locator('#deck > .slide').first().locator('[data-anim],.matrix-cell').evaluateAll(nodes => nodes.map(node => getComputedStyle(node).opacity));
    assert.ok(opacities.every(opacity => Number(opacity) === 1));
    report.interactions.push(`${viewport.width}x${viewport.height}: navigation, overview, low-power visibility`);
    await ctx.close();
  }

  const ctx = await context({ width: 1920, height: 1080 }), page = await ctx.newPage();
  await page.goto(values.url, { waitUntil: 'load' }); await settled(page);
  const audiencePromise = ctx.waitForEvent('page');
  await page.locator('#ppt-presenter-btn').click();
  let audience = await audiencePromise;
  await audience.waitForLoadState('load');
  await page.waitForFunction(() => window.__pptPresenter.debugState().syncState === 'synced');
  await page.locator('#ppt-next').click();
  await audience.waitForFunction(() => window.__currentSlideIndex === 1);
  await settled(page);
  await page.locator('#ppt-last').click();
  await audience.waitForFunction(() => window.__currentSlideIndex === 0);
  await settled(page);
  await page.locator('#ppt-timer-toggle').click();
  assert.equal(await page.evaluate(() => window.__pptPresenter.debugState().timerRunning), true);
  await page.locator('#ppt-timer-toggle').click(); await page.locator('#ppt-timer-reset').click();
  assert.equal(await page.locator('#ppt-clock').textContent(), '00:00');
  await page.locator('#ppt-grid').click();
  assert.equal(await page.locator('#ppt-presenter-overview').isVisible(), true);
  await page.locator('#ppt-presenter-overview-grid > *').nth(1).click();
  await audience.waitForFunction(() => window.__currentSlideIndex === 1);
  assert.equal(await page.locator('#ppt-presenter-overview').isVisible(), false);
  const editor = page.locator('#ppt-note-editor');
  await editor.fill('S15 QA note, stored by stable page ID.'); await page.waitForTimeout(400);
  await settled(page); await page.locator('#ppt-prev').click(); await settled(page);
  await page.locator('#ppt-next').click(); await settled(page);
  assert.equal(await editor.inputValue(), 'S15 QA note, stored by stable page ID.');
  await page.screenshot({ path: join(output, 'presenter.png') });
  await audience.close();
  await page.waitForFunction(() => window.__pptPresenter.debugState().syncState === 'disconnected');
  const recovered = ctx.waitForEvent('page'); await page.locator('#ppt-reopen').click(); audience = await recovered;
  await audience.waitForLoadState('load');
  await audience.waitForFunction(() => window.__currentSlideIndex === 1);
  await page.waitForFunction(() => window.__pptPresenter.debugState().syncState === 'synced');
  report.interactions.push('1920x1080: presenter/audience sync, end restart, timer start/pause/reset, grid select, notes by ID, audience close/reopen');
  await ctx.close();
  assert.deepEqual(report.pageErrors, []);
  report.passed = true;
} catch (error) {
  report.passed = false; report.failure = error.stack; throw error;
} finally {
  writeFileSync(join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  await browser.close();
}
console.log(`PASS S15 browser checks; report: ${join(output, 'report.json')}`);
