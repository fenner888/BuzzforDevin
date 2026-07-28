# Buzz for Devin

Buzz for Devin is a community-maintained fork of
[Block's Buzz](https://github.com/block/buzz) that adds the official Devin CLI
as a native ACP runtime.

Each person installs and authenticates Devin on their own computer. Buzz starts
that local CLI with `devin acp`; it does not copy Devin credentials between
users or machines.

- [Source alpha](https://github.com/fenner888/BuzzforDevin/releases/tag/buzz-for-devin-v0.4.25-alpha.3)
- [Builder installation guide](docs/buzz-for-devin-builders.md)
- [Devin integration notes](DEVIN.md)
- [Upstream proposal](https://github.com/block/buzz/pull/3225)

## What this fork adds

- A first-class **Devin** runtime in Buzz's existing ACP runtime catalog
- The standard `devin acp` launch command
- Readiness states for a missing CLI, unauthenticated CLI, ready CLI, and ACP
  startup failure
- Cognition's white-background Devin mark in Buzz's runtime icon system
- `.devin/skills` as the Devin skills directory
- Owner-only invocation and one worker by default

This integration does not enable permission bypasses or modify Devin
configuration and credentials.

## Run the source preview

Buzz uses your existing authenticated
[official Devin CLI](https://docs.devin.ai/cli). Confirm it is ready under the
same computer account that will run Buzz:

```sh
devin auth status
```

If `devin` is not found on macOS, Linux, or WSL, install it using Cognition's
official installer, then open a new terminal:

```sh
curl -fsSL https://cli.devin.ai/install.sh | bash
```

If Devin is installed but unauthenticated, run `devin auth login`. Otherwise,
no Devin setup is needed. The source-preview launcher also checks the official
`~/.local/bin` installation location automatically.

Then clone the reviewed source alpha and run it:

```sh
git clone https://github.com/fenner888/BuzzforDevin.git
cd BuzzforDevin
git switch -c buzz-for-devin-preview buzz-for-devin-v0.4.25-alpha.3
./scripts/run-buzz-for-devin-source.sh
```

The source preview connects to an existing Buzz community selected during
onboarding. A local relay and Docker are not required unless you want to
self-host the complete Buzz stack.

## Platform status

| Platform | Status |
|---|---|
| Apple Silicon macOS | Live Devin ACP acceptance passed |
| Intel macOS | Source preview available; live acceptance pending |
| Linux | Source preview available; live acceptance pending |
| Windows 11 x86_64 | Source preview available through Git Bash; live acceptance pending |

See the [builder installation guide](docs/buzz-for-devin-builders.md) for
platform prerequisites and the acceptance checklist. This repository currently
publishes reviewed source, not signed installers.

## Current boundaries

Buzz for Devin provides the native local ACP connection. It does not claim
model switching, Fusion, fan-out, Outposts, cloud handoff, or full cloud Devin
parity. Devin permission requests remain explicit.

## Development

Activate the repository's pinned toolchain before running project commands:

```sh
. ./bin/activate-hermit
just setup
just ci
```

The codebase retains Buzz's existing architecture. Contributor and architecture
documentation remains available in the repository for developers changing the
underlying Buzz system.

## Issues and security

- Report fork-specific problems in
  [Buzz for Devin issues](https://github.com/fenner888/BuzzforDevin/issues).
- Follow [SECURITY.md](SECURITY.md) for security reports.
- Never include Devin credentials, private configuration, or unredacted private
  repository contents in an issue.

## Upstream and license

This fork is based on [Block's Buzz](https://github.com/block/buzz) and is
licensed under [Apache 2.0](LICENSE). The Devin integration is maintained by the
community and is not an official Block or Cognition release.
