<!-- AUTO-GENERATED:backlink START -->
[← Back](dev.md)
<!-- AUTO-GENERATED:backlink END -->
# Implementation Order

Use this order for predictable delivery and risk reduction.

1. Create or update the Tauri 2 app foundation in `apps/tauritwoer-desktop`.
2. Define and migrate game configuration/data models.
3. Port core gameplay simulation logic into TypeScript modules.
4. Implement Canvas renderer on top of simulation state.
5. Integrate input/action handling and UI/HUD state wiring.
6. Add save/load and host integration via Tauri/Rust commands.
7. Finalize packaging, artifact copying, and release tooling.

## Definition of Done per Stage

- Stage output runs locally through `tools/control.py` entrypoints.
- Interfaces between simulation and presentation remain explicit.
- New behavior includes validation via tests or deterministic checks.

## Practical Rules

- Do not block logic migration on final visuals.
- Do not hardcode balancing data into renderer code.
- Keep host/platform code out of simulation modules.
