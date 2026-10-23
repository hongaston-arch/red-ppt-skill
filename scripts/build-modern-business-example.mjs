#!/usr/bin/env node
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { scaffold } from './lib/scaffold.mjs';
import { skillRoot } from './lib/styles.mjs';

if (!process.argv[2]) throw new Error('Usage: node scripts/build-modern-business-example.mjs <new-directory>');
const { target } = scaffold({ styleId: 'modern-business', title: '现代商务 · 六类代表页', output: process.argv[2] });
const names = ['封面与索引','长中文标题','四项正文','原图与说明','五步流程','三条收尾'];
const ids = ['mb-cover','mb-long-title','mb-body','mb-evidence','mb-process','mb-closing'];
const modules = [
  ['风格是什么','写清字体、颜色与信息层级。描述页面如何组织内容，使下一次制作有可核对的依据。'],
  ['哪些能调整','区分固定骨架与局部调整。文案变长时先改写或拆页，保留正文可读性与必要留白。'],
  ['如何做判断','把来源规则、建议与已确认决定分开记录。样张用于检验效果，不能代替事实来源。'],
  ['怎样接着做','保存规格版本、素材出处与检查记录。新聊天先读取项目文件，再继续尚未完成的工作。'],
];
const bodies = [
`<main data-anim="content" class="mb-main mb-cover"><div class="mb-cover-copy"><div class="mb-kicker">风格定义与记录交接</div><h1>让风格生长<br><span class="mb-title-line">让表达清楚</span></h1><p class="mb-body">用同一主题，检查六类页面的层级、密度与边界。</p><p class="mb-caption">现代商务 / 方向样张<br>中等字号 · 小圆角 · 模块化汇报</p></div><aside class="mb-cover-panel"><div><p class="mb-caption">本次审阅 / CONTENT MAP</p><h2 style="margin-top:1.5vh">从定义到交付</h2></div><div>${[['01','定义范围'],['02','验证效果'],['03','记录交接']].map(([n,t])=>`<div class="mb-cover-row"><span>${n}</span><strong>${t}</strong></div>`).join('')}</div><p class="mb-caption">六类代表页 · 同一中性主题<br>无业务数据与效率承诺</p></aside></main>`,
`<main data-anim="content" class="mb-main"><div class="mb-kicker">表达主张 / LONG TITLE</div><h1>让每种风格可扩展<br><span class="mb-title-line">让每次表达更清楚</span></h1><div class="mb-statement-detail"><div class="mb-panel"><p class="mb-body">把长句拆成两个清楚的意思。标题承载主张，正文解释含义；文案变化时，先调整表达，再检查换行和留白。</p></div><div class="mb-principles"><div class="mb-principle"><strong>定义</strong><span>说清是什么</span></div><div class="mb-principle"><strong>边界</strong><span>写明怎么用</span></div><div class="mb-principle"><strong>依据</strong><span>留下为什么</span></div></div></div></main>`,
`<main data-anim="content" class="mb-main"><div class="mb-kicker">写清约定 / FOUR MODULES</div><h1>把约定写得更具体</h1><div class="mb-modules">${modules.map(([h,p],i)=>`<article class="mb-panel mb-module"><span class="mb-number">0${i+1}</span><h2>${h}</h2><p class="mb-body">${p}</p></article>`).join('')}</div></main>`,
`<main data-anim="content" class="mb-main"><div class="mb-kicker">图片保真 / SOURCE & CONTEXT</div><h1>先保留全貌，再解释细节</h1><div class="mb-evidence"><figure><img src="images/registry-original.png" data-image-role="evidence" alt="历史本地测试界面的原截图，展示当时登记的magazine与swiss两种风格"><figcaption class="mb-caption">历史测试UI原截图 · 1800 × 1000<br>来源与生成文件随附；不是当前风格数量说明。</figcaption></figure><aside><div><h2>证据保持完整</h2><p class="mb-body">原截图按 contain 显示，不重画文字或改变界面内容。</p></div><div><h2>说明交代边界</h2><p class="mb-body">小字细节应另页放大。这里用于检查全图与说明的对应关系。</p></div></aside></div></main>`,
`<main data-anim="content" class="mb-main"><div class="mb-kicker">组织步骤 / LINEAR PROCESS</div><h1>从定义走到交付</h1><ol class="mb-steps">${[['定义范围','明确受众与内容角色'],['选择版式','匹配信息关系与容量'],['制作样张','让抽象规则成为页面'],['检查效果','核对文字、图片与交互'],['记录交接','保存版本、依据与未决项']].map(([h,p],i)=>`<li class="mb-step"><span class="mb-number">0${i+1}</span><h2>${h}</h2><p class="mb-body">${p}</p></li>`).join('')}</ol><p class="mb-caption">演示用线性流程；不表示工期或效率提升。</p></main>`,
`<main data-anim="content" class="mb-main mb-closing"><div class="mb-closing-heading"><div class="mb-kicker">继续扩展 / KEEP BUILDING</div><h1>继续扩展<br>保留依据</h1><p class="mb-body">让每次调整都有范围，<br>让下次交流有据可循。</p></div><div class="mb-takeaways">${[['保留清晰的骨架','每页先确定信息角色，再选择登记版式。'],['展示实际的效果','使用代表页核对标题、正文、图片和流程。'],['留下可恢复的记录','确认范围与检查结果分别保存，方便下次继续。']].map(([h,p],i)=>`<article class="mb-panel mb-takeaway"><span class="mb-number">0${i+1}</span><div><h2>${h}</h2><p class="mb-body">${p}</p></div></article>`).join('')}</div></main>`
];
const slides = bodies.map((body,i)=>`<section class="slide light" data-layout="MB0${i+1}" data-slide-id="${ids[i]}"><div class="canvas-card"><header class="mb-chrome"><span class="mb-brand">RED / MODERN BUSINESS</span><span>风格定义与记录交接</span></header>${body}<footer class="mb-foot"><span>方向样张 · ${names[i]} · 待视觉确认</span><span>0${i+1} / 06</span></footer></div></section>`);
const notes = names.map((title,i)=>({ id:ids[i], title, purpose:`检查${title}的现代商务表达`, talk:['本页是版式演示，没有业务数据或现实结论。','具体颜色、字号和间距是候选值，用户仅确认总体方向。','记录本页问题，确认不扩大到未展示的结构。'], transition:i===5?'记录审阅意见，再决定后续扩展。':'继续下一类内容，核对信息密度与可读性。' }));
const file=join(target,'index.html');
let html=readFileSync(file,'utf8').replace('<!-- SLIDES_HERE -->',slides.join('\n'));
html=html.replace('const SPEAKER_NOTES = [];',`const SPEAKER_NOTES = ${JSON.stringify(notes,null,2)};`);
writeFileSync(file,html);
for(const name of ['registry-original.png','registry-source.html'])copyFileSync(join(skillRoot,'examples/swiss-image-review/images',name),join(target,'images',name));
writeFileSync(join(target,'PROJECT.md'),`# 现代商务六类代表页\n\n- 风格：modern-business / experimental / draft-01，规格及摘要见red-deck.json。\n- 用户确认：仅现代商务优先、中等字号、小圆角、模块化汇报。\n- 具体蓝灰、10px圆角、字号、网格和六页视觉：候选，待审阅。\n- 主题：定义风格与记录交接；没有业务数据。\n- MB04素材：复用Swiss图片样张的历史本地测试UI原PNG及HTML，原图1800×1000；其中两种风格数量只反映生成时状态，不是当前注册数量。文件由本项目创建，不是客户业务界面。未重画、未裁切。\n- 交互：方向键、ESC总览、B静态、P演讲者；演讲者图标仍需Lucide。\n- QA条件与实际结果：仓库docs/qa/modern-business.md；样张认可尚未获得。\n`);
console.log(`Built ${file}`);
