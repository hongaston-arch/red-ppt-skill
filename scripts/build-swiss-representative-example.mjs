#!/usr/bin/env node
// Representative content uses registered skeletons; example-only CSS does not rewrite the template.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { scaffold } from './lib/scaffold.mjs';

const output = process.argv[2];
if (!output) throw new Error('Usage: node scripts/build-swiss-representative-example.mjs <new-output-directory>');
const { target } = scaffold({ styleId: 'swiss', title: 'Swiss · 六类代表页审阅', output });
const chrome = (n, label) => `<div class="chrome-min"><div class="l">RED · SWISS / ${label}</div><div class="r">样张 · ${n} / 6</div></div>`;
const title = text => `<h1 class="review-title">${text}</h1>`;
const cards = [
  ['定义', '风格是什么', '写清字体、颜色与信息层级。描述页面如何组织内容，使下一次制作有可核对的依据。'],
  ['边界', '哪些能调整', '区分固定骨架与局部调整。文案变长时先改写或拆页，保留正文可读性与必要留白。'],
  ['证据', '如何做判断', '把来源规则、建议与已确认决定分开记录。样张用于检验效果，不能代替事实来源。'],
  ['交接', '怎样接着做', '保存规格版本、素材出处与检查记录。新聊天先读取项目文件，再继续尚未完成的工作。'],
];
const rules = [
  ['保留清晰的骨架', '每页先确定信息角色，再选择登记版式。'],
  ['展示实际的效果', '使用代表页核对标题、正文、图片和流程。'],
  ['留下可恢复的记录', '确认范围与检查结果分别保存，方便下次继续。'],
];
const slides = [
`<section class="slide accent" data-layout="SWISS-COVER-ASCII" data-animate="hero" data-slide-id="review-cover">
 <div class="canvas-card review-safe">
  <canvas class="ascii-bg" aria-hidden="true"></canvas>
  ${chrome(1, 'REPRESENTATIVE PAGES')}
  <div class="review-cover-main">
   <div data-anim="kicker" class="t-meta">SIX PAGE TYPES · ONE VISUAL LANGUAGE</div>
   <h1 data-anim="title" class="review-cover-title">让风格生长<br>让表达<span style="font-style:italic;font-weight:300">清楚</span></h1>
   <div data-anim="bottom" class="review-cover-bottom"><p class="review-lead">用同一主题，检查六类页面的层级、密度与边界。</p><div class="t-meta">演示文案 · 非业务结论　／　方向键翻页 · P 演讲者视图</div></div>
  </div>
 </div>
</section>`,
`<section class="slide split" data-layout="S03" data-animate="split-statement" data-slide-id="review-long-title">
 <div class="canvas-card"><div class="split-half">
  <div class="half review-half review-statement-half">${chrome(2, 'LONG TITLE')}
   <div data-anim="manifesto"><div class="t-meta">LONG CHINESE TITLE</div><h1 class="review-split-title">让每种风格可扩展<br>让每次表达更清楚</h1></div>
   <div class="t-meta">两行 · 每行八字 · 布局测试</div>
  </div>
  <div class="half b-grey review-half" style="justify-content:center"><div data-anim="rules" class="review-explanation"><div class="t-meta">S03 / SPLIT STATEMENT</div><h2>把长句拆成<br>两个清楚的意思。</h2><p class="review-body">左侧承载主张，右侧解释含义。这里检查中文换行与字重，不添加数据或并列卡片。</p><p class="review-body">标题长度变化时，先调整表达，再检查每行宽度和上下留白。</p></div></div>
 </div></div>
</section>`,
`<section class="slide light" data-layout="S19" data-animate="four-cards" data-slide-id="review-body">
 <div class="canvas-card review-safe">${chrome(3, 'FOUR CARDS')}
  <header data-anim="line"><div class="review-accent-rule"></div><div>${title('把约定写得更具体')}</div></header>
  <div class="four-cards" data-anim="up">${cards.map(([label, heading, body], i) => `<div class="fc-col"><div class="t-meta">0${i + 1} / ${label}</div><h2>${heading}</h2><p class="review-body">${body}</p></div>`).join('')}</div>
  <div class="t-meta">四项等权说明 · 演示文案 · 正文 400 / 小标题 500</div>
 </div>
</section>`,
`<section class="slide light" data-layout="S22" data-animate="image-hero" data-slide-id="review-image">
 <div class="canvas-card" style="padding:0;overflow:hidden">
  <div data-anim="img" class="review-image-wrap"><img src="images/structure-21x9.svg" data-image-slot="s22-hero-21x9" alt="三组直角几何块构成的版式示意图，不含业务数据" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;object-position:center center">
   <div class="review-image-chrome">${chrome(4, 'IMAGE HERO')}</div>
   <div data-anim="title-block" class="review-image-title">${title('先看全貌<br>再读细节')}</div>
  </div>
  <div data-anim="kpi" class="image-hero-body"><div><div class="t-meta">LOCAL SVG · GEOMETRY STUDY</div><p class="review-body" style="margin-top:2vh">本地几何示意图，用于检查图片槽位。采用 contain 保留完整画面；右侧数值来自素材本身，不代表业务表现。</p></div>
   <div class="image-hero-stats">${[['21:9','素材比例'],['03','几何组数'],['01','本地图源']].map(([value,label]) => `<div class="review-stat"><div class="t-meta">${label}</div><div class="review-stat-value">${value}</div><p>${label === '素材比例' ? '2100 × 900' : label === '几何组数' ? '源文件实际数量' : '无外部图片链接'}</p></div>`).join('')}</div>
  </div>
 </div>
</section>`,
`<section class="slide light" data-layout="S11" data-animate="timeline-walk" data-slide-id="review-process">
 <div class="canvas-card review-safe">${chrome(5, 'HORIZONTAL TIMELINE')}
  <header data-anim="line" class="review-timeline-head"><div class="t-meta">PROCESS<br>LINEAR / 05</div>${title('从定义走到交付')}</header>
  <div class="timeline-h" data-anim="up"><div class="tl-row">${['定义范围','选择版式','制作样张','检查效果','记录交接'].map((label, i) => `<div class="th-node ${i % 2 ? 'down' : 'up'} ${i === 4 ? 'accent' : ''}"><span class="dot"></span><div class="label"><span class="yr">0${i + 1}</span><span class="name">${label}</span></div></div>`).join('')}</div></div>
  <div class="t-meta">演示用线性流程 · 无时间与效率承诺</div>
 </div>
</section>`,
`<section class="slide split" data-layout="S10" data-animate="split-statement" data-slide-id="review-closing">
 <div class="canvas-card"><div class="split-half">
  <div class="half b-accent review-half review-statement-half" style="position:relative;overflow:hidden"><canvas class="ascii-bg" aria-hidden="true"></canvas>${chrome(6, 'CLOSING')}
   <div data-anim="manifesto"><div class="t-meta">KEEP BUILDING</div><h1 class="review-split-title">继续扩展<br>保留依据</h1><p class="review-body" style="margin-top:3vh">让每次调整都有范围，<br>让下次交流有据可循。</p></div><div data-anim="signature" class="t-meta">RED · SWISS / REVIEW</div>
  </div>
  <div class="half review-half review-statement-half"> <div class="chrome-min"><div class="l">TAKEAWAYS</div><div class="r">03 RULES</div></div>
   <div data-anim="rules">${rules.map(([heading, body],i) => `<div class="review-takeaway"><div class="review-takeaway-number">0${i + 1}</div><div><h2>${heading}</h2><p class="review-body">${body}</p></div></div>`).join('')}</div>
   <div data-anim="foot" class="t-meta">样张结束 · 确认范围另行记录</div>
  </div>
 </div></div>
</section>`];

