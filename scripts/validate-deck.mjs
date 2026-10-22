#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { parseArgs } from 'node:util';
import { createHash } from 'node:crypto';
import { getStyle, resource, skillRoot } from './lib/styles.mjs';

try {
  const { values, positionals } = parseArgs({ options: { style: { type: 'string' } }, allowPositionals: true });
  if (!values.style || positionals.length !== 1) {
    throw new Error('Usage: node scripts/validate-deck.mjs --style <id> <index.html>');
  }
  const style = getStyle(values.style);
  const file = resolve(positionals[0]);
  const metadata = join(dirname(file), 'red-deck.json');
  if (existsSync(metadata)) {
    const recorded = JSON.parse(readFileSync(metadata, 'utf8'));
    if (recorded.style !== style.id || recorded.runtime !== style.runtime) {
      throw new Error('Selected style/runtime does not match red-deck.json.');
    }
    if (recorded.styleSpec) {
      const snapshot = recorded.styleSpec;
      if (snapshot.path !== 'style-spec.md' || typeof snapshot.revision !== 'string') {
        throw new Error('Invalid style specification snapshot metadata.');
      }
      const actual = createHash('sha256').update(readFileSync(join(dirname(file), snapshot.path))).digest('hex');
      if (actual !== snapshot.sha256) throw new Error('Style specification snapshot differs from its recorded checksum.');
      if (snapshot.revision !== style.specRevision) {
        console.log(`NOTE Deck uses specification ${snapshot.revision}; current package uses ${style.specRevision ?? 'no specification'}. Review migration explicitly.`);
      } else if (style.spec) {
        const current = createHash('sha256').update(readFileSync(resource(skillRoot, style.spec))).digest('hex');
        if (current !== snapshot.sha256) {
          console.log('NOTE Current specification content differs at the same revision. Keep the recorded snapshot and review the difference explicitly.');
        }
      }
    }
  }
  const html = readFileSync(file, 'utf8');
  const source = html.replace(/<!--[\s\S]*?-->/g, '');
  const hasSlides = [...source.matchAll(/<section\b[^>]*>/gi)].some(([tag]) => {
    const classes = tag.match(/\bclass\s*=\s*(["'])(.*?)\1/i)?.[2] || '';
    return classes.split(/\s+/).includes('slide');
  });
  if (!hasSlides) {
    throw new Error('No authored slides found. The scaffold is not a finished deck.');
  }
  if (/\[必填\]/.test(source) || /<!--\s*SLIDES_HERE\b/.test(html)) {
    throw new Error('Unfinished template placeholders remain; replace sample content and remove SLIDES_HERE.');
  }
  let failed = false;
  for (const validator of ['scripts/validate-presenter-mode.mjs', ...style.validators]) {
    const result = spawnSync(process.execPath, [resource(skillRoot, validator), file], { stdio: 'inherit' });
    if (result.error) throw result.error;
    if (result.status !== 0) failed = true;
  }
  if (failed) process.exitCode = 1;
  else {
    console.log(`PASS registered checks for ${style.id}.`);
    if (!style.validators.length) console.log('NOTE No style-specific layout validator is registered.');
    console.log('Browser visual review, asset completeness, and presenter interaction checks are still required.');
  }
} catch (error) {
  console.error(`ERROR ${error.message}`);
  process.exitCode = 1;
}
