# Buzz for Devin builder preview

Buzz for Devin can be run directly from GitHub while the focused upstream
integration is under review. This is the same source-first testing model used
for Buzz harness presets before they merge. There is no unsigned application
download to redistribute.

This project is an unofficial community fork. It is not an official Block or
Cognition product.

## Current checkpoint

Use the immutable source prerelease:

- Tag: `buzz-for-devin-v0.4.25-alpha.2`
- Release:
  <https://github.com/fenner888/BuzzforDevin/releases/tag/buzz-for-devin-v0.4.25-alpha.2>
- Focused upstream proposal:
  <https://github.com/block/buzz/pull/3225>

The source preview connects to an existing Buzz community selected during
onboarding. It does not require a local relay or Docker. Builders who want to
host their own relay can still follow Buzz's normal self-host instructions.

## Platform status

| Host | Source preview | Fork-specific evidence | Current support statement |
|---|---|---|---|
| Apple Silicon macOS | Available | Full CI, packaged source build, and live Devin ACP acceptance passed | Verified technical alpha |
| Intel macOS | Available | Buzz and Devin provide host binaries; fork-specific live acceptance is pending | Experimental |
| Linux x86_64 / ARM64 | Available | Linux compilation and desktop CI pass; live Devin ACP acceptance is pending | Experimental |
| Windows x86_64 | Available through Git Bash with the MSVC toolchain | Windows Rust, Tauri, and shell gates pass; live Devin ACP acceptance is pending | Experimental |

`Available` means a builder can compile and run the source preview. It does not
mean that this fork publishes a supported installer for that platform.

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
- The source preview does not enable the updater or use signing credentials.
- Debug source runs use Buzz's development-only Keychain and Nest namespaces.
  The separately built macOS alpha application uses the full
  `community.buzzfordevin.desktop` release isolation described in
  [buzz-for-devin-macos.md](buzz-for-devin-macos.md).

## Clone the reviewed source

```sh
git clone https://github.com/fenner888/BuzzforDevin.git
cd BuzzforDevin
git checkout buzz-for-devin-v0.4.25-alpha.2
```

Do not test an arbitrary moving branch when reporting a compatibility result.
Include the tag and commit in every report.

## Install and authenticate Devin

Follow Cognition's current instructions:

```sh
curl -fsSL https://cli.devin.ai/install.sh | bash
devin auth login
devin --version
devin auth status
```

On Windows, run the installer from Git Bash. Cognition's installer delegates to
its PowerShell setup path for Windows.

## macOS

Install Xcode Command Line Tools if they are not already present. The repository
Hermit environment supplies the pinned Rust, Node, and pnpm toolchains.

From the repository root:

```sh
./scripts/run-buzz-for-devin-source.sh
```

Apple Silicon builders who need the isolated unsigned `.app` lifecycle instead
of a source preview should follow
[Buzz for Devin on macOS](buzz-for-devin-macos.md). Do not redistribute that
locally built unsigned application.

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
