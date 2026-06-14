# Actionplan Skill Orchestration

## Flow

1. Operator provides action request JSON.
2. Agent runs the CLI in a local workspace.
3. CLI parses JSON and calls the deterministic library function.
4. Renderer emits Markdown or JSON for operator review.
5. Any external action is handled by a separate approved workflow.

## Failure Modes

- Invalid JSON exits non-zero with a concise parse error.
- Unsupported format exits non-zero.
- Missing input file exits non-zero through Node file handling.

## Evidence

Release-candidate PRs should include results for `npm test`, `npm run check`, `npm run build`, and `npm run smoke`.
