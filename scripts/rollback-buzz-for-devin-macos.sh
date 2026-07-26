#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "Error: the Buzz for Devin rollback tool supports macOS only." >&2
  exit 1
fi

BACKUP_APP=${1:-}
if [[ -z "$BACKUP_APP" || ! -d "$BACKUP_APP" || "$BACKUP_APP" != *".app.backup-"* ]]; then
  echo "Usage: $0 '/path/to/Buzz for Devin.app.backup-TIMESTAMP'" >&2
  exit 1
fi
if [[ -L "$BACKUP_APP" ]]; then
  echo "Error: rollback backup must be an application bundle, not a symbolic link." >&2
  exit 1
fi

INSTALL_ROOT=${BUZZ_FOR_DEVIN_INSTALL_ROOT:-"$HOME/Applications"}
DESTINATION="$INSTALL_ROOT/Buzz for Devin.app"
mkdir -p "$INSTALL_ROOT"
BACKUP_PARENT=$(cd "$(dirname "$BACKUP_APP")" && pwd)
EXPECTED_PARENT=$(cd "$INSTALL_ROOT" && pwd)
if [[ "$BACKUP_PARENT" != "$EXPECTED_PARENT" ]]; then
  echo "Error: backup must be inside $EXPECTED_PARENT." >&2
  exit 1
fi

if ! "$SCRIPT_DIR/verify-buzz-for-devin-macos-app.sh" \
  --allow-backup-name "$BACKUP_APP" >/dev/null; then
  echo "Error: rollback backup is not a complete Buzz for Devin application bundle." >&2
  exit 1
fi

app_is_running() {
  local executable=$1
  local command
  local process_list
  if ! process_list=$(ps -axo command=); then
    echo "Error: could not inspect running processes; rollback was not started." >&2
    exit 1
  fi
  while IFS= read -r command; do
    if [[ "$command" == "$executable" || "$command" == "$executable "* ]]; then
      return 0
    fi
  done <<<"$process_list"
  return 1
}

if app_is_running "$DESTINATION/Contents/MacOS/buzz-desktop"; then
  echo "Error: quit the installed Buzz for Devin app before rolling it back." >&2
  exit 1
fi

TIMESTAMP=$(date -u +%Y%m%dT%H%M%SZ)
DISPLACED="$INSTALL_ROOT/Buzz for Devin.app.replaced-$TIMESTAMP"
if [[ -e "$DISPLACED" ]]; then
  echo "Error: rollback displacement path already exists: $DISPLACED" >&2
  exit 1
fi
if [[ -e "$DESTINATION" ]]; then
  mv "$DESTINATION" "$DISPLACED"
  echo "Current installation moved to: $DISPLACED"
fi

if ! mv "$BACKUP_APP" "$DESTINATION"; then
  if [[ -e "$DISPLACED" && ! -e "$DESTINATION" ]]; then
    mv "$DISPLACED" "$DESTINATION"
  fi
  echo "Error: rollback failed; the current app was restored when possible." >&2
  exit 1
fi
echo "Restored: $DESTINATION"
echo "Application data and Keychain entries were not modified."
