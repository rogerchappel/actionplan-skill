# Release Candidate Notes

## Classification

ship

## Included

- Local-first CLI and library API.
- Agent skill instructions.
- Fixture-backed tests.
- Safety and side-effect documentation.

## Verification

Pending PR body should record:

- `npm test`
- `npm run check`
- `npm run build`
- `npm run smoke`

## Known Limitations

- Deterministic heuristics only.
- No connector execution.
- No package publishing in this release candidate.

## Verification Results

- `npm test` PASS, 1 fixture-backed test.
- `npm run check` PASS, required docs and SKILL.md sections present.
- `npm run build` PASS, dist smoke completed.
- `npm run smoke` PASS, rendered write-request dry-run plan.

## Commit Groups

- Project scaffold and metadata.
- Product, orchestration, skill, and release docs.
- Fixtures, engine, renderer, CLI, and tests.
- Check, build, validation, README, and license.
