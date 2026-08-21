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
a boolean. `approvals` contains requirements supplied by the caller; it does
not override or lower the approval tier derived from the request.

Plans report these concepts separately. `minimumApproval` is the classifier's
minimum tier for the action class, while `callerApprovals` preserves the
validated input `approvals` array in its original order. Both fields are always
present in JSON and Markdown output; omitted input approvals produce an empty
`callerApprovals` list. Callers must satisfy the derived minimum as well as any
additional caller requirements.

## Library

Import from `src/index.js` for tests or agent wrappers. The public functions are intentionally small so other agents can inspect and adapt the behavior.

### Intent classification

Classification is deterministic and token-aware. The classifier lowercases the
`request`, `intent`, and `target` fields, expands common English `n't`
contractions, and compares complete word tokens rather than substrings.
For example, `secretary` does not match `secret`, and `postpone` does not match
`post`.

Supported negative forms are `can't`, `cannot`, `couldn't`, `didn't`, `don't`,
`doesn't`, `isn't`, `shan't`, `shouldn't`, `wasn't`, `weren't`, `won't`, and
`wouldn't`, including curly-apostrophe spellings of the contractions. Each is
normalized to an explicit `not` before classification.

An explicit `no`, `not`, `never`, or `without` suppresses write and destructive
action words through the rest of that clause. Punctuation or a coordinating,
alternative, contrast, or sequence word such as `and`, `or`, `nor`, `but`,
`however`, `instead`, or `then`
begins a new clause, so `Do not delete the draft and send the approved version`
and `Do not delete the draft or send the approved version` are still classified
as writes. A new explicit negation applies to the alternative clause, so
`Do not delete the draft or do not send it` is `readonly`. Each input field also
starts a new clause:
negation in `request` does not
suppress a positive action in `intent` or `target`. A request containing a
credential term remains blocked even when that term is negated, because the tool
does not accept credential-bearing requests. Ambiguous requests with only
negated actions resolve conservatively to `readonly`; the generated plan remains
a dry run and does not execute anything.

The supported action vocabulary is intentionally small and explicit:

- `write` (operator approval): `send`, `post`, `update`, `create`, `write`,
  `draft`, `comment`, `publish`, `merge`, and `deploy`.
- `destructive` (explicit owner approval): `delete`, `destroy`, `remove`,
  `wipe`, `refund`, and `charge`.
- `blocked`: `password`, `secret`, `token`, `credential`, and `credentials`, or
  an input whose `credentials` flag is `true`.

These are whole-token matches, not stemming or semantic inference: for example,
`deployment` does not match `deploy`, and unlisted action verbs default to
`readonly`. Callers should treat that fallback as an unresolved classification
when the request may affect an external system and require separate review.

## Verification

Actionplan Skill supports Node.js 18.1.0 and later. CI verifies the minimum
runtime (18.1.0) and Node.js 22, the current release baseline. Node.js 18.1.0
is the first release with the `node --test` command used by the release gate.

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

`npm run package:smoke` builds a tarball, installs it in a temporary directory,
executes the installed CLI's `--version` path, and asserts that the tarball
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
