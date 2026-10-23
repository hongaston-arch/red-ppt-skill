#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { scaffold } from './lib/scaffold.mjs';

if (!process.argv[2]) throw new Error('Usage: node scripts/build-presenter-review-fixtures.mjs <new-directory>');
const root = resolve(process.argv[2]);
mkdirSync(root); // Refuse existing output, including empty directories.
execFileSync(process.execPath, [fileURLToPath(new URL('./build-swiss-s15-example.mjs', import.meta.url)), join(root, 'swiss')]);
const { target } = scaffold({ styleId: 'magazine', title: 'Magazine · 演讲者运行时检查', output: join(root, 'magazine') });
const notes = ['opening', 'closing'].map((id, i) => ({ id,
  title: i ? '检查结束与交接' : '检查页面与备注', purpose: '验证运行时契约，不作为正式演讲',
  talk: ['核对当前页面与备注是否一致', '检查观众同步与重新打开', '此页是测试文案，没有业务结论'],
  transition: i ? '记录本次实际检查结果' : '进入第二页检查翻页和备注保存',
}));
let html = readFileSync(join(target, 'index.html'), 'utf8');
html = html.replace('<!-- SLIDES_HERE -->', notes.map((note, i) => `<section class="slide light" data-slide-id="${note.id}" data-animate="default">
 <div class="kicker">RED · MAGAZINE / RUNTIME REVIEW 0${i+1}</div>
 <div class="fill col" style="justify-content:center"><h1 class="h1-zh" data-anim="up">${note.title}</h1><p class="body-zh" data-anim="up">测试页面与对应备注。字体与布局沿用杂志模板。</p></div>
 <div class="meta">演示文案 · 无业务结论 · 0${i+1} / 02</div>
</section>`).join('\n'));
html = html.replace(/const SPEAKER_NOTES = \[[\s\S]*?\];/, () => `const SPEAKER_NOTES = ${JSON.stringify(notes, null, 2)};`);
writeFileSync(join(target, 'index.html'), html);
console.log(`Built magazine and Swiss runtime fixtures: ${root}`);
