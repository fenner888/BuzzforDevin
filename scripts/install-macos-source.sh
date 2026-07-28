#!/usr/bin/env bash
# Build Buzz for Devin from an immutable source tag, ad-hoc sign it locally,
# and install the application bundle in the current user's Applications folder.
set -euo pipefail

log() {
  printf '[buzz-for-devin] %s\n' "$*" >&2
}

die() {
  printf '[buzz-for-devin] ERROR: %s\n' "$*" >&2
  exit 1
}

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)
INSTALL_ROOT=${BUZZ_FOR_DEVIN_INSTALL_ROOT:-"$HOME/Applications"}
LOG_FILE=${BUZZ_FOR_DEVIN_INSTALL_LOG:-"$HOME/buzz-for-devin-install.log"}
INSTALLED_APP="$INSTALL_ROOT/Buzz for Devin.app"

usage() {
  cat <<'EOF'
Usage: ./scripts/install-macos-source.sh

Build Buzz for Devin from the current immutable release tag, ad-hoc sign the
locally built bundle, install it to ~/Applications/Buzz for Devin.app, and
open the installed application.

This does not require an Apple Developer account, change Devin configuration,
or inspect or copy Devin credentials.
EOF
}

case "${1:-}" in
  "")
    ;;
  -h | --help)
    usage
    exit 0
    ;;
  *)
    echo "Error: unknown argument '$1'." >&2
    usage >&2
    exit 2
    ;;
esac

[[ "$(uname -s)" == "Darwin" ]] || die "This installer supports macOS only."
case "$(uname -m)" in
  arm64)
    TARGET=aarch64-apple-darwin
    EXPECTED_ARCH=arm64
    ;;
  x86_64)
    TARGET=x86_64-apple-darwin
    EXPECTED_ARCH=x86_64
    ;;
  *)
    die "This installer supports Apple Silicon (arm64) and Intel (x86_64) Macs only."
    ;;
esac
APP_PATH="$REPO_ROOT/desktop/src-tauri/target/$TARGET/release/bundle/macos/Buzz for Devin.app"

for required in git codesign file open xcode-select; do
  command -v "$required" >/dev/null 2>&1 || die "'$required' is required."
done

if ! xcode-select -p >/dev/null 2>&1; then
  die "Xcode Command Line Tools are required. Run 'xcode-select --install', finish installation, and try again."
fi

cd "$REPO_ROOT"
git diff --quiet HEAD || die "Checkout has tracked changes. Use a clean release tag."
git diff --cached --quiet HEAD || die "Checkout has staged changes. Use a clean release tag."
CURRENT_TAG=$(git describe --tags --exact-match 2>/dev/null || true)
[[ -n "$CURRENT_TAG" ]] || die "Checkout is not at an exact release tag."
[[ "$CURRENT_TAG" == buzz-for-devin-v* ]] || die "Tag '$CURRENT_TAG' is not a Buzz for Devin release tag."

FREE_SPACE_KB=$(df -Pk "$HOME" | awk 'NR==2 {print $4}')
[[ "$FREE_SPACE_KB" =~ ^[0-9]+$ ]] || die "Could not determine available disk space."
REQUIRED_SPACE_KB=$((15 * 1024 * 1024))
if ((FREE_SPACE_KB < REQUIRED_SPACE_KB)); then
  FREE_SPACE_GB=$((FREE_SPACE_KB / 1024 / 1024))
  die "At least 15 GB of free disk space is required; approximately ${FREE_SPACE_GB} GB is available."
fi

case ":${PATH:-}:" in
  *":$HOME/.local/bin:"*) ;;
  *) export PATH="$HOME/.local/bin:${PATH:-}" ;;
esac
if ! command -v devin >/dev/null 2>&1; then
  die "The official Devin CLI was not found. Install it from https://docs.devin.ai/cli and retry."
fi

[[ ! -L "$LOG_FILE" ]] || die "Refusing to write the install log through a symbolic link: $LOG_FILE"
: >"$LOG_FILE"
log "Building Buzz for Devin from tag: $CURRENT_TAG"
log "Build log: $LOG_FILE"
devin --version 2>&1 | tee -a "$LOG_FILE"
log "Buzz will check Devin authentication readiness during onboarding."

export BUZZ_FOR_DEVIN_EXPECTED_ARCH="$EXPECTED_ARCH"
"$SCRIPT_DIR/build-buzz-for-devin-macos.sh" "$TARGET" 2>&1 | tee -a "$LOG_FILE"
[[ -d "$APP_PATH" ]] || die "No application bundle was produced. Check $LOG_FILE."

log "Ad-hoc signing the locally built application..."
"$SCRIPT_DIR/sign-buzz-for-devin-macos-app.sh" "$APP_PATH" 2>&1 | tee -a "$LOG_FILE"

"$SCRIPT_DIR/install-buzz-for-devin-macos.sh" "$APP_PATH" 2>&1 | tee -a "$LOG_FILE"
codesign --verify --deep --strict "$INSTALLED_APP" 2>&1 | tee -a "$LOG_FILE"
"$SCRIPT_DIR/verify-buzz-for-devin-macos-app.sh" "$INSTALLED_APP" 2>&1 | tee -a "$LOG_FILE"

log ""
log "Buzz for Devin installed successfully."
log "Application: $INSTALLED_APP"
log "Opening Buzz for Devin..."
open "$INSTALLED_APP" || die "The application was installed but could not be opened. Launch it manually with: open \"$INSTALLED_APP\""
log "The first build can take 15-45 minutes depending on the Mac; later launches use the installed app."
log "No Devin configuration or credentials were modified."
