#!/usr/bin/env node
// Optional integration QA; no Playwright dependency is added to generated decks.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

const { values } = parseArgs({ options: {
  'magazine-url': { type: 'string' }, 'swiss-url': { type: 'string' }, output: { type: 'string' },
  'playwright-module': { type: 'string' }, chrome: { type: 'string' }, 'lucide-umd': { type: 'string' },
} });
for (const key of ['magazine-url','swiss-url','output','playwright-module','lucide-umd']) {
  if (!values[key]) throw new Error(`Required --${key}`);
}
const { chromium } = await import(pathToFileURL(resolve(values['playwright-module'])).href);
const output = resolve(values.output); mkdirSync(output, { recursive: false });
const browser = await chromium.launch({ headless: true, ...(values.chrome ? { executablePath: values.chrome } : {}),
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const report = { browser: await browser.version(), fontMode: 'Google Fonts blocked; system fallback',
  lucideMode: 'supplied local UMD', checks: [], pageErrors: [] };
const settle = async page => {
  await page.waitForTimeout(2500);
  await page.waitForFunction(() => document.getAnimations().every(a => a.playState !== 'running'), null, { timeout: 15000 });
};
try {
  for (const style of ['magazine','swiss']) for (const viewport of [{width:1600,height:900},{width:1280,height:720}]) {
    const ctx = await browser.newContext({viewport,deviceScaleFactor:1});
    await ctx.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//, r=>r.abort());
    await ctx.route(/https:\/\/unpkg\.com\/lucide[^/]*\//, r=>r.fulfill({path:resolve(values['lucide-umd']),contentType:'application/javascript'}));
    ctx.on('page', p=>p.on('pageerror', e=>report.pageErrors.push(`${style}: ${e.message}`)));
    const page=await ctx.newPage(); await page.goto(values[`${style}-url`],{waitUntil:'load'}); await settle(page);
    const count=await page.locator('#deck > .slide').count(); assert.ok(count>=2);
    await page.keyboard.press('End'); await page.waitForFunction(i=>window.__currentSlideIndex===i,count-1); await settle(page);
    await page.keyboard.press('ArrowLeft'); await page.waitForFunction(i=>window.__currentSlideIndex===i,count-2); await settle(page);
    await page.keyboard.press('Home'); await page.waitForFunction(()=>window.__currentSlideIndex===0); await settle(page);
    await page.keyboard.press('Escape'); assert.equal(await page.locator('#overview').isVisible(),true);
    await page.keyboard.press('Escape'); assert.equal(await page.locator('#overview').isVisible(),false);
    await page.keyboard.press('b'); assert.equal(await page.evaluate(()=>window.__lowPowerMode),true);
    assert.ok((await page.locator('#deck > .slide').first().locator('[data-anim]').evaluateAll(ns=>ns.map(n=>getComputedStyle(n).opacity))).every(o=>Number(o)===1));
    if(viewport.width===1600) await page.screenshot({path:join(output,`${style}-deck.png`)});
    const popup=ctx.waitForEvent('page'); await page.locator('#ppt-presenter-btn').click(); let audience=await popup;
    await audience.waitForLoadState('load'); await page.waitForFunction(()=>window.__pptPresenter.debugState().syncState==='synced');
    await page.locator('#ppt-next').click(); await audience.waitForFunction(()=>window.__currentSlideIndex===1); await settle(page);
    assert.equal(await page.locator('#ppt-notes-title').textContent(),await page.evaluate(()=>window.__SPEAKER_NOTES__[1].title));
    await page.locator('#ppt-prev').click(); await audience.waitForFunction(()=>window.__currentSlideIndex===0); await settle(page);
    await page.locator('#ppt-grid').click(); await page.locator('#ppt-presenter-overview-grid > *').last().click();
    await audience.waitForFunction(i=>window.__currentSlideIndex===i,count-1); await settle(page);
    const editor=page.locator('#ppt-note-editor'); await editor.fill(`${style} QA stable-ID note`); await page.waitForTimeout(400);
    await page.locator('#ppt-prev').click(); await settle(page); await page.locator('#ppt-next').click(); await settle(page);
    assert.equal(await editor.inputValue(),`${style} QA stable-ID note`);
    await page.locator('#ppt-timer-toggle').click(); assert.equal(await page.evaluate(()=>window.__pptPresenter.debugState().timerRunning),true);
    await page.locator('#ppt-timer-toggle').click(); await page.locator('#ppt-timer-reset').click(); assert.equal(await page.locator('#ppt-clock').textContent(),'00:00');
    if(viewport.width===1600) await page.screenshot({path:join(output,`${style}-presenter.png`)});
    await audience.close(); await page.waitForFunction(()=>window.__pptPresenter.debugState().syncState==='disconnected');
    const recovery=ctx.waitForEvent('page'); await page.locator('#ppt-reopen').click(); audience=await recovery;
    await audience.waitForLoadState('load'); await audience.waitForFunction(i=>window.__currentSlideIndex===i,count-1);
    await page.waitForFunction(()=>window.__pptPresenter.debugState().syncState==='synced');
    await page.locator('#ppt-last').click(); await audience.waitForFunction(()=>window.__currentSlideIndex===0);
    report.checks.push({style,viewport,slides:count,passed:true,actions:['End/left/Home','overview','low-power','presenter next/previous','notes match and persistence','grid','timer','audience close/reopen','restart']});
    await ctx.close();
  }
  assert.deepEqual(report.pageErrors,[]); report.passed=true;
} catch(error) { report.passed=false; report.failure=error.stack; throw error; }
finally { writeFileSync(join(output,'report.json'),JSON.stringify(report,null,2)+'\n'); await browser.close(); }
console.log(`PASS both styles presenter integration; ${join(output,'report.json')}`);
