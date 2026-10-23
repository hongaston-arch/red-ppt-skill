#!/usr/bin/env node
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { createHash } from 'node:crypto';
import { loadStyles } from './lib/styles.mjs';
import { scaffold } from './lib/scaffold.mjs';

const { values, positionals } = parseArgs({ allowPositionals:true, options:{photo:{type:'string'},'playwright-module':{type:'string'},chrome:{type:'string'}} });
if(positionals.length!==1 || !values.photo || !values['playwright-module']) throw new Error('Usage: node scripts/build-swiss-image-review.mjs <new-directory> --photo <original-jpg> --playwright-module <index.mjs> [--chrome <binary>]');
const photo=readFileSync(values.photo), hash=createHash('sha256').update(photo).digest('hex');
if(hash!=='4b1484e9bb55652e30a56c03c27141938885a09e4b3c0bcabb8841e1e94ed9d9') throw new Error('Expected the unchanged NASA Earthrise download identified in this generator; refusing to attach its attribution to another image.');
const {target}=scaffold({styleId:'swiss',title:'Swiss · 截图保真与照片主体',output:positionals[0]});
copyFileSync(values.photo,join(target,'images/earthrise-original.jpg'));
const registered=loadStyles().map(s=>({id:s.id,runtime:s.runtime}));
const ui=`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>Registry fixture</title><style>*{box-sizing:border-box}body{margin:0;width:1800px;height:1000px;background:#fff;color:#0a0a0a;font-family:Arial,"PingFang SC",sans-serif;padding:70px 80px}header{font-size:52px;font-weight:600;border-bottom:3px solid #002fa7;padding-bottom:35px}main{margin-top:70px}.row{display:grid;grid-template-columns:400px 1fr;border-bottom:2px solid #ddd;padding:40px 0;align-items:center}.id{font-size:68px;font-weight:500}.runtime{font-size:52px}footer{position:absolute;bottom:70px;font-size:42px}small{font-size:36px;font-weight:400;float:right}</style><header>实际风格清单<small>UI测试页 · 非业务系统</small></header><main>${registered.map(s=>`<div class="row"><div class="id">${s.id}</div><div class="runtime">${s.runtime}</div></div>`).join('')}</main><footer>${registered.length} 个登记风格 · 数据来自本仓库 style.json</footer></html>`;
writeFileSync(join(target,'images/registry-source.html'),ui);
const {chromium}=await import(pathToFileURL(resolve(values['playwright-module'])).href);
const browser=await chromium.launch({headless:true,...(values.chrome?{executablePath:values.chrome}:{})});
try { const page=await browser.newPage({viewport:{width:1800,height:1000},deviceScaleFactor:1}); await page.setContent(ui); await page.screenshot({path:join(target,'images/registry-original.png')}); }
finally {await browser.close();}
const copy=[
 ['image-evidence','evidence','完整<br>保留','registry-original.png','contain','50% 50%',`本仓库风格清单的真实浏览器截图。原HTML随稿保存；完整保留标题、${registered.length===2?'两':registered.length}条记录和底部来源。`, [[String(registered.length).padStart(2,'0'),'登记风格'],['1800','原图宽度 px'],['1000','原图高度 px']]],
 ['image-photo','photo','保住主体<br>允许裁切','earthrise-original.jpg','cover','50% 65%','NASA / Bill Anders · Earthrise。保留原文件，用CSS裁切展示；本页指定地球为主体，月面只保留局部。', [['01','照片来源'],['3000','原图宽度 px'],['3000','原图高度 px']]],
];
const pages=copy.map(([id,role,title,src,fit,position,description,stats],i)=>`<section class="slide light" data-layout="S22" data-animate="image-hero" data-slide-id="${id}"><div class="canvas-card" style="padding:0;overflow:hidden">
 <div class="image-area" data-anim="img"><img src="images/${src}" data-image-slot="s22-hero-21x9" data-image-role="${role}" ${role==='photo'?'data-subject-box="0.48,0.45,0.18,0.14"':''} alt="${role==='photo'?'Earthrise，地球升起于月面上方；NASA/Bill Anders':'登记风格清单，magazine与swiss共享guizang-presenter-v1'}" style="width:100%;height:100%;object-fit:${fit};object-position:${position}">
  <div class="chrome-min image-chrome"><div class="l">RED · SWISS / ${role.toUpperCase()}</div><div class="r">${i+1} / 2</div></div>
  <div class="title-block ${role}" data-anim="title-block"><h1>${title}</h1></div>
 </div>
 <div class="image-hero-body" data-anim="kpi"><div><div class="t-meta">${role==='photo'?'NASA / BILL ANDERS · ORIGINAL PHOTO':'LOCAL REGISTRY UI · ORIGINAL SCREENSHOT'}</div><p class="image-copy">${description}</p></div><div class="image-hero-stats">${stats.map(([v,label])=>`<div class="image-stat"><div class="stat-rule" data-anim="line"></div><div class="t-meta" data-anim="up">${label}</div><div class="stat-value kpi-hero" data-anim="up">${v}</div></div>`).join('')}</div></div>
 </div></section>`).join('\n');
