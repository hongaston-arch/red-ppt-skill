#!/usr/bin/env node
import assert from 'node:assert/strict';
import { mkdirSync, cpSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, relative, dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { skillRoot } from './lib/styles.mjs';

const {values}=parseArgs({options:{images:{type:'string'},output:{type:'string'},'base-url':{type:'string'},'playwright-module':{type:'string'},chrome:{type:'string'},'lucide-umd':{type:'string'}}});
for(const k of ['images','output','base-url','playwright-module','chrome','lucide-umd']) if(!values[k]) throw new Error(`Required --${k}`);
const output=resolve(values.output);mkdirSync(output);
const url=file=>new URL(relative(skillRoot,resolve(file)).split('\\').join('/'),values['base-url']).href;
const common=['--playwright-module',resolve(values['playwright-module']),'--chrome',values.chrome,'--lucide-umd',resolve(values['lucide-umd']),'--system-fonts','--require-browser'];
const summary={positive:[],negative:[],screenshots:[],passed:false};
function validate(label,file,width=1600,height=900){
 const report=join(output,`${label}-${width}.json`);
 const r=spawnSync(process.execPath,[join(skillRoot,'scripts/validate-swiss-deck.mjs'),file,'--url',url(file),...common,'--width',String(width),'--height',String(height),'--report',report],{encoding:'utf8',timeout:90000});
 if(r.error)throw r.error;
 return {status:r.status,report:JSON.parse(readFileSync(report,'utf8'))};
}
try{
 for(const [label,file] of [['representative',join(skillRoot,'examples/swiss-representative-review/index.html')],['s15',join(skillRoot,'examples/swiss-s15-review/index.html')],['images',resolve(values.images)]]) {
  for(const [width,height] of [[1920,1080],[1600,900],[1280,720]]) {
   const r=validate(label,file,width,height);assert.equal(r.status,0,JSON.stringify(r.report.errors));assert.equal(r.report.rendered,true);
   summary.positive.push({label,viewport:{width,height},slides:r.report.safety.length,minNavGap:Math.min(...r.report.safety.map(s=>s.navGap)),sha256:createHash('sha256').update(readFileSync(file)).digest('hex')});
   console.log(`PASS ${label} ${width}x${height}`);
  }
 }
 const negative=join(output,'negative');mkdirSync(negative);
 cpSync(dirname(resolve(values.images)),join(negative,'images'),{recursive:true});
 cpSync(join(skillRoot,'examples/swiss-s15-review'),join(negative,'s15'),{recursive:true});
 const imageHtml=readFileSync(values.images,'utf8'),s15Html=readFileSync(join(negative,'s15/index.html'),'utf8');
 const cases=[
  ['nav-gap','s15',s15Html.replace('</style>','#nav{bottom:7vh!important}</style>'),/navigation clearance/],
  ['safe-line','s15',s15Html.replace('</style>','.hero-stat-bottom{position:relative;top:40px}</style>'),/93vh exceeded/],
  ['evidence-crop','images',imageHtml.replace('object-fit:contain;object-position:50% 50%','object-fit:cover;object-position:50% 50%'),/evidence image is cropped/],
  ['photo-crop','images',imageHtml.replace('object-position:50% 65%','object-position:50% 0%'),/declared image subject is cropped/],
  ['missing-image','images',imageHtml.replace('src="images/registry-original.png"','src="images/missing.png"'),/image failed to load/],
 ];
 for(const [label,kind,html,expected] of cases){
  const file=join(negative,kind,`${label}.html`);writeFileSync(file,html);
  const r=validate(label,file);assert.notEqual(r.status,0);assert.ok(r.report.errors.some(e=>expected.test(e)),JSON.stringify(r.report.errors));
  summary.negative.push({label,rejected:true,errors:r.report.errors});console.log(`PASS rejects ${label}`);
 }
 const {chromium}=await import(pathToFileURL(resolve(values['playwright-module'])).href);
 const browser=await chromium.launch({headless:true,executablePath:values.chrome});
 try{
  const ctx=await browser.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1});
  await ctx.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//,r=>r.abort());
  await ctx.route(/https:\/\/unpkg\.com\/lucide[^/]*\//,r=>r.fulfill({path:resolve(values['lucide-umd']),contentType:'application/javascript'}));
  const page=await ctx.newPage();await page.goto(url(values.images));await page.evaluate(()=>window.__setLowPowerMode(true,{persist:false}));
  for(let i=0;i<2;i++){
   await page.evaluate(n=>go(n,{force:true}),i);await page.waitForTimeout(800);
   const image=page.locator('#deck > .slide').nth(i).locator('img');assert.equal(await image.evaluate(n=>n.complete&&n.naturalWidth>0),true);
   const visible=await page.locator('#deck > .slide').nth(i).locator('.image-stat .t-meta,.stat-value').evaluateAll(nodes=>nodes.every(n=>{
    for(let p=n;p&&!p.classList.contains('slide');p=p.parentElement) if(Number(getComputedStyle(p).opacity)<.999)return false;
    const r=n.getBoundingClientRect();return r.width>1&&r.height>1;
   }));assert.equal(visible,true,'Static mode must reveal every image statistic and label');
   const name=i?'photo-cover.png':'evidence-contain.png';await page.screenshot({path:join(output,name)});summary.screenshots.push(name);
   if(i===0){
    const overlap=await page.locator('#deck > .slide').first().evaluate(s=>{
     const img=s.querySelector('img'),a=img.getBoundingClientRect(),b=s.querySelector('.title-block').getBoundingClientRect();
     const scale=Math.min(a.width/img.naturalWidth,a.height/img.naturalHeight),left=a.left+(a.width-img.naturalWidth*scale)/2;
     return Math.max(0,Math.min(left+img.naturalWidth*scale,b.right)-Math.max(left,b.left));
    });assert.equal(overlap,0,'Evidence title must stay outside the painted screenshot');
   }
  }
 }finally{await browser.close();}
 summary.passed=true;
}catch(error){summary.failure=error.stack;throw error;}
finally{writeFileSync(join(output,'summary.json'),JSON.stringify(summary,null,2)+'\n');}
