# Control CLI Command Matrix

Canonical entrypoint:

```bash
python3 tools/control.py [flags]
```

## Global Behavior

- `--dry-run` prints planned actions without executing side effects where supported.
- Multiple flags can be combined; each selected action runs in sequence.

## Commands

| Command | Purpose | Typical Use | Platform |
| --- | --- | --- | --- |
| `--doctor` / `--check` | Validate required toolchain and libraries | First step on new machine or CI diagnostics | All |
| `--doctor --json` | Same checks with JSON payload | Automation or machine-readable checks | All |
| `--install` | Install missing dependencies via platform installer | Bootstrap missing prerequisites | OS-specific behavior |
| `--vscode` | Install VS Code on Linux | Standardize editor on Linux dev hosts | Linux |
| `--tauri` | Install Linux Tauri prerequisites and scaffold app | Initial Linux project setup | Linux |
| `--run` / `--start` | Start `pnpm tauri dev` | Daily local development | Primarily Linux |
| `--test` | Run test suite via Vitest with timeout protections | Pre-commit/CI/local validation | All (requires app dir) |
| `--build-lin` | Build Linux bundles | Release artifacts for Linux | Any host with compatible toolchain |
| `--build-win` | Build Windows installer bundles | Windows release build | Windows by default |
| `--build-win -p` | Build Windows portable zip flow | Portable distribution without installer | Windows by default |
| `--build-mac` | Build macOS bundles | macOS release build | macOS by default |
| `--build --winlinux` | Cross-build Windows from Linux using cargo-xwin | Linux-based Windows pipeline | Linux |
| `--build --copy` | Copy produced artifacts to configured targets | Post-build distribution sync | Any |
| `--install-appimage` / `--appimage` | Install local AppImage to `~/Applications` | Local Linux desktop integration | Linux |

## Build-Specific Notes

- `--build` alone prints helper information.
- `--winlinux` and `--copy` are only valid together with `--build`.
- For copy flow, set `TAURITWOER_COPY_TARGETS` first.

## Examples

```bash
python3 tools/control.py --doctor --json
python3 tools/control.py --tauri --dry-run
python3 tools/control.py --start
python3 tools/control.py --test --dry-run
python3 tools/control.py --build-lin --dry-run
python3 tools/control.py --build-win -p --dry-run
python3 tools/control.py --build --winlinux --dry-run
TAURITWOER_COPY_TARGETS="/abs/out1,/abs/out2" python3 tools/control.py --build --copy --dry-run
```
