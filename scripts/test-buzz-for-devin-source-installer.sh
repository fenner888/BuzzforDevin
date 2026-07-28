#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
TEST_ROOT=$(mktemp -d "${TMPDIR:-/tmp}/buzz-for-devin-source-installer.XXXXXX")
REPO_FIXTURE="$TEST_ROOT/repository"
FAKE_BIN="$TEST_ROOT/bin"
INSTALL_ROOT="$TEST_ROOT/Applications"
LOG_FILE="$TEST_ROOT/install.log"
CODESIGN_LOG="$TEST_ROOT/codesign.log"

cleanup() {
  if [[ -d "$TEST_ROOT" && "$TEST_ROOT" == "${TMPDIR:-/tmp}/buzz-for-devin-source-installer."* ]]; then
    rm -rf -- "$TEST_ROOT"
  fi
}
trap cleanup EXIT

mkdir -p "$REPO_FIXTURE/scripts" "$FAKE_BIN"
cp "$SCRIPT_DIR/install-macos-source.sh" "$REPO_FIXTURE/scripts/"

cat >"$REPO_FIXTURE/scripts/build-buzz-for-devin-macos.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
APP="$REPO_ROOT/desktop/src-tauri/target/aarch64-apple-darwin/release/bundle/macos/Buzz for Devin.app"
mkdir -p "$APP/Contents/MacOS"
touch "$APP/Contents/MacOS/fixture"
EOF

cat >"$REPO_FIXTURE/scripts/verify-buzz-for-devin-macos-app.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
[[ -d "$1" ]]
EOF

cat >"$REPO_FIXTURE/scripts/sign-buzz-for-devin-macos-app.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' "--force --sign - --timestamp=none $1" >>"$BUZZ_FOR_DEVIN_TEST_CODESIGN_LOG"
printf '%s\n' "--verify --deep --strict $1" >>"$BUZZ_FOR_DEVIN_TEST_CODESIGN_LOG"
EOF

cat >"$REPO_FIXTURE/scripts/install-buzz-for-devin-macos.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
DESTINATION="$BUZZ_FOR_DEVIN_INSTALL_ROOT/Buzz for Devin.app"
mkdir -p "$BUZZ_FOR_DEVIN_INSTALL_ROOT"
rm -rf -- "$DESTINATION"
cp -R "$1" "$DESTINATION"
EOF

cat >"$FAKE_BIN/codesign" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' "$*" >>"$BUZZ_FOR_DEVIN_TEST_CODESIGN_LOG"
EOF

cat >"$FAKE_BIN/devin" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
[[ "${1:-}" == "--version" ]]
echo "devin test-version"
EOF

cat >"$FAKE_BIN/df" <<'EOF'
#!/usr/bin/env bash
cat <<'OUTPUT'
Filesystem 1024-blocks Used Available Capacity Mounted on
fixture 100000000 1 50000000 1% /
OUTPUT
EOF

cat >"$FAKE_BIN/file" <<'EOF'
#!/usr/bin/env bash
echo "$1: data"
EOF

cat >"$FAKE_BIN/xcode-select" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
[[ "${1:-}" == "-p" ]]
echo "/Library/Developer/CommandLineTools"
EOF

chmod +x "$REPO_FIXTURE/scripts/"*.sh "$FAKE_BIN/"*

(
  cd "$REPO_FIXTURE"
  git init -q
  git config user.name "Buzz for Devin test"
  git config user.email "test@example.invalid"
  touch release-fixture
  git add .
  git commit -qm "test fixture"
  git tag buzz-for-devin-v0.0.0-test
)

(
  cd "$REPO_FIXTURE"
  PATH="$FAKE_BIN:$PATH" \
    BUZZ_FOR_DEVIN_INSTALL_ROOT="$INSTALL_ROOT" \
    BUZZ_FOR_DEVIN_INSTALL_LOG="$LOG_FILE" \
    BUZZ_FOR_DEVIN_TEST_CODESIGN_LOG="$CODESIGN_LOG" \
    ./scripts/install-macos-source.sh
)

[[ -f "$INSTALL_ROOT/Buzz for Devin.app/Contents/MacOS/fixture" ]]
grep -F -- "--force --sign - --timestamp=none" "$CODESIGN_LOG" >/dev/null
grep -F -- "--verify --deep --strict" "$CODESIGN_LOG" >/dev/null
grep -F "devin test-version" "$LOG_FILE" >/dev/null

(
  cd "$REPO_FIXTURE"
  git tag -d buzz-for-devin-v0.0.0-test >/dev/null
  if PATH="$FAKE_BIN:$PATH" \
    BUZZ_FOR_DEVIN_INSTALL_ROOT="$INSTALL_ROOT" \
    BUZZ_FOR_DEVIN_INSTALL_LOG="$LOG_FILE" \
    BUZZ_FOR_DEVIN_TEST_CODESIGN_LOG="$CODESIGN_LOG" \
    ./scripts/install-macos-source.sh >"$TEST_ROOT/untagged.out" 2>&1; then
    echo "Error: source installer accepted a checkout without an exact release tag." >&2
    exit 1
  fi
)
grep -F "not at an exact release tag" "$TEST_ROOT/untagged.out" >/dev/null

echo "Buzz for Devin source-installer contract test passed."
echo "No real application, Keychain, Devin configuration, or credentials were used."
