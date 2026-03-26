# Tool Selection Guide

Use this decision table to choose the right `tools/control.py` command quickly.

## Decision Table

| You want to... | Run this | Why |
| --- | --- | --- |
| verify machine readiness | `python3 tools/control.py --doctor` | Fast, non-destructive readiness check |
| install missing toolchain deps | `python3 tools/control.py --install` | Uses OS-aware installer routing |
| set up Linux Tauri stack and scaffold app | `python3 tools/control.py --tauri` | Installs deps and creates `apps/tauritwoer-desktop` |
| start local desktop runtime | `python3 tools/control.py --start` | Standard dev runtime command |
| run automated tests | `python3 tools/control.py --test` | Includes timeout safeguards and isolation mode |
| build Linux release output | `python3 tools/control.py --build-lin` | Linux-focused release flow |
| build Windows installer bundles | `python3 tools/control.py --build-win` | Native Windows bundle flow |
| build Windows portable zip | `python3 tools/control.py --build-win -p` | Portable distribution without installer |
| build macOS bundles | `python3 tools/control.py --build-mac` | macOS bundle flow |
| cross-build Windows from Linux | `python3 tools/control.py --build --winlinux` | cargo-xwin based cross pipeline |
| sync artifacts to external storage | `python3 tools/control.py --build --copy` | Copies output to `TAURITWOER_COPY_TARGETS` |
| install latest local AppImage into desktop menu | `python3 tools/control.py --install-appimage` | Linux local app installation helper |

## Recommended Operational Order

1. `--doctor`
2. `--install` (if required)
3. `--tauri` (Linux bootstrap/scaffold)
4. `--start` and `--test`
5. build command for target platform
6. `--build --copy` when distribution mirrors are needed

## Dry-Run First Rule

For setup/build/copy operations, run with `--dry-run` first when validating new hosts or CI changes.
