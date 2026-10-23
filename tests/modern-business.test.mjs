import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {inspectModernBusiness} from '../scripts/lib/modern-business.mjs';

test('modern-business scaffold builds six valid representative pages with explicit image source',t=>{
 const parent=mkdtempSync(join(tmpdir(),'red-modern-'));t.after(()=>rmSync(parent,{recursive:true,force:true}));
 const output=join(parent,'deck');
 const built=spawnSync(process.execPath,['scripts/build-modern-business-example.mjs',output],{encoding:'utf8'});
 assert.equal(built.status,0,built.stderr);
 const html=readFileSync(join(output,'index.html'),'utf8');
 assert.deepEqual(inspectModernBusiness(html),{slides:6,errors:[]});
 const validated=spawnSync(process.execPath,['scripts/validate-deck.mjs','--style','modern-business',join(output,'index.html')],{encoding:'utf8'});
 assert.equal(validated.status,0,validated.stdout+validated.stderr);
 assert.match(readFileSync(join(output,'PROJECT.md'),'utf8'),/历史本地测试UI/);
 for(const [from,to,expected] of [
  ['data-layout="MB01"','data-layout="S01"',/unknown/],
  ['mb-panel mb-module','mb-panel',/requires 4/],
  ['class="mb-step"','class="removed"',/requires 5/],
  ['data-image-role="evidence"','data-image-role="unclassified"',/requires evidence/],
  ['data-image-role="evidence"','data-image-role="evidence" style="object-fit:cover"',/cannot cover/],
 ]) assert.match(inspectModernBusiness(html.replace(from,to)).errors.join('\n'),expected);
});

test('unfilled scaffold is not a finished modern-business deck',()=>{
 const result=inspectModernBusiness('<div><!-- <section class="slide">fake</section> --></div>');
 assert.equal(result.slides,0);assert.ok(result.errors.length);
});
