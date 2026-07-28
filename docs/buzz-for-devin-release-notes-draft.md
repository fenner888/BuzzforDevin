# Buzz for Devin release notes draft

> Draft only. Replace every placeholder and complete the release validation
> record before publication. Do not publish an unsigned source build.

## Buzz for Devin `vX.Y.Z`

Buzz for Devin is a community-maintained distribution of Buzz that adds the
official Devin CLI as a native local Agent Client Protocol runtime while
preserving Buzz's existing relay, identity, channel, and managed-agent
architecture.

### What is included

- First-class `Devin` runtime selection backed by `devin acp`.
- Readiness states that distinguish:
  - Devin CLI missing;
  - Devin installed but unauthenticated;
  - Devin authenticated and ready; and
  - Devin ACP startup failure.
- Interactive authentication through the official `devin auth login` flow.
- Cognition's official Devin CLI documentation as the installation source.
- White-background Devin runtime and default profile artwork.
- Owner-only invocation and one worker by default for newly created Devin
  agents.
- Catalog-enforced default permission mode with automatic permission approval
  disabled for Devin. Non-interactive permission requests fail closed.
- Exact-turn recovery when Devin publishes a visible result but its ACP prompt
  remains open: Buzz waits 30 seconds, closes only that publishing turn, and
  does not retry the already-satisfied request. Other runtimes keep their
  historical default because the generic recovery is disabled unless selected
  by runtime catalog policy.
- A selected Repos Directory mapped into the managed agent Nest after path and
  symlink validation.
- Fork-specific app data, Keychain service, deep links, Agent Nest, and CLI link
  so upstream Buzz and Buzz for Devin can coexist.
- Recoverable install, upgrade, rollback, and uninstall behavior.

### Supported release

The first supported binary release is planned as a signed and notarized Apple
Silicon DMG for macOS 11 or newer. Intel macOS, Windows, and Linux are not part
of this release unless separately built, tested, and documented.

### Prerequisites

1. Install the official Devin CLI using
   [Cognition's Devin CLI documentation](https://docs.devin.ai/cli).
2. Authenticate in a visible terminal with `devin auth login`.
3. Install the signed and notarized Buzz for Devin DMG from this release.
4. Verify the downloaded DMG against the published SHA-256 checksum.

Do not copy Devin credentials between users or machines. Buzz for Devin does
not read, store, migrate, or manage Cognition authentication material.

### Security defaults

- New Devin agents are `owner-only`.
- New Devin agents use one worker.
- Buzz does not add permission-bypass flags.
- Automatic permission approval is disabled for Devin.
- External identities require an explicit invocation-policy change.
- Channel allowlisting does not widen direct-message admission.
- Managed-agent logs are owner-readable only on Unix.

The Repos Directory mapping is not an operating-system sandbox. Devin retains
the official CLI's behavior and the permissions of the macOS user running it.
Use separate macOS users or separate Macs when separate Devin credential and
workspace boundaries are required.

### Intentional non-capabilities

This release does not claim:

- model switching;
- Fusion;
- multi-agent fan-out;
- Outposts;
- local-to-cloud handoff; or
- parity with cloud Devin.

It provides the official local Devin ACP runtime inside Buzz. Future capability
claims require separate implementation and validation.

### Upgrade, rollback, and uninstall

- Quit Buzz for Devin before installing or upgrading.
- The installer validates product identity and bundled executables before
  replacing an existing app.
- Upgrades retain a recoverable prior app bundle.
- Rollback restores a validated prior bundle without deleting app data or
  Keychain state.
- Uninstall moves only the application to Trash and intentionally preserves
  user data and Keychain entries for recovery.

### Artifacts

| Artifact | SHA-256 |
| --- | --- |
| `Buzz-for-Devin-vX.Y.Z-aarch64.dmg` | `REPLACE_BEFORE_RELEASE` |
| Source archive | `REPLACE_BEFORE_RELEASE` |

The release must also link its completed validation record, source commit,
signed workflow run, notarization evidence, and known limitations.

### Upstream relationship

Buzz for Devin is a community project and is not an official Cognition or Block
product. Generic runtime-catalog and native-Devin changes are being prepared as
small upstream proposals for `block/buzz`; fork branding, release
infrastructure, credentials, and community policy remain fork-owned.
