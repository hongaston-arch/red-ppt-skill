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
  await page.waitForTimeout(2500);
  await page.waitForFunction(() => {
    const slide = document.querySelectorAll('#deck > .slide')[window.__currentSlideIndex || 0];
    return [...slide.querySelectorAll('[data-anim]')].every(n => {
      for (let p=n; p && p!==slide; p=p.parentElement) if (Number(getComputedStyle(p).opacity)<.999) return false;
      return true;
    })
      && document.getAnimations().every(animation => animation.playState !== 'running');
  }, null, { timeout: 15000 });
}

try {
  const expected = ['SWISS-COVER-ASCII', 'S03', 'S19', 'S22', 'S11', 'S10'];
  for (const viewport of [{ width: 1920, height: 1080 }, { width: 1600, height: 900 }, { width: 1280, height: 720 }]) {
    const ctx = await context(viewport), page = await ctx.newPage();
    await page.goto(values.url, { waitUntil: 'load' }); await settled(page);
    assert.equal(await page.locator('#deck > .slide').count(), expected.length);
    for (let index = 0; index < expected.length; index++) {
      if (index) {
        await page.keyboard.press('ArrowRight');
        await page.waitForFunction(i => window.__currentSlideIndex === i, index); await settled(page);
      }
      const result = await page.evaluate(() => {
        const slide = document.querySelectorAll('#deck > .slide')[window.__currentSlideIndex || 0];
        const origin = slide.getBoundingClientRect(), issues = [], texts = [];
        const walker = document.createTreeWalker(slide.querySelector('.canvas-card'), NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) {
          if (!node.textContent.trim() || node.parentElement.closest('style,script,canvas')) continue;
          const range = document.createRange(); range.selectNodeContents(node);
          const css = getComputedStyle(node.parentElement);
          for (const rect of range.getClientRects()) {
            const r = { left: rect.left-origin.left, top: rect.top-origin.top, right: rect.right-origin.left, bottom: rect.bottom-origin.top };
            texts.push({ text: node.textContent.trim().slice(0, 24), ...r, size: parseFloat(css.fontSize), weight: css.fontWeight });
            if (r.left < -1 || r.top < -1 || r.right > origin.width+1 || r.bottom > origin.height*.93+1) issues.push(`text outside safe page: ${node.textContent.trim()}`);
          }
        }
        for (const n of slide.querySelectorAll('[data-anim]')) {
          for (let p = n; p && p !== slide; p = p.parentElement) {
            if (Number(getComputedStyle(p).opacity) < .99) issues.push(`not revealed: ${n.dataset.anim}, ancestor ${p.className}, opacity ${getComputedStyle(p).opacity}`);
          }
        }
        const bodies = [...slide.querySelectorAll('.review-body')].map(n => ({ size: parseFloat(getComputedStyle(n).fontSize), weight: Number(getComputedStyle(n).fontWeight) }));
        const structural = {};
        if (slide.dataset.layout === 'S03' || slide.dataset.layout === 'S10') {
          structural.halves = slide.querySelectorAll('.split-half > .half').length;
        }
        if (slide.dataset.layout === 'S19') {
          structural.columns = getComputedStyle(slide.querySelector('.four-cards')).gridTemplateColumns.split(/\s+/).length;
          structural.cards = slide.querySelectorAll('.fc-col').length;
        }
        if (slide.dataset.layout === 'S11') {
          structural.nodes = slide.querySelectorAll('.th-node').length;
          structural.headingColumns = getComputedStyle(slide.querySelector('.review-timeline-head')).gridTemplateColumns.split(/\s+/).length;
          structural.labelOffset = Math.max(...[...slide.querySelectorAll('.th-node')].map(n => {
            const a = n.querySelector('.dot').getBoundingClientRect(), b = n.querySelector('.label').getBoundingClientRect();
            return Math.abs((a.left+a.right-b.left-b.right)/2);
          }));
        }
        if (slide.dataset.layout === 'S22') {
          const img = slide.querySelector('img');
          structural.image = { loaded: img.complete && img.naturalWidth > 0, width: img.naturalWidth, height: img.naturalHeight, fit: getComputedStyle(img).objectFit };
        }
        // Leaf text boxes from different containers must not overlap; inline spans are one title.
        const elements = [...slide.querySelectorAll('h1,h2,p,.fc-col>.t-meta,.review-takeaway-number,.review-stat-value,.review-stat>.t-meta')];
        for (let i = 0; i < elements.length; i++) for (let j = i+1; j < elements.length; j++) {
          const a=elements[i], b=elements[j]; if (a.contains(b) || b.contains(a)) continue;
          const x=a.getBoundingClientRect(), y=b.getBoundingClientRect();
          if (Math.min(x.right,y.right)-Math.max(x.left,y.left)>2 && Math.min(x.bottom,y.bottom)-Math.max(x.top,y.top)>2) issues.push(`overlap: ${a.textContent.slice(0,15)} / ${b.textContent.slice(0,15)}`);
        }
        return { slideId: slide.dataset.slideId, layout: slide.dataset.layout, maxTextBottom: Math.max(...texts.map(t=>t.bottom)), bodies, structural, issues };
      });
      assert.equal(result.layout, expected[index]);
      assert.deepEqual(result.issues, [], `${viewport.width} / ${result.slideId}`);
      assert.ok(result.bodies.every(b => b.size >=18 && b.weight>=400 && b.weight<=500));
      if (index===1 || index===5) assert.equal(result.structural.halves, 2);
      if (index===2) { assert.equal(result.structural.columns,4); assert.equal(result.structural.cards,4); }
      if (index===3) assert.deepEqual(result.structural.image, {loaded:true,width:2100,height:900,fit:'contain'});
      if (index===4) { assert.equal(result.structural.nodes,5); assert.equal(result.structural.headingColumns,2); assert.ok(result.structural.labelOffset<1); }
      report.measurements.push({viewport,...result});
      if (viewport.width===1920) await page.screenshot({path:join(output, `${String(index+1).padStart(2,'0')}-${result.layout}.png`)});
    }
    await page.keyboard.press('Home'); await page.waitForFunction(() => window.__currentSlideIndex===0); await settled(page);
    await page.keyboard.press('Escape'); assert.equal(await page.locator('#overview').isVisible(),true);
    await page.keyboard.press('Escape'); assert.equal(await page.locator('#overview').isVisible(),false);
    await page.keyboard.press('b'); assert.equal(await page.evaluate(() => window.__lowPowerMode),true);
    for (let i=0;i<6;i++) {
      if(i) { await page.keyboard.press('ArrowRight'); await settled(page); }
      const opacity = await page.locator('#deck > .slide').nth(i).locator('[data-anim]').evaluateAll(nodes=>nodes.map(n=>getComputedStyle(n).opacity));
      assert.ok(opacity.every(o=>Number(o)===1));
    }
    report.interactions.push(`${viewport.width}x${viewport.height}: six pages, navigation, overview, low-power visibility`);
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
  await audience.waitForFunction(() => window.__currentSlideIndex === 5);
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
  await page.locator('#ppt-presenter-overview-grid > *').nth(5).click();
  await audience.waitForFunction(() => window.__currentSlideIndex === 5);
  assert.equal(await page.locator('#ppt-presenter-overview').isVisible(), false);
  const editor = page.locator('#ppt-note-editor');
  await editor.fill('Representative QA note, stored by stable page ID.'); await page.waitForTimeout(400);
  await settled(page); await page.locator('#ppt-prev').click(); await settled(page);
  await page.locator('#ppt-next').click(); await settled(page);
  assert.equal(await editor.inputValue(), 'Representative QA note, stored by stable page ID.');
  await page.screenshot({ path: join(output, 'presenter.png') });
  await audience.close();
  await page.waitForFunction(() => window.__pptPresenter.debugState().syncState === 'disconnected');
  const recovered = ctx.waitForEvent('page'); await page.locator('#ppt-reopen').click(); audience = await recovered;
  await audience.waitForLoadState('load');
  await audience.waitForFunction(() => window.__currentSlideIndex === 5);
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
console.log(`PASS representative browser checks; report: ${join(output, 'report.json')}`);
