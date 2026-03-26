<!-- AUTO-GENERATED:backlink START -->
[← Back](adr.md)
<!-- AUTO-GENERATED:backlink END -->
# ADR 0002: Repository and Tooling Boundaries

- Status: Accepted
- Date: 2026-03-26

## Context

The project contains three distinct concerns:

- gameplay prototype reference
- production target architecture
- operational tooling

Without explicit boundaries, prototype code and tooling scripts become mixed and maintenance cost increases.

## Decision

Repository boundaries are enforced as follows:

- `prototype/` stores reference gameplay prototype code.
- `tools/` stores operational scripts only (install, doctor, run, test, build, fix).
- `docs/` stores decisions, workflows, and usage guidance.
- `.archive/` stores deprecated scripts that are kept only for traceability.

`tools/control.py` is the canonical operator entrypoint.
Subtools are invoked through control flags whenever possible.

## Contribution Quality Gate

A new contribution must clearly satisfy at least one of these roles:

- improve target architecture
- port gameplay logic into the target runtime
- strengthen tooling/build/diagnostics
- improve maintainability
- improve traceability of the porting process

## Consequences

- Prototype logic remains discoverable without being treated as production runtime code.
- Tooling remains project-scoped and documented through one entrypoint.
- Onboarding and future automation become simpler because scope boundaries are explicit.

## Rejected Defaults

- Treating prototype code as tooling.
- Keeping personal machine paths hardcoded in operational scripts.
- Introducing runtime dependencies that conflict with ADR-0001.
