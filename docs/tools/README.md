<!-- AUTO-GENERATED:backlink START -->
[← Back](tools.md)
<!-- AUTO-GENERATED:backlink END -->
# Tooling Overview

TauriTwoer operational scripts are organized under `tools/` and orchestrated through `tools/control.py`.

## Principle

- Use `python3 tools/control.py ...` as the primary operator interface.
- Run sub-scripts directly only for debugging or targeted development.

## Structure

- `tools/control.py`: central command router
- `tools/inst/doctor.py`: environment checks
- `tools/inst/linux/*`, `tools/inst/mac/*`, `tools/inst/win/*`: platform installers
- `tools/inst/run.py`: local dev runtime launcher
- `tools/inst/run_test.py`: test orchestration with timeout isolation
- `tools/inst/build/*`: build and artifact operations
- `tools/fixes/*`: focused repair scripts

## Core Entry Commands

- `python3 tools/control.py --doctor`
- `python3 tools/control.py --install`
- `python3 tools/control.py --tauri`
- `python3 tools/control.py --start`
- `python3 tools/control.py --test`
- `python3 tools/control.py --build-lin`
- `python3 tools/control.py --build-win`
- `python3 tools/control.py --build-win -p`
- `python3 tools/control.py --build-mac`
- `python3 tools/control.py --build --winlinux`
- `python3 tools/control.py --build --copy`
- `python3 tools/control.py --install-appimage`

## Related Docs

- [Control CLI Command Matrix](control-cli.md)
- [Environment Variables](environment-variables.md)
- [Tool Selection Guide](tool-selection.md)
