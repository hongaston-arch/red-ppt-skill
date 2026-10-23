#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { planPresenterBuild } from './lib/presenter-runtime.mjs';

try {
  const { values } = parseArgs({ options: { write: { type: 'boolean' }, check: { type: 'boolean' } } });
  if (values.write && values.check) throw new Error('Use --write or --check, not both.');
  const plan = planPresenterBuild(), changed = plan.filter(item => item.before !== item.after);
  if (values.write) {
    for (const item of changed) writeFileSync(item.path, item.after);
    console.log(`PASS assembled presenter source into ${plan.length} registered templates; ${changed.length} changed.`);
  } else if (changed.length) {
    for (const item of changed) console.error(`ERROR ${item.file}: presenter source differs; run node scripts/build-presenter-runtime.mjs --write.`);
    process.exitCode = 1;
  } else {
    console.log(`PASS ${plan.length} registered templates match shared presenter source.`);
  }
} catch (error) {
  console.error(`ERROR ${error.message}`);
  process.exitCode = 1;
}