const css = `/* Example-only sizing. Registered skeletons and template runtime remain unchanged. */
.review-safe{padding-bottom:calc(var(--nav-safe-bottom) + 1vh)}
.review-title{font-family:var(--sans),var(--sans-zh);font-weight:200;font-size:min(5.2vw,9.2vh);line-height:1.08;letter-spacing:-.025em}
.review-body{font-family:var(--sans),var(--sans-zh);font-size:max(18px,1.25vw);font-weight:400;line-height:1.65;color:var(--text-secondary)}
.review-lead{font-size:max(20px,1.5vw);font-weight:400;line-height:1.5}
.review-cover-main{flex:1;min-height:0;display:grid;grid-template-rows:auto 1fr auto;gap:3vh;position:relative}
.review-cover-title{align-self:center;font-family:var(--sans),var(--sans-zh);font-size:min(9.2vw,16vh);font-weight:200;line-height:1.08;letter-spacing:-.025em;color:var(--accent-on)}
.review-cover-bottom{border-top:1px solid rgba(255,255,255,.3);padding-top:2vh;display:grid;gap:2vh}
.review-half{padding:5.6vh 3.6vw calc(var(--nav-safe-bottom) + 1vh)!important;min-height:0}
.review-statement-half{justify-content:space-between;position:relative}
.review-split-title{font-family:var(--sans),var(--sans-zh);font-weight:200;font-size:min(4.6vw,8vh);line-height:1.22;letter-spacing:-.025em;margin-top:3vh}
.review-explanation{display:grid;gap:3vh}.review-explanation h2{font-size:min(3vw,5.3vh);font-weight:400;line-height:1.35}
.review-accent-rule{width:80px;height:2px;background:var(--accent);margin-bottom:3vh}
.four-cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:3vw;flex:1;min-height:0;margin-top:8vh;margin-bottom:5vh}
.fc-col{border-top:1px solid var(--border-subtle);padding-top:2vh;display:flex;flex-direction:column;gap:3vh;min-width:0}
.fc-col h2{font-size:max(24px,2vw);font-weight:500;line-height:1.3;letter-spacing:-.025em}
.review-image-wrap{position:relative;flex:0 0 60%;overflow:hidden;background:#e7e7e2}
.review-image-chrome{position:absolute;inset:0 0 auto;padding:5.6vh 5vw 0}
.review-image-title{position:absolute;left:5vw;top:14vh;background:var(--paper);padding:3.2vh 3.2vw;max-width:40vw}
.review-image-title .review-title{font-size:min(4.6vw,8vh)}
.image-hero-body{padding-top:4.4vh;padding-bottom:calc(var(--nav-safe-bottom) + 1vh);min-height:0}
.image-hero-stats{align-items:stretch}
.review-stat{display:flex;flex-direction:column;gap:1vh;border-top:1px solid var(--ink);padding-top:1.2vh}
.review-stat-value{font-size:min(4.2vw,7.2vh);font-weight:200;line-height:1.1;letter-spacing:-.04em}
.review-stat p{font-size:max(16px,.94vw);font-weight:400;line-height:1.4}
.review-timeline-head{display:grid;grid-template-columns:auto 1fr;gap:4vw;align-items:start}
.review-timeline-head .t-meta{padding-top:1vh;line-height:1.6}
.review-takeaway{display:grid;grid-template-columns:auto 1fr;gap:2vw;padding:3vh 0;border-top:1px solid var(--border-subtle)}
.review-takeaway:last-child{border-bottom:2px solid var(--accent)}
.review-takeaway-number{font-size:min(3.4vw,6vh);font-weight:200;line-height:1}
.review-takeaway h2{font-size:max(22px,1.7vw);font-weight:500;line-height:1.35;margin-bottom:1.4vh}
.review-takeaway .review-body{font-size:max(18px,1.05vw)}
.half.b-accent .review-body{color:var(--accent-on)}
`;
const notes = ['封面：中文大标题与强调色', '长标题：两行八字与左右半屏', '正文：四项等权内容与正文400', '图片：本地素材完整保留与实际数量', '流程：五步顺序与标签对齐', '收尾：主张与三条行动信息'].map((label, i) => ({
 id: ['review-cover','review-long-title','review-body','review-image','review-process','review-closing'][i],
 title: label, purpose: `检查${label.split('：')[1]}`,
 talk: ['本页是布局测试文案，不是业务建议或数据结论', '检查文字完整性、层级和底部安全距离', '记录本页问题，确认只覆盖实际展示的范围'],
 transition: i === 5 ? '记录审阅意见，再继续处理未决规则' : '继续下一类代表页，检查不同信息密度',
}));
const file = join(target, 'index.html');
let html = readFileSync(file, 'utf8');
html = html.replace('</style>', `${css}</style>`);
html = html.replace(/(<div id="deck">)[\s\S]*?(<\/div>\s*<div id="nav">)/, (_, start, end) => `${start}\n${slides.join('\n')}\n${end}`);
html = html.replace(/const SPEAKER_NOTES = \[[\s\S]*?\];/, () => `const SPEAKER_NOTES = ${JSON.stringify(notes, null, 2)};`);
writeFileSync(file, html);
writeFileSync(join(target, 'images/structure-21x9.svg'), `<svg xmlns="http://www.w3.org/2000/svg" width="2100" height="900" viewBox="0 0 2100 900"><rect width="2100" height="900" fill="#e7e7e2"/><g fill="#bfc0bb"><path d="M900 180h260v540H900zM1190 300h260v420h-260z"/></g><path fill="#002fa7" d="M1480 100h300v620h-300z"/><path d="M800 720h1080" stroke="#0a0a0a" stroke-width="2"/></svg>\n`);
writeFileSync(join(target, 'PROJECT.md'), `# Swiss 六类代表页\n\n- 目的：继续已约定的代表页审阅；不新增风格。\n- 风格规格：版本与摘要见 red-deck.json；style-spec.md 为生成时快照。\n- 配色：沿用模板默认 IKB 蓝作测试，不表示用户已为正式项目选择。\n- 内容：关于风格定义与交接的中性演示文案，无业务结论；图片为代码生成的本地几何示意图。\n- S22 的 21:9、03、01 分别来自素材比例、几何块组数、图源数量，不是模拟业绩。\n- 使用版式：SWISS-COVER-ASCII / S03 / S19 / S22 / S11 / S10。\n- S03 以版式锁的 split 骨架为准；S11 使用模板实际 th-node/label 类和 auto 1fr 头部。来源说明差异见 docs/qa/swiss-representative.md。\n- CSS 仅存在于本例，不修改模板；字号与间距为此次样张值，不升级为全局规则。\n- Q04–Q07 与最终配色仍待确认。S11 保留来源圆点，不据此将圆点定义为新增用户决定。\n- 本轮用户视觉确认：待审阅；S15 既有样张已另行确认，未在此重复。\n- 检查记录：docs/qa/swiss-representative.md。\n`);
console.log(`Built representative example: ${file}`);
