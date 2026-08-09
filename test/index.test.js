import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { classifyIntent, planAction } from '../src/index.js';

function load(name) { return JSON.parse(fs.readFileSync(path.join('fixtures', name), 'utf8')); }

test('actionplan-skill produces stable fixture output', () => {
  const writePlan = planAction(load('write-request.json'));
  assert.equal(writePlan.actionClass, 'write');
  assert.equal(writePlan.minimumApproval, 'operator approval');
  assert.deepEqual(writePlan.callerApprovals, ['operator review']);
  assert.ok(writePlan.steps.some((step) => step.includes('dry-run')));

  const blockedPlan = planAction(load('blocked-request.json'));
  assert.equal(blockedPlan.blocked, true);
  assert.ok(blockedPlan.stopConditions.includes('credentials-present'));
});

test('plans preserve caller approval requirements without weakening the minimum tier', () => {
  const destructivePlan = planAction(load('destructive-request.json'));
  assert.equal(destructivePlan.minimumApproval, 'explicit owner approval');
  assert.deepEqual(destructivePlan.callerApprovals, ['data owner', 'operator review']);

  const writePlan = planAction(load('write-request.json'));
  assert.equal(writePlan.minimumApproval, 'operator approval');
  assert.deepEqual(writePlan.callerApprovals, ['operator review']);
});

test('intent classification uses whole tokens and respects explicit negation', () => {
  const cases = [
    [{ request: 'Ask the secretary for the agenda' }, 'readonly'],
    [{ request: 'Postpone the meeting' }, 'readonly'],
    [{ request: 'Do not delete the saved draft' }, 'readonly'],
    [{ request: 'Never post the private update' }, 'readonly'],
    [{ request: 'Do not delete the saved draft and send the approved version' }, 'write'],
    [{ request: 'Do not send the draft and delete the rejected version' }, 'destructive'],
    [{ request: 'Do not delete the saved draft or send the approved version' }, 'write'],
    [{ request: 'Do not send the draft nor delete the rejected version' }, 'destructive'],
    [{ request: 'Do not delete or send the saved draft' }, 'write'],
    [{ request: 'Do not delete the draft or do not send it' }, 'readonly'],
    [{ request: 'Do not send the draft nor do not delete it' }, 'readonly'],
    [{ request: 'Do not delete the draft; send the approved version' }, 'write'],
    [{ request: 'Send the note without a password', credentials: true }, 'blocked']
  ];
  for (const [input, expected] of cases) {
    assert.equal(classifyIntent(input), expected, input.request);
  }
});

test('intent classification requires approval for common external side effects', () => {
  const cases = [
    [{ request: 'Publish the approved release' }, 'write', 'operator approval'],
    [{ request: 'Merge the approved pull request' }, 'write', 'operator approval'],
    [{ request: 'Deploy the approved build' }, 'write', 'operator approval'],
    [{ request: 'Do not publish the release' }, 'readonly', 'none'],
    [{ request: 'Never merge the pull request' }, 'readonly', 'none'],
    [{ request: 'Deploy without publishing the draft release' }, 'write', 'operator approval'],
    [{ request: 'Do not deploy the build; publish the release' }, 'write', 'operator approval'],
    [{ request: 'Do not merge this', intent: 'deploy the approved build' }, 'write', 'operator approval'],
    [{ request: 'Review the deployment plan' }, 'readonly', 'none'],
    [{ request: 'Inspect the publisher settings' }, 'readonly', 'none']
  ];
  for (const [input, expectedClass, expectedApproval] of cases) {
    assert.equal(classifyIntent(input), expectedClass, input.request);
    assert.equal(planAction(input).minimumApproval, expectedApproval, input.request);
  }
});

test('intent classification treats input fields as distinct clauses', () => {
  const cases = [
    [{ request: 'Do not delete the draft', intent: 'send the approved version' }, 'write', 'operator approval'],
    [{ request: 'Do not send the draft', intent: 'delete the rejected version' }, 'destructive', 'explicit owner approval'],
    [{ request: 'Do not delete the draft' }, 'readonly', 'none'],
    [{ request: 'Do not delete the draft', intent: 'Never send it' }, 'readonly', 'none']
  ];
  for (const [input, expectedClass, expectedApproval] of cases) {
    assert.equal(classifyIntent(input), expectedClass);
    const plan = planAction(input);
    assert.equal(plan.actionClass, expectedClass);
    assert.equal(plan.minimumApproval, expectedApproval);
  }
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

test('cli preserves token boundaries and negated-action semantics', () => {
  const cases = [
    ['readonly-secretary-request.json', 'readonly'],
    ['readonly-postpone-request.json', 'readonly'],
    ['negated-destructive-request.json', 'readonly'],
    ['negated-write-request.json', 'readonly'],
    ['conjunction-write-request.json', 'write'],
    ['alternative-write-request.json', 'write'],
    ['negated-alternatives-request.json', 'readonly'],
    ['cross-field-write-request.json', 'write'],
    ['cross-field-destructive-request.json', 'destructive']
  ];
  for (const [fixture, expected] of cases) {
    const result = runCli([path.join('fixtures', fixture), '--format', 'json']);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).actionClass, expected, fixture);
  }
});

test('cli renders caller approvals and the derived minimum deterministically', () => {
  const json = runCli(['fixtures/destructive-request.json', '--format', 'json']);
  assert.equal(json.status, 0, json.stderr);
  const plan = JSON.parse(json.stdout);
  assert.equal(plan.minimumApproval, 'explicit owner approval');
  assert.deepEqual(plan.callerApprovals, ['data owner', 'operator review']);
  assert.ok(json.stdout.indexOf('"minimumApproval"') < json.stdout.indexOf('"callerApprovals"'));

  const markdown = runCli(['fixtures/destructive-request.json', '--format', 'markdown']);
  assert.equal(markdown.status, 0, markdown.stderr);
  assert.match(markdown.stdout, /## Minimum Approval\nexplicit owner approval/);
  assert.match(markdown.stdout, /## Caller Approvals\n- data owner\n- operator review/);
  assert.ok(markdown.stdout.indexOf('## Minimum Approval') < markdown.stdout.indexOf('## Caller Approvals'));
});

test('cli requires approval for external side effects unless explicitly negated', () => {
  const cases = [
    ['publish-request.json', 'write', 'operator approval'],
    ['merge-request.json', 'write', 'operator approval'],
    ['deploy-request.json', 'write', 'operator approval'],
    ['negated-publish-request.json', 'readonly', 'none'],
    ['negated-merge-request.json', 'readonly', 'none'],
    ['negated-deploy-request.json', 'readonly', 'none']
  ];
  for (const [fixture, expectedClass, expectedApproval] of cases) {
    const result = runCli([path.join('fixtures', fixture), '--format', 'json']);
    assert.equal(result.status, 0, result.stderr);
    const plan = JSON.parse(result.stdout);
    assert.equal(plan.actionClass, expectedClass, fixture);
    assert.equal(plan.minimumApproval, expectedApproval, fixture);
  }
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
