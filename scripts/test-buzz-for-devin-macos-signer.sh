#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
TEST_ROOT=$(mktemp -d "${TMPDIR:-/tmp}/buzz-for-devin-signer.XXXXXX")
TEST_SCRIPTS="$TEST_ROOT/scripts"
FAKE_BIN="$TEST_ROOT/bin"
APP_PATH="$TEST_ROOT/Buzz for Devin.app"
CODESIGN_LOG="$TEST_ROOT/codesign.log"

cleanup() {
  if [[ -d "$TEST_ROOT" && "$TEST_ROOT" == "${TMPDIR:-/tmp}/buzz-for-devin-signer."* ]]; then
    rm -rf -- "$TEST_ROOT"
  fi
}
trap cleanup EXIT

mkdir -p "$TEST_SCRIPTS" "$FAKE_BIN" "$APP_PATH/Contents/MacOS"
cp "$SCRIPT_DIR/sign-buzz-for-devin-macos-app.sh" "$TEST_SCRIPTS/"
for binary in buzz buzz-acp buzz-agent buzz-desktop buzz-dev-mcp git-credential-nostr; do
  touch "$APP_PATH/Contents/MacOS/$binary"
  chmod 755 "$APP_PATH/Contents/MacOS/$binary"
done

cat >"$TEST_SCRIPTS/verify-buzz-for-devin-macos-app.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
[[ -d "${1:-}" ]]
EOF

cat >"$FAKE_BIN/file" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
echo "${1:-}: Mach-O 64-bit executable"
EOF

cat >"$FAKE_BIN/codesign" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
LAST_ARGUMENT=""
for ARGUMENT in "$@"; do
  LAST_ARGUMENT=$ARGUMENT
done
if [[ "$LAST_ARGUMENT" == *"/Contents/MacOS/buzz-desktop" ]]; then
  echo "Error: signer attempted to sign the main executable before its nested sidecars." >&2
  exit 1
fi
printf '%s\n' "$*" >>"$BUZZ_FOR_DEVIN_TEST_CODESIGN_LOG"
EOF

chmod +x "$TEST_SCRIPTS/"*.sh "$FAKE_BIN/"*

PATH="$FAKE_BIN:$PATH" \
  BUZZ_FOR_DEVIN_TEST_CODESIGN_LOG="$CODESIGN_LOG" \
  "$TEST_SCRIPTS/sign-buzz-for-devin-macos-app.sh" "$APP_PATH"

for binary in buzz buzz-acp buzz-agent buzz-dev-mcp git-credential-nostr; do
  grep -F -- "--force --sign - --timestamp=none $APP_PATH/Contents/MacOS/$binary" \
    "$CODESIGN_LOG" >/dev/null
done
if grep -F -- "--force --sign - --timestamp=none $APP_PATH/Contents/MacOS/buzz-desktop" \
  "$CODESIGN_LOG" >/dev/null; then
  echo "Error: the main executable was signed directly instead of through its app bundle." >&2
  exit 1
fi
grep -F -- "--force --sign - --timestamp=none $APP_PATH" "$CODESIGN_LOG" >/dev/null
grep -F -- "--verify --deep --strict $APP_PATH" "$CODESIGN_LOG" >/dev/null

echo "Buzz for Devin macOS signer-order contract test passed."
