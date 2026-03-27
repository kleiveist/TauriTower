<!-- AUTO-GENERATED:backlink START -->
[← Back](index.md)
<!-- AUTO-GENERATED:backlink END -->
# Documentation Index

This directory is split by audience and decision type.

## Architecture Decision Records

- [0001 - Tauri Target Architecture](adr/0001-tauri-target-architecture.md)
- [0002 - Repository and Tooling Boundaries](adr/0002-repo-tooling-boundaries.md)
- [0003 - Sandbox / Agent-Box Mode Architecture](adr/0003-sandbox-agent-box-mode.md)

## Developer Docs

- [Porting Workflow](dev/porting-workflow.md)
- [Implementation Order](dev/implementation-order.md)
- [Prototype Architecture (Headless)](dev/prototype-architecture.md)

## Tooling Docs

- [Tooling Overview](tools/README.md)
- [Control CLI Command Matrix](tools/control-cli.md)
- [Environment Variables](tools/environment-variables.md)
- [Tool Selection Guide](tools/tool-selection.md)

## User Docs

- [Run and Play Guide](usr/run-play-guide.md)

## Governance Notes

- All runtime architecture decisions should reference ADR-0001.
- All repo-structure and tooling-boundary decisions should reference ADR-0002.
- Sandbox/agent-box mode and slot-scaling decisions should reference ADR-0003.
- `tools/control.py` is the canonical operator entrypoint for this repository.
