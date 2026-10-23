#!/usr/bin/env node
import { loadPresenterSources, locateBlock, planPresenterBuild } from './lib/presenter-runtime.mjs';

try {
  const sources = loadPresenterSources(), plan = planPresenterBuild();
  let failed = false;
  for (const block of sources) {
    const drift = plan.filter(item => locateBlock(item.before, block, item.file).value !== block.content);
    for (const item of drift) {
      console.error(`ERROR ${block.label} drift: ${item.file} differs from ${block.file}.`);
      failed = true;
    }
    if (!drift.length) console.log(`PASS ${block.label} matches shared source across ${plan.length} registered templates.`);
  }
  process.exitCode = failed ? 1 : 0;
} catch (error) {
  console.error(`ERROR ${error.message}`);
  process.exitCode = 1;
}
