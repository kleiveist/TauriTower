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
  - Pure gameplay rules: enemies, towers, projectiles, placement, classic waves, sandbox slot planner.
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

## Known Limits / Extension Points

- Sandbox config persistence is runtime-memory only (no file save/load yet).
- No preset/import/export pipeline yet.
- Accessibility and advanced editor affordances can be layered later without changing core engine interfaces.

## Overlay Settings

Each overlay card has a top-right settings button with a popover for:

- Language: `DE` / `EN`
- Design mode: `Standard` / `Arcade`

The selected values are persisted in `localStorage` and restored on next app launch.
