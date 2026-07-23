# Actionplan Skill Orchestration

## Flow

1. Operator provides action request JSON.
2. Agent runs the CLI in a local workspace.
3. CLI parses JSON and calls the deterministic library function.
4. Renderer emits Markdown or JSON for operator review.
5. Any external action is handled by a separate approved workflow.

## Failure Modes

- Invalid JSON exits non-zero with a concise parse error.
- Unknown or duplicate options, missing option values, extra input files, and unsupported formats exit non-zero with concise diagnostics.
- Missing input files and invalid decoded input shapes exit non-zero without stack traces.

## Evidence

Release-candidate PRs should include results for `npm test`, `npm run check`, `npm run build`, and `npm run smoke`.
