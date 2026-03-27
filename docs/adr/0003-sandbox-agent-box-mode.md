<!-- AUTO-GENERATED:backlink START -->
[← Back](adr.md)
<!-- AUTO-GENERATED:backlink END -->
# ADR 0003: Sandbox / Agent-Box Mode Architecture

- Status: Accepted
- Date: 2026-03-27
- Deciders: TauriTwoer dev stream
- Related: [ADR 0001](0001-tauri-target-architecture.md), [ADR 0002](0002-repo-tooling-boundaries.md)

## Context

The prototype originally only supported classic fixed wave generation. We need a playable sandbox mode where users can configure enemy spawns directly in the app, select maps before a run, and keep the gameplay systems shared with classic mode.

The solution must remain in TypeScript/Tauri (no Python runtime) and keep responsive behavior for desktop and compact viewports.

## Decision

1. Introduce `GameMode` with `classic | sandbox` in the shared engine snapshot/action flow.
2. Keep classic planner unchanged for classic mode.
3. Add sandbox slot planner with fixed semantic order:
   - start-round gate,
   - cumulative additive growth every 10 rounds,
   - linear multiplier scaling,
   - rounding and non-negative clamp.
4. Keep sandbox slot ordering stable and evaluate blockwise by slot order.
5. In sandbox mode, bosses are slot-only and require explicit boss profile selection (`bossStage`).
6. Add three selectable maps and make movement, spawn origin, path rendering, and placement checks map-aware.
7. Use hybrid runtime UI:
   - Canvas for battlefield/gameplay rendering,
   - React DOM overlay for mode/difficulty/map/sandbox editor flow.
8. Keep sandbox config persistence in runtime memory for this phase (no file save/load).

## Consequences

### Positive

- Sandbox mode is fully playable and uses real combat/economy/life/win-lose systems.
- Slot model is extensible for future presets/import-export/save features.
- Map-aware abstractions are reusable across both classic and sandbox.
- Hybrid UI enables editable forms without forcing a full canvas-only editor.

### Tradeoffs

- Runtime now has two UI layers (Canvas + DOM overlay) that must stay synchronized.
- In-memory-only persistence means sandbox setups are lost on app restart.
- Additional validation logic is required to prevent invalid slot configurations.

## Non-Goals

- Persistent storage format for sandbox presets.
- Networked/multiplayer sandbox sharing.
- Full production-grade accessibility pass for all editor controls.
