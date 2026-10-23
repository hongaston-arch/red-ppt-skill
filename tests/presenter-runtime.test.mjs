import test from 'node:test';
import assert from 'node:assert/strict';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadStyles, skillRoot } from '../scripts/lib/styles.mjs';
import { assemblePresenter, loadPresenterSources, locateBlock, planPresenterBuild, presenterBlocks } from '../scripts/lib/presenter-runtime.mjs';

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'red-presenter-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const files = new Set(presenterBlocks.map(block => block.file));
  for (const style of loadStyles()) {
    for (const file of [`styles/${style.id}/style.json`, style.template, style.guide, style.layouts,
      style.themes, style.spec, ...style.rules, ...style.assets, ...style.validators].filter(Boolean)) files.add(file);
  }
  for (const file of files) {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    copyFileSync(join(skillRoot, file), join(root, file));
  }
  return root;
}

function withoutPresenter(text) {
  for (const block of presenterBlocks) {
    const found = locateBlock(text, block);
    text = text.slice(0, found.start) + `<${block.label}>` + text.slice(found.end);
  }
  return text;
}

test('published templates are already assembled and users need no build step', () => {
  const plan = planPresenterBuild();
  assert.equal(plan.length, new Set(loadStyles().map(style => style.template)).size);
  for (const item of plan) assert.equal(item.after, item.before, item.file);
});

test('shared source changes propagate while all style-specific bytes stay untouched', t => {
  const root = fixture(t);
  for (const block of presenterBlocks) {
    const file = join(root, block.file);
    writeFileSync(file, readFileSync(file, 'utf8').replace(block.end, `/* source revision for test */\n${block.end}`));
  }
  const sources = loadPresenterSources(root);
  for (const item of planPresenterBuild(root)) {
    assert.notEqual(item.before, item.after);
    assert.equal(withoutPresenter(item.after), withoutPresenter(item.before));
    assert.equal(assemblePresenter(item.after, sources), item.after, 'assembly is idempotent');
    for (const block of sources) assert.equal(locateBlock(item.after, block).value, block.content);
  }
});

test('equal drift in both templates is caught against the maintained source', t => {
  const root = fixture(t), css = presenterBlocks[0];
  for (const style of loadStyles(root)) {
    const file = join(root, style.template);
    writeFileSync(file, readFileSync(file, 'utf8').replace(css.end, `/* identical drift */\n${css.end}`));
  }
  assert.ok(planPresenterBuild(root).every(item => item.before !== item.after));
});

test('missing, duplicate and reversed boundaries fail instead of rewriting unrelated content', () => {
  const block = presenterBlocks[0];
  for (const source of ['', `${block.start}${block.start}${block.end}`, `${block.end}${block.start}`]) {
    assert.throws(() => locateBlock(source, block), /boundary/);
  }
});

test('malformed source or any malformed target aborts build planning', t => {
  const root = fixture(t), file = join(root, 'assets/template-swiss.html');
  const before = readFileSync(file, 'utf8');
  writeFileSync(file, before.replace(presenterBlocks[1].end, 'missing end'));
  assert.throws(() => planPresenterBuild(root), /boundary/);
  writeFileSync(file, before);
  const css = join(root, presenterBlocks[0].file);
  writeFileSync(css, readFileSync(css, 'utf8') + 'unexpected outside CSS');
  assert.throws(() => planPresenterBuild(root), /only its marked block/);
});

test('new registered templates automatically participate in assembly', t => {
  const root = fixture(t), original = loadStyles(root)[0];
  mkdirSync(join(root, 'styles/new-style'));
  copyFileSync(join(root, original.template), join(root, 'assets/new-template.html'));
  writeFileSync(join(root, 'styles/new-style/style.json'), JSON.stringify({
    ...original, id: 'new-style', name: 'New style', status: 'experimental', template: 'assets/new-template.html',
  }));
  const plan = planPresenterBuild(root);
  assert.equal(plan.length, 3);
  assert.ok(plan.some(item => item.file === 'assets/new-template.html' && item.before === item.after));
});
