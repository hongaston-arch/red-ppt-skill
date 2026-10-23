#!/usr/bin/env node
import { loadStyles } from './lib/styles.mjs';

try {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args.length && !['--check', '--json'].includes(args[0]))) {
    throw new Error('Usage: node scripts/styles.mjs [--check|--json]');
  }
  const styles = loadStyles();
  if (args[0] === '--json') console.log(JSON.stringify(styles, null, 2));
  else if (args[0] === '--check') console.log(`PASS ${styles.length} style manifests and all registered file references.`);
  else for (const style of styles) console.log(`${style.id}\t${style.status}\t${style.name}\t${style.guide}`);
} catch (error) {
  console.error(`ERROR ${error.message}`);
  process.exitCode = 1;
}
