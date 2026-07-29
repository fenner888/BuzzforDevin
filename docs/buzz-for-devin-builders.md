# Buzz for Devin builder preview

Buzz for Devin can be run directly from GitHub while the focused upstream
integration is under review. This is the same source-first testing model used
for Buzz harness presets before they merge. There is no prebuilt application
download to redistribute; macOS users can build and ad-hoc sign an installed
app locally from the reviewed tag.

This project is community maintained. It is not an official Block or Cognition
product.

## Current checkpoint

Use the immutable source prerelease:

- Tag: `buzz-for-devin-v0.4.25-alpha.8`
- Release:
  <https://github.com/fenner888/BuzzforDevin/releases/tag/buzz-for-devin-v0.4.25-alpha.8>
- Focused upstream proposal:
  <https://github.com/block/buzz/pull/3225>

The source preview connects to an existing Buzz community selected during
onboarding. It does not require a local relay or Docker. Builders who want to
host their own relay can still follow Buzz's normal self-host instructions.

## Platform status

| Host | Source preview | Fork-specific evidence | Current support statement |
|---|---|---|---|
| Apple Silicon macOS | Installed source app available | Full CI, packaged source build, lifecycle, and live Devin ACP acceptance passed | Verified technical alpha |
| Intel macOS | Installed source app available | Buzz's release architecture supports Intel; fork-specific live Devin acceptance is pending | Experimental |
| Linux x86_64 / ARM64 | Available | Linux compilation and desktop CI pass; live Devin ACP acceptance is pending | Experimental |
| Windows x86_64 | Available through Git Bash with the MSVC toolchain | Windows Rust, Tauri, and shell gates pass; live Devin ACP acceptance is pending | Experimental |

`Available` means a builder can compile the reviewed source. It does not mean
that this fork publishes a supported prebuilt installer for that platform.

## Security boundary

- Install the official Devin CLI from
  <https://docs.devin.ai/cli>.
- Authenticate with your own Cognition account using `devin auth login`.
- Do not copy Devin configuration or authentication material between users or
  machines.
- The source runner may execute `devin --version`. Buzz uses the documented
  `devin auth status` readiness probe during onboarding. Neither path inspects
  credential files.
- New agents default to one worker and owner-only invocation.
- Devin permission requests remain explicit and fail closed. The runner does
  not enable a permission-bypass mode.
- The source preview does not enable the in-app updater or use signing
  credentials. The macOS source installer applies a local ad-hoc signature; it
  does not use an Apple Developer identity or notarization credentials.
- Debug source runs use Buzz's development-only Keychain and Nest namespaces.
  The separately built macOS alpha application uses the full
  `community.buzzfordevin.desktop` release isolation described in
  [buzz-for-devin-macos.md](buzz-for-devin-macos.md).

## Clone the reviewed source

```sh
cd "$HOME" &&
GIT_CONFIG_GLOBAL=/dev/null git clone \
  https://github.com/fenner888/BuzzforDevin.git BuzzforDevin-alpha8 &&
cd BuzzforDevin-alpha8 &&
git switch -c buzz-for-devin-alpha8 buzz-for-devin-v0.4.25-alpha.8
```

The named local branch avoids Git's detached-HEAD warning while preserving the
reviewed tag as its starting point. Do not test an arbitrary moving branch when
reporting a compatibility result. Include the tag and commit in every report.
The commands are chained so a failed clone cannot continue into checkout or
installation commands inside an incomplete directory.

### GitHub URL redirects

A public clone of this repository does not require a username or password. If
Git instead asks for credentials at `git-manager.devin.ai`, stop the prompt
with Control-C. A local Git URL rewrite is intercepting the GitHub URL before
Buzz is downloaded.

The primary clone command above already applies a command-scoped bypass and
uses a release-specific directory. It does not modify Devin configuration,
credentials, credential helpers, or permanent Git settings. The launcher makes
Cargo use the normal Git command for public Rust dependencies and applies the
same scoped protection. If the release-specific directory already exists from
an interrupted attempt, move it aside or use another empty directory before
retrying.

## Confirm Devin CLI readiness

Buzz uses the official Devin CLI already authenticated under the same computer
account. Check it first:

```sh
devin auth status
```

If `devin` is not found on macOS, Linux, or WSL, install it and open a new
terminal:

```sh
curl -fsSL https://cli.devin.ai/install.sh | bash
```

