# Buzz for Devin on macOS

Buzz for Devin's first distribution target is Apple Silicon running macOS 11.0
or newer. The fork uses an isolated application identity:

- Product name: `Buzz for Devin`
- Bundle identifier and application-support directory:
  `community.buzzfordevin.desktop`
- Deep-link scheme: `buzz-for-devin://`
- Keychain service: `buzz-for-devin-desktop`
- Agent Nest and Repos Directory mapping: `~/.buzz-for-devin`
- Bundled CLI convenience link: `~/.local/bin/buzz-for-devin`

These values keep the community build separate from upstream Buzz. Installing
or removing Buzz for Devin does not modify the official Devin CLI, Devin
configuration, Cognition credentials, upstream Buzz data or Nest, upstream
Buzz's `~/.local/bin/buzz` link, or upstream Buzz Keychain entries.

If the relay-hosted web client is built for the community fork, configure it
with:

```sh
VITE_BUZZ_APP_NAME="Buzz for Devin"
VITE_BUZZ_DEEP_LINK_SCHEME="buzz-for-devin"
VITE_BUZZ_RELEASES_URL="https://github.com/fenner888/BuzzforDevin/releases"
VITE_BUZZ_RELEASES_API_URL="https://api.github.com/repos/fenner888/BuzzforDevin/releases?per_page=10"
```

The defaults remain upstream Buzz values. A public fork deployment must set all
four values so invite and repository pages open Buzz for Devin and never send a
user to an upstream Buzz download by mistake.

## Build from source

Activate Hermit and run:

```sh
. ./bin/activate-hermit
./scripts/build-buzz-for-devin-macos.sh
```

The script builds the pinned repository dependencies, all required Buzz
sidecars, and an unsigned `.app`. It does not sign, notarize, publish, launch,
or install anything. The public release pipeline will produce the distributable
DMG after signing and notarization are configured.

An unsigned source build is for development validation. A public beta must use
an immutable source tag and a separately configured signing, notarization, and
updater pipeline owned by the community fork.

Rehearse the complete lifecycle in a temporary directory without launching the
app or touching real application data and Keychain entries:

```sh
./scripts/test-buzz-for-devin-macos-lifecycle.sh
```

The builder, installer, rollback tool, and signed-canary workflow all use the
same read-only bundle verifier. It checks the bundle identity, deep-link
scheme, executable sidecars, isolated Nest marker, and isolated Keychain
service marker:

```sh
./scripts/verify-buzz-for-devin-macos-app.sh \
  "/path/to/Buzz for Devin.app"
```

## Install or upgrade

Pass the built app bundle to the installer:

```sh
./scripts/install-buzz-for-devin-macos.sh \
  "desktop/src-tauri/target/aarch64-apple-darwin/release/bundle/macos/Buzz for Devin.app"
```

The default destination is `~/Applications/Buzz for Devin.app`. If an older
copy exists, the installer moves it to a timestamped backup before copying the
new app. It does not delete application data or Keychain entries.

## Roll back

Use the exact backup path printed by the installer:

```sh
./scripts/rollback-buzz-for-devin-macos.sh \
  "$HOME/Applications/Buzz for Devin.app.backup-YYYYMMDDTHHMMSSZ"
```

The rollback moves the current app aside and restores the selected backup.

## Uninstall

```sh
./scripts/uninstall-buzz-for-devin-macos.sh
```

Uninstall moves only the app bundle to the user's Trash. Application data and
Keychain entries are intentionally preserved so an accidental uninstall is
recoverable. Credential or data removal is a separate, explicit manual action;
the project scripts never inspect or remove Devin authentication material.
