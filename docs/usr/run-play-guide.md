# Run and Play Guide

This guide is for running TauriTwoer as a user or tester.

## Option A: Run Development Build

If you have a dev environment and source checkout:

```bash
python3 tools/control.py --start
```

The game window is started via Tauri dev runtime.
Stop with `Ctrl+C` in the terminal.

## Option B: Run Installed Linux AppImage

If a local AppImage was built and installed:

```bash
python3 tools/control.py --install-appimage
```

This installs/updates:

- `~/Applications/TauriTwoer.AppImage`
- desktop entry in `~/.local/share/applications/tauritwoer.desktop`

Then launch from your desktop menu or run the AppImage directly.

## Basic Troubleshooting

- App does not start: run `python3 tools/control.py --doctor`.
- Missing dependencies in dev mode: run `python3 tools/control.py --install`.
- Linux headless session: install/use `xvfb-run` and rerun with tooling guidance.

## Notes

- Gameplay prototype source is kept in `prototype/` as reference material only.
- Runtime target is the Tauri desktop app in `apps/tauritwoer-desktop`.
