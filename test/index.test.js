import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
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
