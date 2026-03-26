# Tower Defense Prototype (Canvas)

This folder contains a fully playable Canvas-based prototype that runs inside the Tauri desktop frontend.

## Module Structure

- `data/`
  - Static balancing/content definitions (difficulty, towers, enemies, bosses, path, constants).
- `math/`
  - Geometry/vector helpers used by simulation and placement checks.
- `domain/`
  - Pure gameplay rules: enemy movement, tower targeting, projectile effects, placement validation, wave planning.
- `engine/`
  - `GameSession` orchestration (state, actions, tick order, economy, lives, progression, win/lose).
- `runtime/`
  - Canvas runtime layers:
    - `controller.ts` input + update loop + menu flow
    - `renderer.ts` drawing + click-hit regions
    - `layout.ts` responsive viewport/world mapping
    - `input.ts` key helpers / selection helpers
- `*.test.ts`
  - Deterministic gameplay tests with Vitest.

## Gameplay Flow

1. Start screen.
2. Difficulty selection (`leicht`, `mittel`, `schwer`, `unmoeglich`).
3. Playing loop:
   - select tower in sidebar,
   - place tower on field,
   - start wave manually (first and optional later),
   - waves continue with auto-advance after clear.
4. End state overlay (`victory` or `game_over`) with restart/menu actions.

## Difficulty and Wave Formula

Normal wave enemy count follows exactly:

`ceil(level * difficultyMultiplier)`

Multipliers:

- `leicht`: `1.0`
- `mittel`: `1.4`
- `schwer`: `2.0`
- `unmoeglich`: `2.5`

Boss waves occur every 10 levels (`10, 20, 30, 40, ...`).

## Enemy and Boss Logic

- Normal enemy archetypes: `basic`, `runner`, `brute`, `shield` (new type).
- `shield` is intentionally distinct: high armor/splash resistance with regeneration.
- Bosses are profile-driven (`data/bosses.ts`) and scale by stage.
- Each boss stage has different visuals and gameplay stats (HP multiplier, speed, armor, slow resist, regen, reward).

## Towers (including Panzer-Tower)

- Existing tower families are ported with separated stats and projectile behavior.
- `Panzer-Tower` is a new late-game power tower:
  - expensive,
  - high damage,
  - strong cannon splash profile,
  - intentionally overpowered compared to base towers.

## Known Limits / Extension Points

- Prototype focuses on local play; save/load persistence is not implemented yet.
- UI uses Canvas rendering only (no production-grade accessibility layer yet).
- Balancing is data-driven; tweak `data/*.ts` without touching domain/engine code.
- Runtime can be extended with speed controls, pause state, upgrades, and richer effects without changing core API.
