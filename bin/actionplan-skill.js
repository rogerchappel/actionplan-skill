#!/usr/bin/env node
import fs from 'node:fs';
import { planAction } from '../src/index.js';
import { renderMarkdown } from '../src/render.js';

const args = process.argv.slice(2);
const file = args[0];
const formatIndex = args.indexOf('--format');
const format = formatIndex >= 0 ? args[formatIndex + 1] : 'markdown';

if (!file || args.includes('--help')) {
  console.log('Usage: actionplan-skill <input.json> [--format markdown|json]');
  process.exit(file ? 0 : 1);
}
if (!['markdown', 'json'].includes(format)) {
  console.error('Unsupported format: ' + format);
  process.exit(1);
}
let input;
try { input = JSON.parse(fs.readFileSync(file, 'utf8')); }
catch (error) { console.error('Failed to read JSON input: ' + error.message); process.exit(1); }
const result = planAction(input);
console.log(format === 'json' ? JSON.stringify(result, null, 2) : renderMarkdown(result));
