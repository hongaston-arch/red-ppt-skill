#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { inspectModernBusiness } from './lib/modern-business.mjs';
try {
  if(process.argv.length!==3)throw new Error('Usage: node scripts/validate-modern-business-deck.mjs <index.html>');
  const result=inspectModernBusiness(readFileSync(process.argv[2],'utf8'));
  if(result.errors.length)throw new Error(result.errors.join('\n'));
  console.log(`PASS modern-business structure (${result.slides} slides). Browser bounds, image fit and visual review are separate.`);
}catch(error){console.error(error.message);process.exitCode=1;}
