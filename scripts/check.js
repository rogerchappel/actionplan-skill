import fs from 'node:fs';
import assert from 'node:assert/strict';
const required = ['README.md', 'SKILL.md', 'docs/PRD.md', 'docs/TASKS.md', 'docs/ORCHESTRATION.md', 'docs/RELEASE_CANDIDATE.md', 'src/index.js', 'test/index.test.js'];
const missing = required.filter((file) => !fs.existsSync(file));
if (missing.length) { console.error('Missing required files: ' + missing.join(', ')); process.exit(1); }
const skill = fs.readFileSync('SKILL.md', 'utf8');
for (const phrase of ['Side-Effect Boundaries', 'Approval Requirements', 'Validation Workflow']) {
  if (!skill.includes(phrase)) { console.error('SKILL.md missing section: ' + phrase); process.exit(1); }
}

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const minimumNode = packageJson.engines?.node?.match(/^>=(\d+\.\d+\.\d+)$/)?.[1];
assert.ok(minimumNode, 'package.json engines.node must declare an exact minimum such as >=18.1.0');

const workflow = fs.readFileSync('.github/workflows/ci.yml', 'utf8');
const matrixVersions = [...workflow.matchAll(/^\s+- (\d+(?:\.\d+){0,2})\s*$/gm)].map((match) => match[1]);
assert.ok(matrixVersions.includes(minimumNode), `CI matrix must test the declared minimum Node.js version (${minimumNode})`);
console.log('actionplan-skill check passed');
