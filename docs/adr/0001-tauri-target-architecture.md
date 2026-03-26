# ADR 0001: Tauri Target Architecture

- Status: Accepted
- Date: 2026-03-26

## Context

The current game implementation exists as a Python/Pygame prototype.
The project goal is a maintainable desktop product architecture, not continued runtime evolution of that prototype stack.

## Decision

TauriTwoer targets this architecture:

- Tauri 2 desktop container
- Vite + TypeScript frontend
- HTML5 Canvas rendering and UI loop
- Rust for native desktop concerns only (save/load, file access, packaging, host integration)

Runtime gameplay logic will be ported to TypeScript.
Pygame-specific runtime/render/input code is not carried into the target runtime.

## Porting Rules

- Port gameplay semantics, not line-by-line syntax.
- Re-implement rendering/input/UI natively in the Tauri frontend.
- Keep simulation/game state separate from rendering and input adapters.
- Prefer data-driven game content definitions where practical.

## Consequences

- Python remains useful for tooling and migration support, but not as runtime core.
- Team effort prioritizes deterministic game-logic migration and frontend runtime correctness.
- Architecture remains testable and extensible as rendering/UI evolve.

## Non-Goals

- Running the Python game inside Tauri as the primary product strategy.
- Sidecar-based Python runtime as default architecture.
