# Changelog

## Unreleased

- Raised the supported Node.js minimum to 18.1.0, the first release that can
  execute the `node --test` command used by the release gate, and added a check
  that keeps the package declaration aligned with CI.
- Preserved caller-supplied approval requirements separately from the
  classifier-derived minimum approval tier in plan output.
- Scoped explicit negation to coordinated actions joined by `and`.
- Added release-readiness changelog packaging and README verification guidance.