const css=`.image-area{position:relative;flex:0 0 60%;overflow:hidden;background:#fff}.image-chrome{position:absolute!important;top:0;left:0;right:0;padding:5.6vh 5vw 0}.slide:has([data-image-role="photo"]) .image-chrome{color:#fff}.title-block{position:absolute;left:5vw;top:15vh;background:var(--paper);padding:2vh 1.2vw}.title-block h1{font-family:var(--sans),var(--sans-zh);font-size:min(4.6vw,8vh);font-weight:200;line-height:1.1;letter-spacing:-.025em}.title-block.evidence h1{font-size:min(3.2vw,5.6vh)}.image-copy{font-size:max(18px,1.25vw);font-weight:400;line-height:1.65;margin-top:2vh;color:var(--text-secondary)}.image-hero-body{padding-top:4vh;padding-bottom:calc(var(--nav-safe-bottom) + 1vh)}.image-hero-stats{align-items:stretch}.image-stat{display:flex;flex-direction:column;gap:1.4vh}.stat-rule{height:1px;background:var(--ink)}.stat-value{font-size:min(4.2vw,7.2vh);font-weight:200;line-height:1.1;letter-spacing:-.04em}`;
const notes=copy.map(([id,role],i)=>({id,title:role==='photo'?'照片主体检查':'证据截图完整性检查',purpose:'验证Q07处理策略，不代表全部图片已验收',talk:['查看原始素材与当前显示方式','核对截图文字或照片主体是否完整','数值为素材尺寸与实际数量，无业务结论'],transition:i?'记录本次检查的条件与限制':'继续检查照片的主体与裁切'}));
const file=join(target,'index.html');let html=readFileSync(file,'utf8');
html=html.replace('</style>',css+'</style>').replace(/(<div id="deck">)[\s\S]*?(<\/div>\s*<div id="nav">)/,(_,a,b)=>`${a}\n${pages}\n${b}`).replace(/const SPEAKER_NOTES = \[[\s\S]*?\];/,()=>`const SPEAKER_NOTES = ${JSON.stringify(notes,null,2)};`);
writeFileSync(file,html);
writeFileSync(join(target,'sources.json'),JSON.stringify({screenshot:{file:'images/registry-original.png',source:'images/registry-source.html',viewport:{width:1800,height:1000},sha256:createHash('sha256').update(readFileSync(join(target,'images/registry-original.png'))).digest('hex'),registered},photo:{file:'images/earthrise-original.jpg',source:'https://science.nasa.gov/resource/apollo-8s-iconic-earthrise/',download:'https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/a/as08-14-2383-1.jpg',credit:'NASA/Bill Anders',usage:'https://www.nasa.gov/nasa-brand-center/images-and-media/',sha256:hash,subjectBox:[.48,.45,.18,.14],subjectBasis:'Assistant inspected the original image and selected a padded Earth bounding box; not automatic object recognition.'}},null,2)+'\n');
writeFileSync(join(target,'PROJECT.md'),'# Swiss Q07 图片测试\n\n- 两页S22沿用顶部主图、左上白块标题、下方说明与三项实际素材指标。默认IKB仅作测试。\n- 原始截图1800×1000，照片3000×3000；均保留原文件，不重画数据、不重生成21:9。这是已确认Q07方向下的原始素材保真测试，非槽位生成插图。\n- 截图使用contain；标题放在图像实际绘制区域之外，避免遮挡。照片使用cover/center 65%，声明主体是地球，月面允许局部裁切。\n- 本轮没有新增风格或修改模板；局部CSS仅属于测试稿。\n- 来源、摘要与地球主体框依据见sources.json。用户尚未审阅这两张新样页，不能从工程通过推导为视觉批准。\n');
console.log(`Built image review: ${file}`);
