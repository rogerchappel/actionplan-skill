import fs from 'node:fs';
const required = ['README.md', 'SKILL.md', 'docs/PRD.md', 'docs/TASKS.md', 'docs/ORCHESTRATION.md', 'docs/RELEASE_CANDIDATE.md', 'src/index.js', 'test/index.test.js'];
const missing = required.filter((file) => !fs.existsSync(file));
if (missing.length) { console.error('Missing required files: ' + missing.join(', ')); process.exit(1); }
const skill = fs.readFileSync('SKILL.md', 'utf8');
for (const phrase of ['Side-Effect Boundaries', 'Approval Requirements', 'Validation Workflow']) {
  if (!skill.includes(phrase)) { console.error('SKILL.md missing section: ' + phrase); process.exit(1); }
}
console.log('actionplan-skill check passed');
