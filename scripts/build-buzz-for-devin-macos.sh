#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)
. "$REPO_ROOT/bin/activate-hermit"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "Error: the Buzz for Devin source build supports macOS only." >&2
  exit 1
fi

TARGET=${1:-aarch64-apple-darwin}
if [[ "$TARGET" != "aarch64-apple-darwin" ]]; then
  echo "Error: the source-install target must be aarch64-apple-darwin, got '$TARGET'." >&2
  exit 1
fi

# Cognition's installer uses this location. Include it explicitly because a
# freshly installed CLI may not be visible to the invoking shell yet.
case ":${PATH:-}:" in
  *":$HOME/.local/bin:"*) ;;
  *) export PATH="$HOME/.local/bin:${PATH:-}" ;;
esac

# Cargo's internal Git transport can ignore a session-only Git configuration
# override. Use the installed Git CLI and, unless the caller already supplied an
# explicit override, ignore global URL rewrites while fetching public
# dependencies. This never changes the user's Git configuration.
export CARGO_NET_GIT_FETCH_WITH_CLI="${CARGO_NET_GIT_FETCH_WITH_CLI:-true}"
export GIT_CONFIG_GLOBAL="${GIT_CONFIG_GLOBAL:-/dev/null}"

PNPM_COMMAND=(pnpm)
if ! pnpm --version >/dev/null 2>&1; then
  if command -v corepack >/dev/null 2>&1 && \
    (cd "$REPO_ROOT" && corepack pnpm --version >/dev/null 2>&1); then
    PNPM_COMMAND=(corepack pnpm)
    echo "Hermit pnpm is unavailable on this host; using the pinned Corepack pnpm."
  else
    echo "Error: pinned pnpm is unavailable through both Hermit and Corepack." >&2
    exit 1
  fi
fi

export BUZZ_BUILD_KEYRING_SERVICE="buzz-for-devin-desktop"
export BUZZ_BUILD_DEEP_LINK_SCHEME="buzz-for-devin"
export BUZZ_BUILD_NEST_DIR=".buzz-for-devin"
export BUZZ_BUILD_CLI_LINK_NAME="buzz-for-devin"
export VITE_BUZZ_APP_NAME="Buzz for Devin"
export VITE_BUZZ_DEEP_LINK_SCHEME="buzz-for-devin"
export VITE_BUZZ_RELEASES_URL="https://github.com/fenner888/BuzzforDevin/releases"
export VITE_BUZZ_RELEASES_API_URL="https://api.github.com/repos/fenner888/BuzzforDevin/releases?per_page=10"
export MACOSX_DEPLOYMENT_TARGET="11.0"
export CMAKE_OSX_DEPLOYMENT_TARGET="11.0"
export CMAKE_POLICY_VERSION_MINIMUM="3.5"
unset BUZZ_UPDATER_PUBLIC_KEY BUZZ_UPDATER_ENDPOINT
unset TAURI_SIGNING_PRIVATE_KEY TAURI_SIGNING_PRIVATE_KEY_PASSWORD

cd "$REPO_ROOT"
"${PNPM_COMMAND[@]}" install --frozen-lockfile
cargo build --release --target "$TARGET" \
  -p buzz-acp \
  -p buzz-agent \
  -p buzz-dev-mcp \
  -p git-credential-nostr \
  -p buzz-cli
./scripts/bundle-sidecars.sh "$TARGET"
for bin in buzz-acp buzz-agent buzz-dev-mcp git-credential-nostr buzz; do
  test -x "desktop/src-tauri/binaries/${bin}-${TARGET}"
done

cd "$REPO_ROOT/desktop"
node scripts/build-buzz-for-devin-config.mjs
"${PNPM_COMMAND[@]}" exec tauri build \
  --verbose \
  --no-sign \
  --target "$TARGET" \
  --bundles app \
  --config src-tauri/tauri.buzz-for-devin.conf.json

BUNDLE_ROOT="$REPO_ROOT/desktop/src-tauri/target/$TARGET/release/bundle"
APP_PATH="$BUNDLE_ROOT/macos/Buzz for Devin.app"
"$REPO_ROOT/scripts/verify-buzz-for-devin-macos-app.sh" "$APP_PATH"

echo "Unsigned source-build artifacts:"
echo "$APP_PATH"
