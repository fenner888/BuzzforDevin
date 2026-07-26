#!/usr/bin/env bash
set -euo pipefail

ALLOW_BACKUP_NAME=false
if [[ "${1:-}" == "--allow-backup-name" ]]; then
  ALLOW_BACKUP_NAME=true
  shift
fi
APP_PATH=${1:-}
if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "Error: the Buzz for Devin application verifier supports macOS only." >&2
  exit 1
fi
if [[ -z "$APP_PATH" || ! -d "$APP_PATH" ]]; then
  echo "Usage: $0 [--allow-backup-name] '/path/to/Buzz for Devin.app'" >&2
  exit 1
fi
if [[ "$ALLOW_BACKUP_NAME" == true ]]; then
  if [[ "$APP_PATH" != *".app" && "$APP_PATH" != *".app.backup-"* ]]; then
    echo "Error: application path must end in .app or .app.backup-TIMESTAMP." >&2
    exit 1
  fi
elif [[ "$APP_PATH" != *".app" ]]; then
  echo "Error: application path must end in .app." >&2
  exit 1
fi

PLIST="$APP_PATH/Contents/Info.plist"
if [[ ! -f "$PLIST" ]] || ! plutil -lint "$PLIST" >/dev/null; then
  echo "Error: application has no valid Info.plist." >&2
  exit 1
fi

read_plist() {
  /usr/libexec/PlistBuddy -c "Print :$1" "$PLIST" 2>/dev/null
}

require_plist_value() {
  local key=$1
  local expected=$2
  local actual
  actual=$(read_plist "$key") || {
    echo "Error: application plist is missing $key." >&2
    exit 1
  }
  if [[ "$actual" != "$expected" ]]; then
    echo "Error: application plist $key is '$actual'; expected '$expected'." >&2
    exit 1
  fi
}

require_plist_value "CFBundleDisplayName" "Buzz for Devin"
require_plist_value "CFBundleName" "Buzz for Devin"
require_plist_value "CFBundleIdentifier" "community.buzzfordevin.desktop"
require_plist_value "CFBundleExecutable" "buzz-desktop"
require_plist_value "CFBundlePackageType" "APPL"
require_plist_value "CFBundleURLTypes:0:CFBundleURLSchemes:0" "buzz-for-devin"
require_plist_value "LSMinimumSystemVersion" "11.0"

SHORT_VERSION=$(read_plist "CFBundleShortVersionString") || {
  echo "Error: application plist is missing CFBundleShortVersionString." >&2
  exit 1
}
if ! [[ "$SHORT_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$ ]]; then
  echo "Error: application version '$SHORT_VERSION' is not semver." >&2
  exit 1
fi
require_plist_value "CFBundleVersion" "$SHORT_VERSION"

for binary in buzz-acp buzz-agent buzz-dev-mcp git-credential-nostr buzz buzz-desktop; do
  binary_path="$APP_PATH/Contents/MacOS/$binary"
  if [[ ! -f "$binary_path" || ! -x "$binary_path" ]]; then
    echo "Error: application is missing executable Contents/MacOS/$binary." >&2
    exit 1
  fi
  if [[ "$(lipo -archs "$binary_path")" != "arm64" ]]; then
    echo "Error: Contents/MacOS/$binary is not an Apple Silicon-only executable." >&2
    exit 1
  fi
done

DESKTOP_BINARY="$APP_PATH/Contents/MacOS/buzz-desktop"
MINIMUM_OS=$(
  otool -l "$DESKTOP_BINARY" |
    awk '/cmd LC_BUILD_VERSION/{found=1; next} found && /minos/{print $2; exit}'
)
if [[ "$MINIMUM_OS" != "11.0" ]]; then
  echo "Error: desktop binary minimum macOS is '$MINIMUM_OS'; expected '11.0'." >&2
  exit 1
fi

for marker in ".buzz-for-devin" "buzz-for-devin-desktop"; do
  if ! strings "$DESKTOP_BINARY" | grep -F "$marker" >/dev/null; then
    echo "Error: desktop binary is missing isolated build marker '$marker'." >&2
    exit 1
  fi
done

echo "Verified Buzz for Devin macOS application: $APP_PATH"
