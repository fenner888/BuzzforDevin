#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)

usage() {
  cat <<'EOF'
Usage: ./scripts/run-buzz-for-devin-source.sh [--prepare-only]

Build the Buzz agent sidecars from this checkout and run the desktop app from
source. The app connects to a community selected during onboarding; it does not
start a relay or Docker services.

Options:
  --prepare-only  Build sidecars and generate the isolated Tauri config, then exit.
  -h, --help      Show this help.
EOF
}

MODE=run
case "${1:-}" in
  "")
    ;;
  --prepare-only)
    MODE=prepare
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

HOST_OS=$(uname -s)
case "$HOST_OS" in
  Darwin | Linux)
    # Hermit supplies the repository-pinned Rust, Node, and pnpm toolchains.
    # shellcheck disable=SC1091
    . "$REPO_ROOT/bin/activate-hermit"

    # Cognition's installer places Devin at ~/.local/bin/devin. A freshly
    # installed CLI can exist there before the user's current shell has picked
    # up the PATH change, so make the official location available explicitly.
    case ":${PATH:-}:" in
      *":$HOME/.local/bin:"*) ;;
      *) export PATH="$HOME/.local/bin:${PATH:-}" ;;
    esac
    ;;
  MINGW64_NT* | MINGW32_NT* | MSYS_NT* | CYGWIN*)
    # Hermit's bootstrapper is macOS/Linux-only. Windows builders bring the
    # pinned-compatible tools documented in docs/buzz-for-devin-builders.md.
    ;;
  *)
    echo "Error: unsupported source-preview host: $HOST_OS." >&2
    exit 1
    ;;
esac

for required in cargo node pnpm rustc; do
  if ! command -v "$required" >/dev/null 2>&1; then
    echo "Error: required build tool '$required' is not on PATH." >&2
    echo "See docs/buzz-for-devin-builders.md for host prerequisites." >&2
    exit 1
  fi
done

TARGET=$(rustc -vV | sed -n 's|host: ||p')
case "$TARGET" in
  aarch64-apple-darwin | x86_64-apple-darwin | \
    x86_64-unknown-linux-gnu | aarch64-unknown-linux-gnu | \
    x86_64-pc-windows-msvc)
    ;;
  *)
    echo "Error: unsupported Rust host target '$TARGET'." >&2
    exit 1
    ;;
esac

export BUZZ_BUILD_KEYRING_SERVICE="buzz-for-devin-desktop"
export BUZZ_BUILD_DEEP_LINK_SCHEME="buzz-for-devin"
export BUZZ_BUILD_NEST_DIR=".buzz-for-devin"
export BUZZ_BUILD_CLI_LINK_NAME="buzz-for-devin"
export VITE_BUZZ_APP_NAME="Buzz for Devin"
export VITE_BUZZ_DEEP_LINK_SCHEME="buzz-for-devin"
export VITE_BUZZ_RELEASES_URL="https://github.com/fenner888/BuzzforDevin/releases"
export VITE_BUZZ_RELEASES_API_URL="https://api.github.com/repos/fenner888/BuzzforDevin/releases?per_page=10"
export CMAKE_POLICY_VERSION_MINIMUM="3.5"
unset BUZZ_UPDATER_PUBLIC_KEY BUZZ_UPDATER_ENDPOINT
unset TAURI_SIGNING_PRIVATE_KEY TAURI_SIGNING_PRIVATE_KEY_PASSWORD

if command -v devin >/dev/null 2>&1; then
  devin --version
  echo "Buzz will check Devin authentication readiness during onboarding."
else
  echo "Devin CLI not found; Buzz will show installation guidance from https://docs.devin.ai/cli."
fi

cd "$REPO_ROOT"
pnpm install --frozen-lockfile
cargo build --release --target "$TARGET" \
  -p buzz-acp \
  -p buzz-agent \
  -p buzz-dev-mcp \
  -p git-credential-nostr \
  -p buzz-cli
./scripts/bundle-sidecars.sh "$TARGET"

EXE=""
if [[ "$TARGET" == *windows* ]]; then
  EXE=".exe"
fi
for bin in buzz-acp buzz-agent buzz-dev-mcp git-credential-nostr buzz; do
  test -f "desktop/src-tauri/binaries/${bin}-${TARGET}${EXE}"
done

cd "$REPO_ROOT/desktop"
node scripts/build-buzz-for-devin-config.mjs

if [[ "$MODE" == "prepare" ]]; then
  echo "Buzz for Devin source preview prepared for $TARGET."
  exit 0
fi

# A source preview uses Buzz's debug-only keyring and Nest namespaces. Never
# inherit a private Buzz identity from the invoking shell.
unset BUZZ_PRIVATE_KEY BUZZ_SHARE_IDENTITY

echo "Starting Buzz for Devin source preview for $TARGET."
echo "Select or join a community during onboarding."
pnpm exec tauri dev --config src-tauri/tauri.buzz-for-devin.conf.json
