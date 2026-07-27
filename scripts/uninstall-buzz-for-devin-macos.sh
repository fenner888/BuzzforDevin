#!/usr/bin/env bash
set -euo pipefail

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "Error: the Buzz for Devin uninstaller supports macOS only." >&2
  exit 1
fi

INSTALL_ROOT=${BUZZ_FOR_DEVIN_INSTALL_ROOT:-"$HOME/Applications"}
TRASH_ROOT=${BUZZ_FOR_DEVIN_TRASH_ROOT:-"$HOME/.Trash"}
SOURCE="$INSTALL_ROOT/Buzz for Devin.app"

if [[ ! -e "$SOURCE" ]]; then
  echo "Buzz for Devin is not installed at: $SOURCE"
  exit 0
fi

app_is_running() {
  local executable=$1
  local command
  local process_list
  if ! process_list=$(ps -axo command=); then
    echo "Error: could not inspect running processes; uninstall was not started." >&2
    exit 1
  fi
  while IFS= read -r command; do
    if [[ "$command" == "$executable" || "$command" == "$executable "* ]]; then
      return 0
    fi
  done <<<"$process_list"
  return 1
}

if app_is_running "$SOURCE/Contents/MacOS/buzz-desktop"; then
  echo "Error: quit Buzz for Devin before uninstalling it." >&2
  exit 1
fi

mkdir -p "$TRASH_ROOT"
TIMESTAMP=$(date -u +%Y%m%dT%H%M%SZ)
DESTINATION="$TRASH_ROOT/Buzz for Devin-$TIMESTAMP.app"
if [[ -e "$DESTINATION" ]]; then
  echo "Error: Trash destination already exists: $DESTINATION" >&2
  exit 1
fi
mv "$SOURCE" "$DESTINATION"

echo "Moved the app to: $DESTINATION"
echo "Application data and Keychain entries were preserved for recovery."
