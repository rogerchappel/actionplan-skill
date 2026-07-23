#!/usr/bin/env node
import fs from 'node:fs';
import pkg from '../package.json' with { type: 'json' };
import { planAction, validateActionInput } from '../src/index.js';
import { renderMarkdown } from '../src/render.js';

const USAGE = 'Usage: actionplan-skill <input.json> [--format markdown|json]\n       actionplan-skill --help\n       actionplan-skill --version';

function fail(message) {
  console.error('Error: ' + message);
  process.exit(1);
}

function parseArgs(args) {
  if (args.length === 1 && args[0] === '--help') return { command: 'help' };
  if (args.length === 1 && args[0] === '--version') return { command: 'version' };

  let file;
  let format = 'markdown';
  let formatSeen = false;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--format') {
      if (formatSeen) fail('--format may only be specified once');
      if (index + 1 >= args.length || args[index + 1].startsWith('--')) fail('--format requires a value');
      format = args[index + 1];
      formatSeen = true;
      index += 1;
    } else if (arg.startsWith('-')) {
      fail('unknown option: ' + arg);
    } else if (file) {
      fail('unexpected positional argument: ' + arg);
    } else {
      file = arg;
    }
  }
  if (!file) fail('missing input file');
  if (!['markdown', 'json'].includes(format)) fail('unsupported format: ' + format);
  return { command: 'plan', file, format };
}

const options = parseArgs(process.argv.slice(2));
if (options.command === 'help') {
  console.log(USAGE);
  process.exit(0);
}
if (options.command === 'version') {
  console.log(pkg.version);
  process.exit(0);
}

let input;
try { input = JSON.parse(fs.readFileSync(options.file, 'utf8')); }
catch (error) { console.error('Failed to read JSON input: ' + error.message); process.exit(1); }
try { validateActionInput(input); }
catch (error) { fail('invalid input: ' + error.message); }
const result = planAction(input);
console.log(options.format === 'json' ? JSON.stringify(result, null, 2) : renderMarkdown(result));
