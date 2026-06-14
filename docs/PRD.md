# Actionplan Skill PRD

## Goal

Create a reusable, local-first agent skill that converts a requested external action into an auditable dry-run plan with approval tiers, tool routing, evidence needs, and stop conditions.

## Users

- Agent builders who need reusable skill instructions.
- Operators who need reviewable dry-run output.
- Maintainers who want fixture-backed behavior before connector integration.

## MVP Scope

- CLI and library API.
- Fixture-backed tests.
- Markdown and JSON output.
- Skill instructions with side-effect boundaries.
- Release-candidate documentation.

## Out Of Scope

- External service calls.
- Credential access.
- Automatic writes to user systems.
- Package publishing.

## Success Criteria

- All verification commands pass locally.
- Fixtures cover read-only, write, destructive, blocked cases.
- README and SKILL.md explain safe use without hidden side effects.
