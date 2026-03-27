# Tower Defense Prototype

This prototype runs inside the Tauri desktop frontend with a hybrid architecture:

- Canvas: battlefield rendering and in-wave gameplay.
- React DOM overlay: menu flow, mode selection, map selection, and sandbox slot editor.

## Module Structure

- `data/`
  - Static balancing and content definitions (difficulty, towers, enemies, bosses, maps, constants).
- `math/`
  - Geometry and vector helpers for simulation and placement checks.
- `domain/`
  - Pure gameplay rules: enemies, towers, projectiles, placement, classic waves, sandbox slot planner, dynamic pricing.
- `engine/`
  - `GameSession` orchestration and shared game-state flow for classic + sandbox.
- `runtime/`
  - `controller.ts`: game loop, canvas input, runtime HUD interactions.
  - `renderer.ts`: canvas drawing and hit-area generation.
  - `PrototypeCanvas.tsx`: hybrid menu/editor flow and sandbox UI forms.
  - `layout.ts` / `ui.ts` / `input.ts`: responsive layout, utility helpers, shortcuts.

## Game Flow

`Start -> Mode -> Difficulty -> Map -> (Sandbox Editor) -> Play -> End`

- Classic mode uses the existing classic wave planner.
- Sandbox mode uses user-defined slot configuration.
- End-state handling (restart/menu) stays in gameplay runtime.

## Sandbox Mode

Sandbox uses dynamic editable slots. Each slot defines:

- enemy type
- start round
- base count
- multiplier
- additive increase every 10 rounds
- boss profile stage (only when enemy type is `boss`)
- enabled/disabled state

Spawn ordering is blockwise by slot order.

### Slot Formula

Per slot, spawn count is computed in this order:

1. Start-round gate (`round >= startRound`)
2. Additive 10-round growth (`baseCount + addEvery10Rounds * floor(round / 10)`)
3. Linear multiplier scaling (`1 + (multiplier - 1) * roundsSinceStart`)
4. Rounded result with non-negative clamp

This makes the 10-round increment cumulative (for example, round 10, 20, 30 each add another band).

## Boss Policy in Sandbox

- Bosses are **slot-only** in sandbox mode.
- No automatic every-10-round boss insertion in sandbox.
- Boss profile selection is explicit per boss slot.

## Maps

Three map definitions are available:

- `meadow`
- `canal`
- `switchback`

Maps are selected before game start and drive:

- enemy path movement
- spawn start point
- path rendering
- tower placement/path clearance checks

## Responsive Behavior

- Desktop mode: viewport width `> 1200`.
- Compact mode: viewport width `<= 1200`.
- Breakpoint logic is centralized (`runtime/ui.ts`).
- Sandbox editor remains usable in both modes (compact stacks cards/forms and keeps touch-safe controls).

## Dynamic Economy

- Tower pricing is centralized in `domain/pricing.ts` and exposed to UI through `GameSnapshot.towerPrices`.
- Difficulty multiplier for **new placements** activates from round `6`:
  - `leicht`: `1.1`
  - `mittel`: `1.2`
  - `schwer`: `1.3`
  - `unmoeglich`: `1.4`
- Normal towers use per-type persistent growth after each successful purchase (stored base price increases for the next purchase of that same tower type).
  - current growth factor: `1.12` (applied to stored per-tower base price)
- Panzer tower special rule:
  - no difficulty multiplier
  - stored price doubles after each successful purchase (`1000 -> 2000 -> 4000 -> ...`)
- Prices are rounded with consistent `ceil` behavior to whole numbers.
- Price growth is run-local and resets to tower base costs on restart/new run (`reset` / `chooseDifficulty`).

## Known Limits / Extension Points

- Sandbox config persistence is runtime-memory only (no file save/load yet).
- No preset/import/export pipeline yet.
- Accessibility and advanced editor affordances can be layered later without changing core engine interfaces.

## Runtime Freeze Incident (2026-03)

### Observed Problem

- During longer play sessions (late waves, higher tower/projectile density), the game could become progressively slower and eventually appear frozen/unresponsive.
- The issue was more likely after extended runtime in classic high-wave scenarios and heavy sandbox spawn setups.

### Reproduction Pattern

- Start a long session (for example `unmoeglich`), play into later waves, and keep placing towers so projectile pressure increases.
- In pre-fix builds, frame pacing deteriorates over time and can end in a practical hang.

### Actual Root Cause

- `GameSession.getSnapshot()` performed full deep clones (arrays + nested objects for towers/enemies/bullets/wavePlan).
- The runtime controller called this cloning path from the fixed-step game loop, creating persistent allocation churn and GC pressure.
- Additional pressure came from:
  - wave spawning via `Array.shift()` (reindex cost on each spawn)
  - projectile target lookup via repeated linear `find` scans

### Affected Modules

- `engine/session.ts` (snapshot lifecycle, wave spawning, bullet update flow)
- `runtime/controller.ts` (fixed-step loop snapshot sync)
- `domain/bullet.ts` (target lookup strategy)

### Fix Summary

- Added a non-cloning live snapshot accessor for runtime loop usage.
- Kept defensive clone snapshots for tests/external safety.
- Replaced wave `shift()` consumption with an internal spawn cursor.
- Added per-tick enemy id map for O(1) projectile target resolution.
- Added optional debug mode (settings toggle) with runtime HUD metrics and throttled overload warnings.

### Stability Guardrails

- Debug HUD now shows FPS, frame/sim timings, and entity counters (towers/enemies/bullets + wave progress).
- Throttled warnings are emitted on abnormal runtime pressure to make regressions visible early.
- Gameplay mechanics are preserved; changes target lifecycle/performance internals only.

## Overlay Settings

Each overlay card has a top-right settings button with a popover for:

- Language: `DE` / `EN`
- Design mode: `Standard` / `Arcade`
- Debug mode: `On` / `Off`

The selected values are persisted in `localStorage` and restored on next app launch.
