# Actionplan Skill

Dry-run action planning skill for agent side-effect review.

Actionplan Skill is a local-first agent skill package that converts a requested external action into an auditable dry-run plan with approval tiers, tool routing, evidence needs, and stop conditions. It is designed for dry-run agent workflows where inputs are explicit files and outputs are reviewable artifacts.

## Quickstart

```bash
npm install
npm run release:check
node bin/actionplan-skill.js fixtures/write-request.json --format markdown
```

## CLI

```bash
node bin/actionplan-skill.js fixtures/write-request.json --format markdown
node bin/actionplan-skill.js fixtures/write-request.json --format json
node bin/actionplan-skill.js --help
node bin/actionplan-skill.js --version
```

The CLI reads action request JSON and prints a dry-run action plan. It never calls external services, writes to third-party systems, or reads credentials.
It accepts exactly one input file and at most one `--format` option. Input fields
`request`, `intent`, and `target` must be strings; `tools`, `evidence`, and
`approvals` must be arrays of strings; and `credentials`, when present, must be
a boolean.

## Library

Import from `src/index.js` for tests or agent wrappers. The public functions are intentionally small so other agents can inspect and adapt the behavior.

### Intent classification

Classification is deterministic and token-aware. The classifier lowercases the
`request`, `intent`, and `target` fields, expands common English `n't`
contractions, and compares complete word tokens rather than substrings.
For example, `secretary` does not match `secret`, and `postpone` does not match
`post`.

An explicit `no`, `not`, `never`, or `without` suppresses write and destructive
action words through the rest of that clause. Punctuation or a coordinating,
contrast, or sequence word such as `and`, `but`, `however`, `instead`, or `then`
begins a new clause, so `Do not delete the draft and send the approved version`
is still classified as a write. Each input field also starts a new clause:
negation in `request` does not
suppress a positive action in `intent` or `target`. A request containing a
credential term remains blocked even when that term is negated, because the tool
does not accept credential-bearing requests. Ambiguous requests with only
negated actions resolve conservatively to `readonly`; the generated plan remains
a dry run and does not execute anything.

## Verification

Run the full release gate before opening a release PR:

```bash
npm run release:check
```

The release gate runs syntax checks, fixture-backed tests, the CLI smoke path,
and package boundary verification. Use the individual commands when narrowing a
failure:

```bash
npm run check
npm run lint
npm test
npm run build
npm run smoke
npm run package:smoke
```

`npm run package:smoke` performs a dry-run pack and asserts that the tarball
contains the CLI entrypoint, README, license, safety docs, changelog, skill
instructions, release verification notes, and representative fixtures.

## Safety Notes

- Local file input only.
- No network calls.
- No credential handling.
- Any external action must happen in a separate, explicitly approved workflow.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development expectations and [SECURITY.md](SECURITY.md) for vulnerability reporting and data handling guidance.

## Limitations

This is a deterministic MVP. It uses simple heuristics and fixtures, not live enrichment or model calls. Treat output as a review packet, not an authority.
