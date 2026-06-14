# Actionplan Skill

Dry-run action planning skill for agent side-effect review.

Actionplan Skill is a local-first agent skill package that converts a requested external action into an auditable dry-run plan with approval tiers, tool routing, evidence needs, and stop conditions. It is designed for dry-run agent workflows where inputs are explicit files and outputs are reviewable artifacts.

## Quickstart

```bash
npm install
npm test
npm run smoke
node bin/actionplan-skill.js fixtures/write-request.json --format markdown
```

## CLI

```bash
node bin/actionplan-skill.js fixtures/write-request.json --format markdown
node bin/actionplan-skill.js fixtures/write-request.json --format json
```

The CLI reads action request JSON and prints a dry-run action plan. It never calls external services, writes to third-party systems, or reads credentials.

## Library

Import from `src/index.js` for tests or agent wrappers. The public functions are intentionally small so other agents can inspect and adapt the behavior.

## Safety Notes

- Local file input only.
- No network calls.
- No credential handling.
- Any external action must happen in a separate, explicitly approved workflow.

## Limitations

This is a deterministic MVP. It uses simple heuristics and fixtures, not live enrichment or model calls. Treat output as a review packet, not an authority.
