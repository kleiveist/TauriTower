# Porting Workflow

This workflow defines how to convert prototype gameplay into the TauriTwoer target runtime.

## 1. Analyze Before Porting

- Read the relevant prototype subsystem in `prototype/PyTowerDefensev.py`.
- Capture behavior, state transitions, constraints, and balancing assumptions.
- Identify data inputs/outputs before writing target code.

## 2. Port Semantics to TypeScript

- Recreate game rules and simulation behavior in TypeScript.
- Keep logic modules independent from Canvas and DOM APIs.
- Avoid direct line-by-line syntax translation.

## 3. Rebuild Runtime Layers Natively

- Rendering: Canvas draw pipeline and visual state mapping.
- Input: pointer/keyboard abstraction and action dispatch.
- UI/HUD: frontend components and state presentation.

## 4. Validate Behavior

- Compare expected prototype behavior against ported behavior.
- Validate balancing-sensitive elements (wave progression, economy, placement, hit logic).
- Add or update automated tests where deterministic logic exists.

## 5. Integrate Desktop Concerns

- Implement save/load and desktop filesystem operations through Tauri/Rust APIs.
- Keep game logic portable and isolated from host integration code.

## Modeling Guidance

- Favor data-driven definitions for towers, enemies, projectiles, bosses, and difficulty profiles.
- Keep simulation state serializable and easy to inspect.
- Use explicit interfaces between simulation, rendering, and input layers.
