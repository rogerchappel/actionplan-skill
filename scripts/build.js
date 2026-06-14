import fs from 'node:fs';
import cp from 'node:child_process';
fs.rmSync('dist', { recursive: true, force: true });
fs.mkdirSync('dist', { recursive: true });
for (const file of ['README.md', 'SKILL.md', 'package.json']) fs.copyFileSync(file, 'dist/' + file);
cp.execFileSync('node', ['bin/actionplan-skill.js', 'fixtures/write-request.json', '--format', 'json'], { stdio: ['ignore', 'pipe', 'inherit'] });
console.log('actionplan-skill build passed');
