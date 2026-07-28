#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
APP_PATH=${1:-}

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "Error: the Buzz for Devin application signer supports macOS only." >&2
  exit 1
fi
if [[ -z "$APP_PATH" || ! -d "$APP_PATH" || "$APP_PATH" != *".app" ]]; then
  echo "Usage: $0 '/path/to/Buzz for Devin.app'" >&2
  exit 1
fi
if [[ -L "$APP_PATH" ]]; then
  echo "Error: application must be a bundle, not a symbolic link." >&2
  exit 1
fi
for required in codesign file; do
  if ! command -v "$required" >/dev/null 2>&1; then
    echo "Error: required signing tool '$required' is unavailable." >&2
    exit 1
  fi
done

"$SCRIPT_DIR/verify-buzz-for-devin-macos-app.sh" "$APP_PATH" >/dev/null

while IFS= read -r -d '' candidate; do
  if file "$candidate" | grep -q "Mach-O"; then
    codesign --force --sign - --timestamp=none "$candidate"
  fi
done < <(find "$APP_PATH/Contents" -type f -print0)

while IFS= read -r -d '' nested_bundle; do
  codesign --force --sign - --timestamp=none "$nested_bundle"
done < <(
  find "$APP_PATH/Contents" -depth -type d \
    \( -name '*.framework' -o -name '*.xpc' -o -name '*.app' \) -print0
)

codesign --force --sign - --timestamp=none "$APP_PATH"
codesign --verify --deep --strict "$APP_PATH"
"$SCRIPT_DIR/verify-buzz-for-devin-macos-app.sh" "$APP_PATH" >/dev/null

echo "Ad-hoc signed and verified Buzz for Devin application: $APP_PATH"
