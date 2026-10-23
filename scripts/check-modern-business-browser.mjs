#!/usr/bin/env node
// Optional browser QA. Install Playwright separately; it is not a runtime dependency of a deck.
import assert from 'node:assert/strict';
import {measureModernBusiness} from './lib/modern-business-browser.mjs';
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
  const expected = ['MB01','MB02','MB03','MB04','MB05','MB06'];
  for (const viewport of [{ width: 1920, height: 1080 }, { width: 1600, height: 900 }, { width: 1280, height: 720 }]) {
    const ctx = await context(viewport), page = await ctx.newPage();
    await page.goto(values.url, { waitUntil: 'load' }); await settled(page);
    assert.equal(await page.locator('#deck > .slide').count(), expected.length);
    for (let index = 0; index < expected.length; index++) {
      if (index) {
        await page.keyboard.press('ArrowRight');
        await page.waitForFunction(i => window.__currentSlideIndex === i, index); await settled(page);
      }
      const result = await page.evaluate(measureModernBusiness);
      assert.equal(result.layout, expected[index]);
      assert.deepEqual(result.issues, [], viewport.width+' / '+result.slideId);
      if(index===3) assert.deepEqual(result.images,[{role:'evidence',fit:'contain',width:1800,height:1000}]);
      report.measurements.push({viewport,...result});
      if (viewport.width===1920) await page.screenshot({path:join(output, `${String(index+1).padStart(2,'0')}-${result.layout}.png`)});
    }
    // Inject faults to ensure rendered checks catch actual regressions.
    if(viewport.width===1280){
      await page.keyboard.press('Home'); await settled(page);
      const failures=[];
      for(const [selector,property,value,expectedIssue] of [
        ['h1','marginLeft','-20vw','outside modern content zone'],
        ['.mb-body','fontSize','10px','body smaller'],
        ['.mb-cover-panel','borderRadius','40px','candidate radius'],
      ]){
        const previous=await page.locator('#deck>.slide').first().locator(selector).first().evaluate((n,[property,value])=>{const old=n.style[property];n.style[property]=value;return old},[property,value]);
        const result=await page.evaluate(measureModernBusiness);
        assert.ok(result.issues.some(issue=>issue.includes(expectedIssue)),expectedIssue);
        failures.push(expectedIssue);
        await page.locator('#deck>.slide').first().locator(selector).first().evaluate((n,[property,previous])=>n.style[property]=previous,[property,previous]);
      }
      await page.keyboard.press('ArrowRight'); await settled(page);
      await page.keyboard.press('ArrowRight'); await settled(page);
      await page.keyboard.press('ArrowRight'); await settled(page);
      await page.locator('[data-slide-id="mb-evidence"] img').evaluate(n=>n.style.objectFit='cover');
      assert.ok((await page.evaluate(measureModernBusiness)).issues.includes('evidence fit must be contain'));
      await page.locator('[data-slide-id="mb-evidence"] img').evaluate(n=>n.style.objectFit='');
      failures.push('evidence cover');
      report.faultChecks=failures;
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

  const earlyCtx=await context({width:1280,height:720}), earlyPage=await earlyCtx.newPage();
  await earlyPage.goto(values.url,{waitUntil:'domcontentloaded'});
  await earlyPage.keyboard.press('b');
  await earlyPage.waitForTimeout(900);
  assert.equal(await earlyPage.evaluate(()=>window.__lowPowerMode),true);
  assert.deepEqual((await earlyPage.evaluate(measureModernBusiness)).issues,[]);
  report.interactions.push('1280x720: early static mode before deferred entry completes');
  await earlyCtx.close();
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
  await editor.fill('Modern business QA note, stored by stable page ID.'); await page.waitForTimeout(400);
  await settled(page); await page.locator('#ppt-prev').click(); await settled(page);
  await page.locator('#ppt-next').click(); await settled(page);
  assert.equal(await editor.inputValue(), 'Modern business QA note, stored by stable page ID.');
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
console.log(`PASS modern-business browser checks; report: ${join(output, 'report.json')}`);
