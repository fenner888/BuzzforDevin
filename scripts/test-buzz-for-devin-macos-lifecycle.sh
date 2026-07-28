#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "Error: the Buzz for Devin lifecycle test supports macOS only." >&2
  exit 1
fi

case "$(uname -m)" in
  arm64) TARGET=aarch64-apple-darwin ;;
  x86_64) TARGET=x86_64-apple-darwin ;;
  *)
    echo "Error: unsupported macOS architecture '$(uname -m)'." >&2
    exit 1
    ;;
esac

SOURCE_APP=${1:-"$REPO_ROOT/desktop/src-tauri/target/$TARGET/release/bundle/macos/Buzz for Devin.app"}
if [[ ! -d "$SOURCE_APP" ]]; then
  echo "Usage: $0 '/path/to/Buzz for Devin.app'" >&2
  exit 1
fi

TEST_ROOT=$(mktemp -d "${TMPDIR:-/tmp}/buzz-for-devin-lifecycle.XXXXXX")
INSTALL_ROOT="$TEST_ROOT/Applications"
TRASH_ROOT="$TEST_ROOT/Trash"
SIGNED_TRASH_ROOT="$TEST_ROOT/Signed Trash"
FIXTURES_ROOT="$TEST_ROOT/fixtures"
RUNNING_SENTINEL_PID=""

cleanup() {
  if [[ -n "$RUNNING_SENTINEL_PID" ]]; then
    kill "$RUNNING_SENTINEL_PID" >/dev/null 2>&1 || true
    wait "$RUNNING_SENTINEL_PID" 2>/dev/null || true
  fi
  if [[ -d "$TEST_ROOT" && "$TEST_ROOT" == "${TMPDIR:-/tmp}/buzz-for-devin-lifecycle."* ]]; then
    rm -rf -- "$TEST_ROOT"
  fi
}
trap cleanup EXIT

mkdir -p "$INSTALL_ROOT" "$TRASH_ROOT" "$SIGNED_TRASH_ROOT" "$FIXTURES_ROOT"
V1_APP="$FIXTURES_ROOT/Buzz for Devin v1.app"
V2_APP="$FIXTURES_ROOT/Buzz for Devin v2.app"
INVALID_APP="$FIXTURES_ROOT/Buzz for Devin invalid.app"

ditto "$SOURCE_APP" "$V1_APP"
ditto "$SOURCE_APP" "$V2_APP"
ditto "$SOURCE_APP" "$INVALID_APP"
touch "$V1_APP/Contents/lifecycle-v1"
touch "$V2_APP/Contents/lifecycle-v2"
chmod -x "$INVALID_APP/Contents/MacOS/buzz-acp"

run_installer() {
  BUZZ_FOR_DEVIN_INSTALL_ROOT="$INSTALL_ROOT" \
    "$REPO_ROOT/scripts/install-buzz-for-devin-macos.sh" "$1"
}

run_rollback() {
  BUZZ_FOR_DEVIN_INSTALL_ROOT="$INSTALL_ROOT" \
    "$REPO_ROOT/scripts/rollback-buzz-for-devin-macos.sh" "$1"
}

run_uninstaller() {
  BUZZ_FOR_DEVIN_INSTALL_ROOT="$INSTALL_ROOT" \
    BUZZ_FOR_DEVIN_TRASH_ROOT="${1:-$TRASH_ROOT}" \
    "$REPO_ROOT/scripts/uninstall-buzz-for-devin-macos.sh"
}

# When the input is signed, prove that the low-level installer and recoverable
# uninstaller preserve that signature before creating deliberately modified
# lifecycle fixtures below.
if codesign --verify --deep --strict "$SOURCE_APP" >/dev/null 2>&1; then
  run_installer "$SOURCE_APP"
  codesign --verify --deep --strict \
    "$INSTALL_ROOT/Buzz for Devin.app"
  run_uninstaller "$SIGNED_TRASH_ROOT"
  SIGNED_TRASHED=("$SIGNED_TRASH_ROOT"/Buzz\ for\ Devin-*.app)
  [[ ${#SIGNED_TRASHED[@]} -eq 1 && -d "${SIGNED_TRASHED[0]}" ]]
  codesign --verify --deep --strict "${SIGNED_TRASHED[0]}"
fi

# A malformed source must be rejected before an installed app can be changed.
if run_installer "$INVALID_APP" >/dev/null 2>&1; then
  echo "Error: installer accepted a bundle with a non-executable sidecar." >&2
  exit 1
fi
[[ ! -e "$INSTALL_ROOT/Buzz for Devin.app" ]]

run_installer "$V1_APP"
[[ -f "$INSTALL_ROOT/Buzz for Devin.app/Contents/lifecycle-v1" ]]

# Upgrades must fail closed while the installed app's executable is represented
# by a live process. The sentinel's argv[0] is the exact installed executable
# path, but it runs only `sleep`; the application bundle is never launched.
/bin/bash -c 'exec -a "$1" sleep 30' \
  _ "$INSTALL_ROOT/Buzz for Devin.app/Contents/MacOS/buzz-desktop" &
RUNNING_SENTINEL_PID=$!
sleep 0.1
if run_installer "$V2_APP" >/dev/null 2>&1; then
  echo "Error: installer upgraded while the installed app was running." >&2
  exit 1
fi
[[ -f "$INSTALL_ROOT/Buzz for Devin.app/Contents/lifecycle-v1" ]]
kill "$RUNNING_SENTINEL_PID" >/dev/null 2>&1 || true
wait "$RUNNING_SENTINEL_PID" 2>/dev/null || true
RUNNING_SENTINEL_PID=""

run_installer "$V2_APP"
[[ -f "$INSTALL_ROOT/Buzz for Devin.app/Contents/lifecycle-v2" ]]
BACKUPS=("$INSTALL_ROOT"/Buzz\ for\ Devin.app.backup-*)
[[ ${#BACKUPS[@]} -eq 1 && -d "${BACKUPS[0]}" ]]
[[ -f "${BACKUPS[0]}/Contents/lifecycle-v1" ]]

# A malformed rollback candidate must be rejected before the current
# installation is displaced.
INVALID_BACKUP="$INSTALL_ROOT/Buzz for Devin.app.backup-invalid"
ditto "$INVALID_APP" "$INVALID_BACKUP"
if run_rollback "$INVALID_BACKUP" >/dev/null 2>&1; then
  echo "Error: rollback accepted a backup with a non-executable sidecar." >&2
  exit 1
fi
[[ -f "$INSTALL_ROOT/Buzz for Devin.app/Contents/lifecycle-v2" ]]
rm -rf -- "$INVALID_BACKUP"

run_rollback "${BACKUPS[0]}"
[[ -f "$INSTALL_ROOT/Buzz for Devin.app/Contents/lifecycle-v1" ]]
REPLACED=("$INSTALL_ROOT"/Buzz\ for\ Devin.app.replaced-*)
[[ ${#REPLACED[@]} -eq 1 && -d "${REPLACED[0]}" ]]
[[ -f "${REPLACED[0]}/Contents/lifecycle-v2" ]]

run_uninstaller
[[ ! -e "$INSTALL_ROOT/Buzz for Devin.app" ]]
TRASHED=("$TRASH_ROOT"/Buzz\ for\ Devin-*.app)
[[ ${#TRASHED[@]} -eq 1 && -d "${TRASHED[0]}" ]]
[[ -f "${TRASHED[0]}/Contents/lifecycle-v1" ]]

echo "Buzz for Devin macOS lifecycle test passed."
echo "Temporary Applications, Trash, fixtures, app data, and Keychain were not retained."
