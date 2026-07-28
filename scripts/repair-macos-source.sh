#!/usr/bin/env bash
# Rebuild and reinstall the current immutable Buzz for Devin release tag.
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
TARGET=aarch64-apple-darwin

[[ "$(uname -s)" == "Darwin" ]] || die "This repair command supports macOS only."
[[ "$(uname -m)" == "arm64" ]] || die "This repair command currently requires Apple Silicon (arm64)."

cd "$REPO_ROOT"
git diff --quiet HEAD || die "Checkout has tracked changes. Use a clean release tag."
git diff --cached --quiet HEAD || die "Checkout has staged changes. Use a clean release tag."
CURRENT_TAG=$(git describe --tags --exact-match 2>/dev/null || true)
[[ -n "$CURRENT_TAG" ]] || die "Checkout is not at an exact release tag."
[[ "$CURRENT_TAG" == buzz-for-devin-v* ]] || die "Tag '$CURRENT_TAG' is not a Buzz for Devin release tag."

# Hermit supplies the exact Rust toolchain pinned by this checkout.
# shellcheck disable=SC1091
. "$REPO_ROOT/bin/activate-hermit"

log "Cleaning build artifacts for $CURRENT_TAG..."
cargo clean --target "$TARGET"
cargo clean --manifest-path "$REPO_ROOT/desktop/src-tauri/Cargo.toml" --target "$TARGET"

log "Rebuilding and reinstalling $CURRENT_TAG..."
exec "$SCRIPT_DIR/install-macos-source.sh"
