import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fitImage } from '../scripts/lib/swiss-safety.mjs';

test('contain preserves a complete evidence screenshot in a wide slot',()=>{
  const r=fitImage({width:1280,height:432,naturalWidth:1800,naturalHeight:1000,fit:'contain'});
  assert.equal(r.fullImage,true); assert.equal(r.renderedHeight,432);
});
test('cover crops evidence when the aspect ratios do not match',()=>{
  assert.equal(fitImage({width:1280,height:432,naturalWidth:1800,naturalHeight:1000,fit:'cover'}).fullImage,false);
});
test('photo subject survives the selected crop and fails a top-aligned crop',()=>{
  const input={width:1280,height:432,naturalWidth:3000,naturalHeight:3000,fit:'cover',subject:[.48,.45,.18,.14]};
  assert.equal(fitImage({...input,positionY:.65}).subjectVisible,true);
  assert.equal(fitImage({...input,positionY:0}).subjectVisible,false);
});
test('a slot-matched illustration fills its container without cropping',()=>{
  const r=fitImage({width:1400,height:600,naturalWidth:2100,naturalHeight:900,fit:'cover'});
  assert.equal(r.fullImage,true); assert.equal(r.renderedWidth,1400); assert.equal(r.renderedHeight,600);
});
test('invalid image dimensions or subject boxes cannot pass policy checks',()=>{
  const base={width:1280,height:432,naturalWidth:3000,naturalHeight:3000,fit:'cover'};
  assert.throws(()=>fitImage({...base,naturalWidth:0}),/dimensions/);
  assert.throws(()=>fitImage({...base,subject:[.9,.2,.2,.2]}),/normalized/);
});
test('required browser validation fails instead of silently passing static-only checks',()=>{
  const r=spawnSync(process.execPath,['scripts/validate-swiss-deck.mjs','examples/swiss-s15-review/index.html','--require-browser','--playwright-module','/nonexistent/playwright.mjs'],{encoding:'utf8'});
  assert.notEqual(r.status,0); assert.match(r.stderr,/Browser measurement failed/);
});
