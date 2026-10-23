import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { skillRoot } from '../scripts/lib/styles.mjs';

function run(script, args) {
  return spawnSync(process.execPath, [join(skillRoot, 'scripts', script), ...args], { encoding: 'utf8' });
}
function example(t) {
  const dir = mkdtempSync(join(tmpdir(), 'red-s15-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const output = join(dir, 'review');
  const result = run('build-swiss-s15-example.mjs', [output]);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  return join(output, 'index.html');
}

test('8-item and 12-item S15 examples pass deck and matching-note checks', t => {
  const file = example(t);
  const result = run('validate-deck.mjs', ['--style', 'swiss', file]);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const html = readFileSync(file, 'utf8');
  assert.ok(!html.includes('[必填]'));
  assert.match(html, /第三行保留空位，不补造内容/);
});

test('under-capacity S15 pages are rejected rather than silently relabelled', t => {
  const file = example(t);
  writeFileSync(file, readFileSync(file, 'utf8').replace(/<div class="matrix-cell [\s\S]*?<\/div>/, ''));
  const result = run('validate-swiss-deck.mjs', [file]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /requires 8-12.*found 7/);
});

test('S15 requires its summary instead of passing an incomplete layout', t => {
  const file = example(t);
  writeFileSync(file, readFileSync(file, 'utf8').replace('class="hero-stat-bottom"', 'class="summary-removed"'));
  const result = run('validate-swiss-deck.mjs', [file]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /requires a \.hero-stat-bottom/);
});
