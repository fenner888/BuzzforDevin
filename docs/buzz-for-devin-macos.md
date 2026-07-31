# Buzz for Devin on macOS

Buzz for Devin's first distribution target is Apple Silicon and Intel Macs
running macOS 11.0 or newer. The fork uses an isolated application identity:

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

## One-command source installation

Requirements:

- Apple Silicon or Intel Mac running macOS 11 or newer
- Xcode Command Line Tools (`xcode-select --install`)
- Approximately 15 GB of temporary free space
- The official Devin CLI installed under the same macOS account
- A clean checkout at an immutable Buzz for Devin release tag

From the reviewed checkout, run:

```sh
./scripts/install-macos-source.sh
```

The script activates the pinned repository toolchain, builds all required Buzz
sidecars and the desktop application, applies a local ad-hoc signature, verifies
the bundle, and installs it to
`~/Applications/Buzz for Devin.app`, then opens the installed application. It
does not need a paid Apple Developer account, bypass Gatekeeper, modify Devin
configuration, or inspect or copy Devin credentials. Public dependency fetches
ignore global Git URL rewrites only for the build process; the script does not
modify permanent Git settings.

The first build normally takes 15–45 minutes depending on the Mac. Once
installed, launch the application normally:

```sh
open "$HOME/Applications/Buzz for Devin.app"
```

Subsequent app launches do not recompile the project. The source release remains
different from a downloadable Developer ID-signed and Apple-notarized binary;
do not redistribute the locally built bundle.

Maintainers who need only an unsigned build artifact can still run:

```sh
./scripts/build-buzz-for-devin-macos.sh
```

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

## Low-level install or upgrade

The one-command source installer calls the low-level installer automatically.
Maintainers can pass a separately built, verified app bundle to it directly:

```sh
./scripts/install-buzz-for-devin-macos.sh \
  "desktop/src-tauri/target/<native-target>/release/bundle/macos/Buzz for Devin.app"
```

The native target is `aarch64-apple-darwin` on Apple Silicon and
`x86_64-apple-darwin` on Intel.

The default destination is `~/Applications/Buzz for Devin.app`. If an older
copy exists, the installer moves it to a timestamped backup before copying the
new app. It does not delete application data or Keychain entries.

## Update to another release tag

The updater never follows a moving branch. The current reviewed source release
uses this exact immutable tag:

```sh
./scripts/update-macos-source.sh buzz-for-devin-v0.4.25-alpha.8
```

For a later release, copy its exact `buzz-for-devin-v...` tag from the
[Releases page](https://github.com/fenner888/BuzzforDevin/releases) and pass it
as the updater's argument.

It fetches public release tags without changing global Git configuration,
checks out the requested tag, rebuilds, and uses the same backup-preserving
installer. If the checkout uses a local preview branch, the updater
fast-forwards that branch only after installation succeeds. A failed build
leaves the installed app in place and restores the previous source checkout.

## Repair the current release

To clean the release build outputs and reinstall the exact current tag:

```sh
./scripts/repair-macos-source.sh
```

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
