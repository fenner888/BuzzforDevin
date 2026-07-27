#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "Error: the initial Buzz for Devin installer supports macOS only." >&2
  exit 1
fi

SOURCE_APP=${1:-}
if [[ -z "$SOURCE_APP" || ! -d "$SOURCE_APP" || "$SOURCE_APP" != *".app" ]]; then
  echo "Usage: $0 '/path/to/Buzz for Devin.app'" >&2
  exit 1
fi

INSTALL_ROOT=${BUZZ_FOR_DEVIN_INSTALL_ROOT:-"$HOME/Applications"}
DESTINATION="$INSTALL_ROOT/Buzz for Devin.app"
TIMESTAMP=$(date -u +%Y%m%dT%H%M%SZ)
BACKUP="$INSTALL_ROOT/Buzz for Devin.app.backup-$TIMESTAMP"

validate_app() {
  "$SCRIPT_DIR/verify-buzz-for-devin-macos-app.sh" "$1" >/dev/null
}

app_is_running() {
  local executable=$1
  local command
  local process_list
  if ! process_list=$(ps -axo command=); then
    echo "Error: could not inspect running processes; installation was not changed." >&2
    exit 1
  fi
  while IFS= read -r command; do
    if [[ "$command" == "$executable" || "$command" == "$executable "* ]]; then
      return 0
    fi
  done <<<"$process_list"
  return 1
}

if ! validate_app "$SOURCE_APP"; then
  echo "Error: source is not a complete Buzz for Devin application bundle." >&2
  exit 1
fi

mkdir -p "$INSTALL_ROOT"
if app_is_running "$DESTINATION/Contents/MacOS/buzz-desktop"; then
  echo "Error: quit the installed Buzz for Devin app before upgrading it." >&2
  exit 1
fi
if [[ -e "$BACKUP" ]]; then
  echo "Error: backup path already exists: $BACKUP" >&2
  exit 1
fi

STAGING_ROOT=$(mktemp -d "$INSTALL_ROOT/.buzz-for-devin-install.XXXXXX")
STAGED_APP="$STAGING_ROOT/Buzz for Devin.app"
cleanup_staging() {
  if [[ -n "${STAGING_ROOT:-}" && -d "$STAGING_ROOT" ]]; then
    rm -rf -- "$STAGING_ROOT"
  fi
}
trap cleanup_staging EXIT

ditto "$SOURCE_APP" "$STAGED_APP"
if ! validate_app "$STAGED_APP"; then
  echo "Error: staged application failed validation; the installed app was not changed." >&2
  exit 1
fi

if [[ -e "$DESTINATION" ]]; then
  mv "$DESTINATION" "$BACKUP"
  echo "Previous installation moved to: $BACKUP"
fi

if ! mv "$STAGED_APP" "$DESTINATION"; then
  if [[ -e "$BACKUP" && ! -e "$DESTINATION" ]]; then
    mv "$BACKUP" "$DESTINATION"
  fi
  echo "Error: installation failed; the previous app was restored when possible." >&2
  exit 1
fi

echo "Installed: $DESTINATION"
echo "Application data and Keychain entries were not modified."
