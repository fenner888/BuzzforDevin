#!/usr/bin/env bash
# Move an immutable Buzz for Devin source checkout to a newer release tag,
# rebuild it, and install it through the normal backup-preserving installer.
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
PUBLIC_REPOSITORY=https://github.com/fenner888/BuzzforDevin.git
TARGET_TAG=${1:-}

[[ "$(uname -s)" == "Darwin" ]] || die "This updater supports macOS only."
[[ "$(uname -m)" == "arm64" ]] || die "This updater currently requires Apple Silicon (arm64)."
[[ -n "$TARGET_TAG" ]] || die "Usage: $0 <buzz-for-devin-release-tag>"
[[ "$TARGET_TAG" == buzz-for-devin-v* ]] || die "'$TARGET_TAG' is not a Buzz for Devin release tag."

cd "$REPO_ROOT"
git diff --quiet HEAD || die "Checkout has tracked changes. Commit or restore them before updating."
git diff --cached --quiet HEAD || die "Checkout has staged changes. Commit or restore them before updating."

CURRENT_TAG=$(git describe --tags --exact-match 2>/dev/null || true)
[[ -n "$CURRENT_TAG" ]] || die "The current checkout is not at an exact release tag."
if [[ "$CURRENT_TAG" == "$TARGET_TAG" ]]; then
  log "Already at $TARGET_TAG. Use ./scripts/repair-macos-source.sh to rebuild it."
  exit 0
fi

ORIGINAL_COMMIT=$(git rev-parse HEAD)
ORIGINAL_BRANCH=$(git symbolic-ref --quiet --short HEAD 2>/dev/null || true)
ORIGINAL_REF=${ORIGINAL_BRANCH:-$ORIGINAL_COMMIT}

log "Fetching immutable release tags from the public repository..."
GIT_CONFIG_GLOBAL=/dev/null GIT_TERMINAL_PROMPT=0 \
  git fetch --tags "$PUBLIC_REPOSITORY"
git rev-parse --verify --quiet "refs/tags/$TARGET_TAG^{commit}" >/dev/null ||
  die "Release tag '$TARGET_TAG' was not found."
if [[ -n "$ORIGINAL_BRANCH" ]] &&
  ! git merge-base --is-ancestor "$ORIGINAL_COMMIT" "$TARGET_TAG"; then
  die "Release tag '$TARGET_TAG' cannot fast-forward the current branch '$ORIGINAL_BRANCH'."
fi

log "Updating from $CURRENT_TAG to $TARGET_TAG..."
git checkout --detach "$TARGET_TAG"
if ! "$SCRIPT_DIR/install-macos-source.sh"; then
  log "The new build failed; restoring the previous source checkout."
  git checkout "$ORIGINAL_REF" >/dev/null 2>&1 || true
  die "Update failed. The previously installed application was preserved or restored by the installer."
fi

if [[ -n "$ORIGINAL_BRANCH" ]]; then
  git checkout "$ORIGINAL_BRANCH"
  git merge --ff-only "$TARGET_TAG"
fi

log "Updated to $TARGET_TAG."
log "The installer kept any previous application as a timestamped rollback backup."
