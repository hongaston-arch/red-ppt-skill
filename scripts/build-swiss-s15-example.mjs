#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { scaffold } from './lib/scaffold.mjs';

const output = process.argv[2];
if (!output) {
  console.error('Usage: node scripts/build-swiss-s15-example.mjs <new-output-directory>');
  process.exit(2);
}
const { target } = scaffold({ styleId: 'swiss', title: 'Swiss S15 · 4列3行样张', output });
const labels = ['定义目标', '确认受众', '收集素材', '选择风格', '规划结构', '编写页面',
  '核对数据', '检查版式', '补充备注', '排练讲述', '完成审阅', '归档交接'];
const slides = [8, 12].map((count, index) => `<section class="slide ${index ? 'dark' : 'light'}" data-layout="S15" data-animate="matrix-fill" data-slide-id="matrix-${count}">
  <div class="canvas-card">
    <div class="chrome-min"><div class="l">RED · SWISS / S15</div><div class="r">布局测试 · ${index + 1} / 2</div></div>
    <header class="s15-head" data-anim="line"><h1>${count === 8 ? '八项，同一网格' : '十二项，完整矩阵'}</h1></header>
    <div class="matrix-fill" data-anim="up" aria-label="四列三行，${count}个测试条目">
${labels.slice(0, count).map((label, i) => `      <div class="matrix-cell ${i === count - 1 ? 'card-accent' : 'card-fill'}"><span class="matrix-index">${String(i + 1).padStart(2, '0')}</span><span class="matrix-title">${label}</span></div>`).join('\n')}
    </div>
    <footer class="hero-stat-bottom" data-anim="up">
      <div><div class="hero-stat-value">${String(count).padStart(2, '0')}</div><div class="hero-stat-label">本页测试条目</div></div>
      <p class="hero-stat-context">示例内容，仅用于布局检查。<br>${count === 8 ? '第三行保留空位，不补造内容。' : '十二个条目填满四列三行。'}</p>
    </footer>
  </div>
</section>`).join('\n');
const notes = [8, 12].map((count, index) => ({
  id: `matrix-${count}`, title: `${count}项S15布局测试`,
  purpose: `验证${count}个测试条目在固定四列三行容量中的布局`,
  talk: ['条目名称为布局测试文案，不代表业务数据',
    '检查短标题、编号和汇总值是否完整可读',
    '确认底部说明与分页控件之间保留安全距离'],
  transition: index === 0 ? '用十二项完整矩阵验证容量上限和暗底表现' : '结束容量测试，记录需要调整的视觉问题',
}));
const file = join(target, 'index.html');
let html = readFileSync(file, 'utf8');
html = html.replace(/(<div id="deck">)[\s\S]*?(<\/div>\s*<div id="nav">)/, (_, start, end) => `${start}\n${slides}\n${end}`);
html = html.replace(/const SPEAKER_NOTES = \[[\s\S]*?\];/, () => `const SPEAKER_NOTES = ${JSON.stringify(notes, null, 2)};`);
writeFileSync(file, html);
writeFileSync(join(target, 'PROJECT.md'), `# S15 容量与视觉样张\n\n- 目的：检查已确认的四列三行结构，分别使用8项与12项测试内容。\n- 风格：Swiss；规格与校验值见 red-deck.json 和 style-spec.md。\n- 配色：模板默认IKB蓝，仅作样张默认，不表示用户已选定配色。\n- 测试内容：短标题为演示文案，数字8/12是本页实际条目数，没有业务结论。\n- 两页分别为亮底与暗底，不属于正式演讲，不编造时长或舞台动作。\n- 八项页保留第三行空位，不补造条目。\n- 视觉批准：待用户审阅；检查记录见仓库 docs/qa/swiss-s15.md。\n`);
console.log(`Built S15 review example: ${file}`);
