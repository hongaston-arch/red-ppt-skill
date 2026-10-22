#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { scaffold } from './lib/scaffold.mjs';

try {
  const { values, positionals } = parseArgs({
    options: { style: { type: 'string' }, title: { type: 'string' } },
    allowPositionals: true,
  });
  if (positionals.length !== 1 || !values.style) {
    throw new Error('Usage: node scripts/new-deck.mjs --style <id> --title <title> <new-output-directory>');
  }
  const { target, style } = scaffold({ styleId: values.style, title: values.title, output: positionals[0] });
  console.log(`Created authoring scaffold: ${target}`);
  console.log(`Style: ${style.id} (${style.status}); read ${style.guide} from the skill root.`);
  console.log('Next: author slides and notes, replace sample content, then run validate-deck.mjs.');
  console.log('This is not a finished deck. CDN fonts/icons may still require network access.');
} catch (error) {
  console.error(`ERROR ${error.message}`);
  process.exitCode = 1;
}
