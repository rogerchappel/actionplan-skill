#!/usr/bin/env bash
set -euo pipefail
npm test
npm run check
npm run build
npm run smoke >/tmp/actionplan-skill-smoke.md
test -s /tmp/actionplan-skill-smoke.md
