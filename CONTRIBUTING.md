# Contributing

Thanks for improving `actionplan-skill`.

## Local Setup

```bash
npm install
npm run release:check
```

## Pull Requests

- Keep changes small and focused.
- Add or update fixtures when planner behavior changes.
- Run `npm run release:check` before opening a PR.
- Document user-facing behavior changes in `README.md` or `docs/`.

## Safety Expectations

This package must remain local-first. Do not add network calls, credential handling, or live side effects to the planner path without explicit design review.
