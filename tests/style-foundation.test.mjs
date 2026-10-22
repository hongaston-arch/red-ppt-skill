import test from 'node:test';
import assert from 'node:assert/strict';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { getStyle, loadStyles, resource, skillRoot } from '../scripts/lib/styles.mjs';
import { scaffold } from '../scripts/lib/scaffold.mjs';

function temp(t) {
  const dir = mkdtempSync(join(tmpdir(), 'red-ppt-test-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function fixture(t) {
  const root = temp(t);
  const style = structuredClone(getStyle('magazine'));
  for (const file of ['styles/magazine/style.json', style.template, style.guide, style.layouts,
    style.themes, ...style.rules, ...style.assets]) {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    copyFileSync(resource(skillRoot, file), join(root, file));
  }
  return { root, style, save: () => writeFileSync(join(root, 'styles/magazine/style.json'), JSON.stringify(style)) };
}

function run(script, args) {
  return spawnSync(process.execPath, [join(skillRoot, 'scripts', script), ...args], { encoding: 'utf8' });
}

function completedMagazine(t) {
  const target = join(temp(t), 'deck');
  scaffold({ styleId: 'magazine', title: 'Test', output: target });
  const file = join(target, 'index.html');
  const notes = [{ id: 'opening', title: 'Test', purpose: 'Introduce the test',
    transition: 'End', talk: ['Context', 'Evidence', 'Conclusion'] }];
  let html = readFileSync(file, 'utf8');
  html = html.replace('<!-- SLIDES_HERE -->', '<section class="slide light" data-slide-id="opening"><h1>Test</h1></section>');
  html = html.replace(/const SPEAKER_NOTES = \[[\s\S]*?\];/, `const SPEAKER_NOTES = ${JSON.stringify(notes)};`);
  writeFileSync(file, html);
  return file;
}

test('both inherited styles resolve to real resources and distinct validation rules', () => {
  const styles = loadStyles();
  assert.ok(styles.some(style => style.id === 'magazine'));
  assert.ok(styles.some(style => style.id === 'swiss'));
  assert.deepEqual(getStyle('magazine').validators, []);
  assert.deepEqual(getStyle('swiss').validators, ['scripts/validate-swiss-deck.mjs']);
});

test('a new package is discovered without changing the registry code', t => {
  const f = fixture(t);
  mkdirSync(join(f.root, 'styles/test-style'));
  writeFileSync(join(f.root, 'styles/test-style/style.json'), JSON.stringify({
    ...f.style, id: 'test-style', name: 'Test style', status: 'experimental',
  }));
  assert.equal(getStyle('test-style', f.root).status, 'experimental');
});

test('manifest validation rejects missing resources and mismatched ids', t => {
  const f = fixture(t);
  f.style.guide = 'missing.md'; f.save();
  assert.throws(() => loadStyles(f.root), /ENOENT/);
  f.style.guide = 'styles/magazine/guide.md';
  f.style.id = 'swiss'; f.save();
  assert.throws(() => loadStyles(f.root), /id/);
});

test('manifest validation rejects invalid versions, runtime and asset destinations', t => {
  const f = fixture(t);
  f.style.schemaVersion = 2; f.save();
  assert.throws(() => loadStyles(f.root), /schemaVersion/);
  f.style.schemaVersion = 1; f.style.runtime = 'other'; f.save();
  assert.throws(() => loadStyles(f.root), /runtime/);
  f.style.runtime = 'guizang-presenter-v1'; f.style.assets = ['styles/magazine/guide.md']; f.save();
  assert.throws(() => loadStyles(f.root), /under assets/);
});

test('resource paths cannot escape the skill, including through symlinks', t => {
  const root = temp(t), outside = temp(t);
  writeFileSync(join(outside, 'outside.md'), 'outside');
  assert.throws(() => resource(root, '../outside.md'), /relative/);
  assert.throws(() => resource(root, join(outside, 'outside.md')), /relative/);
  symlinkSync(join(outside, 'outside.md'), join(root, 'link.md'));
  assert.throws(() => resource(root, 'link.md'), /inside the skill/);
});

for (const id of ['magazine', 'swiss']) {
  test(`${id} scaffold escapes title and carries local assets after relocation`, t => {
    const root = temp(t), output = join(root, 'original');
    const title = 'A & B </title><script>bad()</script> $&';
    scaffold({ styleId: id, title, output });
    const moved = join(root, 'moved'); renameSync(output, moved);
    const html = readFileSync(join(moved, 'index.html'), 'utf8');
    assert.ok(html.includes('<title>A &amp; B &lt;/title&gt;&lt;script&gt;bad()&lt;/script&gt; $&amp;</title>'));
    assert.ok(!html.includes('<script>bad()'));
    assert.ok(existsSync(join(moved, 'images')));
    assert.equal(readFileSync(join(moved, 'assets/motion.min.js'), 'utf8'), readFileSync(resource(skillRoot, 'assets/motion.min.js'), 'utf8'));
    assert.equal(JSON.parse(readFileSync(join(moved, 'red-deck.json'), 'utf8')).style, id);
  });
}

test('scaffold never overwrites an existing output directory', t => {
  const output = temp(t); writeFileSync(join(output, 'index.html'), 'keep');
  assert.throws(() => scaffold({ styleId: 'magazine', title: 'Test', output }), /EEXIST/);
  assert.equal(readFileSync(join(output, 'index.html'), 'utf8'), 'keep');
});

test('invalid style or title does not create an output directory', t => {
  const output = join(temp(t), 'new');
  assert.throws(() => scaffold({ styleId: 'unknown', title: 'Test', output }), /Unknown style/);
  assert.throws(() => scaffold({ styleId: 'magazine', title: ' ', output }), /title/);
  assert.equal(existsSync(output), false);
});

test('CLI reports unknown arguments instead of silently ignoring them', () => {
  const result = run('new-deck.mjs', ['--typo', 'swiss']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Unknown option/);
});

test('unfinished scaffolds cannot pass final validation', t => {
  for (const styleId of ['magazine', 'swiss']) {
    const output = join(temp(t), styleId);
    scaffold({ styleId, title: 'Test', output });
    const result = run('validate-deck.mjs', ['--style', styleId, join(output, 'index.html')]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /No authored slides|placeholders/);
  }
});

test('completed magazine validates its notes and rejects mismatches', t => {
  const file = completedMagazine(t);
  const valid = run('validate-deck.mjs', ['--style', 'magazine', file]);
  assert.equal(valid.status, 0, valid.stdout + valid.stderr);
  writeFileSync(file, readFileSync(file, 'utf8').replace('data-slide-id="opening"', 'data-slide-id="different"'));
  const invalid = run('validate-deck.mjs', ['--style', 'magazine', file]);
  assert.notEqual(invalid.status, 0);
  assert.match(invalid.stdout + invalid.stderr, /does not match/);
});

test('metadata prevents validating a deck with the wrong style', t => {
  const file = completedMagazine(t);
  const result = run('validate-deck.mjs', ['--style', 'swiss', file]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /does not match/);
});

test('specification and revision must be registered together with a real file', t => {
  const f = fixture(t);
  f.style.spec = 'styles/magazine/guide.md'; f.save();
  assert.throws(() => loadStyles(f.root), /specRevision/);
  f.style.specRevision = 'draft-01'; f.save();
  assert.equal(getStyle('magazine', f.root).specRevision, 'draft-01');
  f.style.spec = 'missing-spec.md'; f.save();
  assert.throws(() => loadStyles(f.root), /ENOENT/);
});

test('a deck preserves its specification when the source specification changes', t => {
  const f = fixture(t);
  f.style.spec = 'styles/magazine/guide.md'; f.style.specRevision = 'draft-01'; f.save();
  const source = readFileSync(join(f.root, f.style.spec), 'utf8');
  const output = join(temp(t), 'deck');
  scaffold({ styleId: 'magazine', title: 'Test', output, root: f.root });
  writeFileSync(join(f.root, f.style.spec), 'A later source revision');
  assert.equal(readFileSync(join(output, 'style-spec.md'), 'utf8'), source);
  const metadata = JSON.parse(readFileSync(join(output, 'red-deck.json'), 'utf8'));
  assert.equal(metadata.styleSpec.revision, 'draft-01');
  assert.equal(metadata.styleSpec.sha256, createHash('sha256').update(source).digest('hex'));
});

test('final validation rejects a modified specification snapshot', t => {
  const file = completedMagazine(t), dir = dirname(file);
  writeFileSync(join(dir, 'style-spec.md'), 'original specification');
  const metadataFile = join(dir, 'red-deck.json');
  const metadata = JSON.parse(readFileSync(metadataFile, 'utf8'));
  metadata.styleSpec = { path: 'style-spec.md', revision: 'draft-01',
    sha256: createHash('sha256').update('original specification').digest('hex') };
  writeFileSync(metadataFile, JSON.stringify(metadata));
  const valid = run('validate-deck.mjs', ['--style', 'magazine', file]);
  assert.equal(valid.status, 0, valid.stdout + valid.stderr);
  writeFileSync(join(dir, 'style-spec.md'), 'changed specification');
  const invalid = run('validate-deck.mjs', ['--style', 'magazine', file]);
  assert.notEqual(invalid.status, 0);
  assert.match(invalid.stderr, /checksum/);
});

test('commented slides and slide-number class are not treated as authored pages', t => {
  const file = join(temp(t), 'index.html');
  writeFileSync(file, '<!-- <section class="slide">test</section> --><section class="slide-number">1</section>');
  const result = run('validate-deck.mjs', ['--style', 'magazine', file]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /No authored slides/);
});
