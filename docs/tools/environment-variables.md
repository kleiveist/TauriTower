# Environment Variables

This reference covers variables used by scripts routed via `tools/control.py`.

## TauriTwoer-Scoped Variables

| Variable | Used By | Default | Meaning |
| --- | --- | --- | --- |
| `TAURITWOER_COPY_TARGETS` | `--build --copy` | unset | Comma-separated absolute destination roots for artifact copy. Required for copy flow. |
| `TAURITWOER_TEST_TIMEOUT_SECONDS` | `--test` | `90` | Full test-suite timeout before forced termination. |
| `TAURITWOER_TEST_FILE_TIMEOUT_SECONDS` | `--test` | `45` | Per-file timeout during isolation runs. |
| `TAURITWOER_TEST_ISOLATE_ON_TIMEOUT` | `--test` | `1` | Run per-file isolation when full suite times out. |
| `TAURITWOER_TEST_ISOLATE_ON_FAILURE` | `--test` | `1` | Run per-file isolation when full suite fails. |
| `TAURITWOER_TEST_ISOLATE_ONLY` | `--test` | `0` | Skip full suite and run only per-file isolation. |
| `TAURITWOER_PACMAN_NOCONFIRM` | Linux install (Arch) | `1` | Use `--noconfirm` for pacman operations. |
| `TAURITWOER_PACMAN_UPGRADE` | Linux install (Arch) | `1` | Perform full `pacman -Syu` before dependency install. |

## Build Variables (existing script behavior)

| Variable | Used By | Default | Meaning |
| --- | --- | --- | --- |
| `NO_STRIP` | `--build-lin` | `true` | Prevent stripping to avoid linuxdeploy strip issues. |
| `CLEAN_BUNDLE` | `--build-lin`, `--build-win`, `--build-mac` | `1` | Clean old bundle output before build. |
| `BUILD_VERBOSE` | platform build scripts | `1` | Toggle verbose build behavior in script output. |
| `WIN_BUNDLES` | `--build-win` | `nsis,msi` | Comma-separated bundle formats for Windows build. |
| `MAC_BUNDLES` | `--build-mac` | `app,dmg` | Comma-separated bundle formats for macOS build. |
| `ALLOW_CROSS` | `--build-win`, `--build-win -p`, `--build-mac` | `0` | Permit non-native host builds (may fail). |
| `CLEAN_PORTABLE` | portable/cross windows flows | `1` | Clean old portable output before packaging. |
| `WIN_LINUX_TARGET` | `--build --winlinux` | `x86_64-pc-windows-msvc` | Rust target triple for Linux cross-build. |
| `WIN_LINUX_RUNNER` | `--build --winlinux` | `cargo-xwin` | Runner passed to `tauri build`. |
| `WIN_LINUX_BUNDLES` | `--build --winlinux` | unset | If set, use bundle formats instead of `--no-bundle`. |
| `WIN_LINUX_ZIP` | `--build --winlinux` | enabled | Set `0` to skip portable zip creation. |

## Installer Variables

| Variable | Used By | Default | Meaning |
| --- | --- | --- | --- |
| `VSCODE_VARIANT` | `--vscode` (Arch) | `ms` | `ms` prefers Microsoft build via AUR helper; `oss` uses pacman `code`. |
| `WINGET_SOURCE` | Windows installer | `winget` | Winget source passed to package lookups/install. |
| `SKIP_MSVC_BUILDTOOLS` | Windows installer | unset | Set `1` to skip Visual Studio Build Tools auto-install. |

## Example

```bash
export TAURITWOER_COPY_TARGETS="/mnt/artifacts/release-a,/mnt/artifacts/release-b"
export TAURITWOER_TEST_TIMEOUT_SECONDS=120
python3 tools/control.py --test
python3 tools/control.py --build --copy
```