If the CLI is installed but unauthenticated, run `devin auth login`. The source
launcher automatically includes Cognition's `~/.local/bin` installation
location even if the invoking shell has not refreshed its `PATH`.

On Windows, run the installer from Git Bash. Cognition's installer delegates to
its PowerShell setup path for Windows.

## macOS

Install Xcode Command Line Tools if they are not already present. The repository
Hermit environment supplies the pinned Rust, Node, and pnpm toolchains.
On Intel Macs, where pnpm no longer publishes the standalone archive Hermit
expects, the installer automatically uses the same pinned pnpm version through
the repository's Corepack toolchain.

Apple Silicon and Intel users can create a normal locally installed application
from the reviewed tag:

```sh
./scripts/install-macos-source.sh
```

The command needs about 15 GB of temporary free space and normally takes 15–45
minutes on the first build, depending on the Mac. It creates an ad-hoc-signed
`~/Applications/Buzz for Devin.app` and opens it after installation; no paid
Apple Developer membership or Gatekeeper bypass is used. Later launches open
that app without recompiling. Do not redistribute the locally built bundle.

Update, repair, rollback, and uninstall instructions are in
[Buzz for Devin on macOS](buzz-for-devin-macos.md).

The installer selects `aarch64-apple-darwin` on Apple Silicon and
`x86_64-apple-darwin` on Intel, then rejects a bundle if any packaged executable
does not match that architecture. The installed bundle uses the normal packaged
application icon.

## Linux

Install the normal Tauri 2 Linux prerequisites for your distribution. On
Ubuntu 22.04 or compatible Debian-based systems, the CI-proven package set
includes:

```sh
sudo apt-get update
sudo apt-get install -y \
  build-essential curl file git \
  libasound2-dev libayatana-appindicator3-dev libgtk-3-dev \
  librsvg2-dev libssl-dev libwebkit2gtk-4.1-dev libxdo-dev \
  patchelf pkg-config xdg-utils
```

Then run:

```sh
./scripts/run-buzz-for-devin-source.sh
```

The repository Hermit environment supplies the pinned Rust, Node, and pnpm
toolchains on Linux.

## Windows

Windows source builders need:

- Windows 11 x86_64
- Git for Windows, including Git Bash
- Visual Studio Build Tools with the Desktop development with C++ workload
- Rust's `x86_64-pc-windows-msvc` toolchain
- Node.js 24
- pnpm 11.4
- WebView2

Hermit's repository bootstrap is macOS/Linux-only, so Windows uses the
host-installed tools above. Open Git Bash, confirm the commands resolve, and
run:

```sh
cargo --version
rustc -vV
node --version
pnpm --version
./scripts/run-buzz-for-devin-source.sh
```

Do not use a GNU Rust host or WSL's `bash.exe` for this path. The supported
preview target is `x86_64-pc-windows-msvc`, and Buzz resolves Git Bash for
managed-agent shell activity.

## What to test

1. Complete Buzz onboarding and select or join a community.
2. Confirm Devin is shown with the white-background Devin mark.
3. Create a Devin-backed agent with the default model and owner-only policy.
4. Start the agent and verify it becomes ready without changing Devin
   configuration.
5. Send a top-level DM and verify one reply appears in the DM timeline.
6. Mention the agent in a channel and verify the reply follows the channel's
   thread behavior.
7. If Devin requests permission, choose only the action you intend and verify
   there is no persistent auto-approval.
8. Restart the managed agent and send another message.
9. Stop the agent and close Buzz.

For the first Windows and Linux acceptance, also record:

- Operating system and architecture
- Source tag and exact commit
- `devin --version`
- Whether `devin auth status` reported ready
- Time to first response
- Whether an approval prompt appeared
- Whether the response landed in the expected DM or channel thread

Do not include credentials, authentication output containing private material,
private repository contents, or unredacted logs in an issue.

## Prepare without launching

Maintainers can validate toolchain detection, sidecar compilation, and bundle
configuration without opening the desktop app:

```sh
./scripts/run-buzz-for-devin-source.sh --prepare-only
```

Preparation is not a live Devin ACP acceptance test.

## Reporting problems

Open an issue at <https://github.com/fenner888/BuzzforDevin/issues> and include
the non-sensitive evidence above. Clearly distinguish:

1. Devin CLI missing
2. Devin installed but unauthenticated
3. Devin authenticated and ready
4. Devin ACP startup failure

The source preview does not claim model switching, Fusion, fan-out, Outposts,
cloud handoff, or cloud Devin parity.
