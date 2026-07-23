import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { planAction } from '../src/index.js';

function load(name) { return JSON.parse(fs.readFileSync(path.join('fixtures', name), 'utf8')); }

test('actionplan-skill produces stable fixture output', () => {
  const writePlan = planAction(load('write-request.json'));
  assert.equal(writePlan.actionClass, 'write');
  assert.equal(writePlan.approval, 'operator approval');
  assert.ok(writePlan.steps.some((step) => step.includes('dry-run')));

  const blockedPlan = planAction(load('blocked-request.json'));
  assert.equal(blockedPlan.blocked, true);
  assert.ok(blockedPlan.stopConditions.includes('credentials-present'));
});

function runCli(args) {
  return spawnSync(process.execPath, ['bin/actionplan-skill.js', ...args], { encoding: 'utf8' });
}

test('cli preserves help, version, Markdown, and JSON output', () => {
  const help = runCli(['--help']);
  assert.equal(help.status, 0);
  assert.match(help.stdout, /Usage: actionplan-skill/);
  assert.match(help.stdout, /<input\.json>/);
  assert.match(help.stdout, /--format markdown\|json/);

  const version = runCli(['--version']);
  assert.equal(version.status, 0);
  assert.match(version.stdout, /^\d+\.\d+\.\d+\n$/);

  const markdown = runCli(['fixtures/write-request.json']);
  assert.equal(markdown.status, 0);
  assert.match(markdown.stdout, /^# Draft a CRM follow-up note/m);

  const json = runCli(['fixtures/write-request.json', '--format', 'json']);
  assert.equal(json.status, 0);
  assert.equal(JSON.parse(json.stdout).actionClass, 'write');
});

test('cli rejects malformed argument combinations with concise diagnostics', () => {
  const cases = [
    { args: [], diagnostic: /missing input file/ },
    { args: ['fixtures/write-request.json', '--bogus'], diagnostic: /unknown option: --bogus/ },
    { args: ['fixtures/write-request.json', '--format'], diagnostic: /--format requires a value/ },
    { args: ['fixtures/write-request.json', '--format', 'json', '--format', 'markdown'], diagnostic: /--format may only be specified once/ },
    { args: ['fixtures/write-request.json', 'fixtures/readonly-request.json'], diagnostic: /unexpected positional argument/ },
    { args: ['fixtures/write-request.json', '--format', 'yaml'], diagnostic: /unsupported format: yaml/ },
    { args: ['--help', 'fixtures/write-request.json'], diagnostic: /unknown option: --help/ },
    { args: ['--version', 'fixtures/write-request.json'], diagnostic: /unknown option: --version/ }
  ];
  for (const { args, diagnostic } of cases) {
    const result = runCli(args);
    assert.notEqual(result.status, 0, args.join(' '));
    assert.match(result.stderr, diagnostic);
    assert.doesNotMatch(result.stderr, /\n\s+at /);
  }
});

test('cli rejects invalid decoded input shapes without stack traces', (context) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'actionplan-skill-test-'));
  context.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const cases = [
    ['null', /input must be a JSON object/],
    ['[]', /input must be a JSON object/],
    ['{"request":42}', /request must be a string/],
    ['{"tools":["gh",42]}', /tools must be an array of strings/],
    ['{"credentials":"yes"}', /credentials must be a boolean/]
  ];
  for (const [index, [contents, diagnostic]] of cases.entries()) {
    const file = path.join(directory, index + '.json');
    fs.writeFileSync(file, contents);
    const result = runCli([file]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, diagnostic);
    assert.doesNotMatch(result.stderr, /\n\s+at /);
  }
});
