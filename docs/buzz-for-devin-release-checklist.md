# Buzz for Devin release checklist

This is the release gate for the initial community-supported macOS
distribution. It preserves Buzz's existing Tauri architecture and keeps
fork-owned signing, notarization, updater, and publication configuration out of
the generic Devin runtime patch.

No step may print, copy into the repository, or attach signing, updater,
Keychain, Buzz identity, or Cognition credentials to test evidence.

## Release scope

The first supported artifact is a signed and notarized Apple Silicon DMG for
macOS 11.0 or newer, built from an immutable `buzz-for-devin-vX.Y.Z` tag.
Intel macOS, Windows, and Linux are not supported until separately built and
tested.

The artifact must contain:

- Product name `Buzz for Devin`
- Bundle identifier `community.buzzfordevin.desktop`
- Deep-link scheme `buzz-for-devin://`
- Keychain service `buzz-for-devin-desktop`
- Agent Nest `~/.buzz-for-devin`
- Bundled CLI convenience link `~/.local/bin/buzz-for-devin`
- Executable `buzz-desktop`
- Sidecars `buzz`, `buzz-acp`, `buzz-agent`, `buzz-dev-mcp`, and
  `git-credential-nostr`

The release must retain the unofficial community-project disclaimer and must
not claim cloud Devin, Fusion, fan-out, Outposts, or local-to-cloud handoff
capability.

## Fork-owned release prerequisites

Configure these only as protected repository or release-environment secrets:

- Apple Developer ID Application certificate and its password
- Apple signing identity
- Apple account or App Store Connect API credentials accepted by Tauri
- Apple Team ID
- Tauri updater public key
- Tauri updater private key and password

The upstream `block/buzz` workflow uses Block-only signing infrastructure and
must not be reused with its internal roles or buckets. The fork pipeline should
follow Tauri's official macOS signing/notarization and GitHub pipeline
documentation, pin every third-party action to an immutable commit, and require
manual approval through a protected release environment.

The manual-only fork canary is defined in
`.github/workflows/buzz-for-devin-signed-macos-canary.yml`. It does not publish
or create a tag. Configure the `buzz-for-devin-release` environment with
required reviewers and the protected secrets above before dispatching it. The
workflow runs `just ci`, JavaScript audit, and Rust dependency policy checks
before importing the signing certificate. If the Apple Silicon dependency
graph still contains the documented no-safe-upgrade maintenance advisories,
the dispatcher must make an explicit, recorded canary-only risk decision; the
workflow never treats that decision as a passing advisory result.

Authoritative references:

- <https://v2.tauri.app/distribute/sign/macos/>
- <https://v2.tauri.app/distribute/pipelines/github/>
- <https://github.com/tauri-apps/tauri-action>

## Source and preflight gate

Before creating a release tag:

1. Review every changed line, with extra scrutiny on authorization, process
   launch, environment policy, workspace mapping, storage, and packaging.
   Copy
   [the validation record template](buzz-for-devin-validation-record-template.md)
   for the candidate; every required row must pass before publication.
2. Split generic upstream changes from fork branding/distribution and the
   dependency-only override according to
   [buzz-for-devin-upstream-patch-plan.md](buzz-for-devin-upstream-patch-plan.md).
3. Ensure the worktree is clean and every commit is understood.
4. Activate Hermit and run:

   ```sh
   . ./bin/activate-hermit
   just ci
   cargo test -p buzz-acp
   cargo test --manifest-path desktop/src-tauri/Cargo.toml
   cd desktop
   pnpm build:e2e
   CI=true pnpm exec playwright test \
     tests/e2e/onboarding.spec.ts \
     tests/e2e/onboarding-agent-defaults.spec.ts
   cd ..
   pnpm audit --audit-level=low
   GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_SYSTEM=/dev/null \
     cargo deny --locked check advisories
   cargo deny --locked check bans licenses sources
   GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_SYSTEM=/dev/null \
     cargo deny --locked --manifest-path desktop/src-tauri/Cargo.toml \
       check advisories
   GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_SYSTEM=/dev/null \
     cargo deny --locked --manifest-path desktop/src-tauri/Cargo.toml \
       --target aarch64-apple-darwin check advisories
   cargo deny --locked --manifest-path desktop/src-tauri/Cargo.toml \
     check bans licenses sources
   ./scripts/build-buzz-for-devin-macos.sh aarch64-apple-darwin
   ./scripts/test-buzz-for-devin-macos-lifecycle.sh
   ```

5. Inspect the packaged plist and confirm every bundled executable is
   executable.
6. Confirm the changed-file secret scan is clean and retain only redacted
   results.
7. Resolve or explicitly review the inherited desktop GTK3, `audiopus_sys`,
   `mach`, `proc-macro-error`, and `rust-unic` maintenance advisories before
   signing. The Apple Silicon-scoped graph excludes GTK3 and
   `proc-macro-error`, but still fails on `audiopus_sys`, `mach`, and
   `rust-unic`. Do not suppress the findings or call either failing advisory
   gate green.
8. Record the exact source commit, Devin CLI version, Rust toolchain, Node
   version, pnpm version, macOS version, and architecture.

## Signed canary gate

Before publishing a release:

1. Build a signed and notarized canary from the exact candidate commit without
   creating a release or updater manifest.
2. Verify:

   ```sh
   codesign --verify --deep --strict --verbose=2 \
     "/Applications/Buzz for Devin.app"
   spctl --assess --type execute --verbose=4 \
     "/Applications/Buzz for Devin.app"
   xcrun stapler validate "/path/to/Buzz for Devin.dmg"
   ```

3. Run `desktop/scripts/verify-macos-entitlements.sh` against the signed app.
4. Confirm the signed artifact still has the fork product name, identifier,
   scheme, Keychain service behavior, and all executable sidecars.
5. Confirm Gatekeeper accepts a browser-downloaded copy, not only the local
   build output.

## Clean-machine acceptance

Use a supported Mac that has never run this fork:

1. Download the candidate DMG from the intended distribution surface.
2. Verify its checksum against the release record.
3. Install by dragging the app to Applications.
4. Confirm first launch produces no damaged-app or unidentified-developer
   warning.
5. Confirm upstream Buzz can coexist and continues using its own data,
   `~/.buzz` Nest, `~/.local/bin/buzz` link, Keychain service, and `buzz://`
   links.
6. Confirm `buzz-for-devin://` opens only Buzz for Devin.
7. Verify all four readiness states:
   - Devin CLI missing
   - Devin installed but unauthenticated
   - Devin authenticated and ready
   - Devin ACP startup failure
8. Authenticate only through `devin auth login`; never copy credentials between
   machines.
9. Create an owner-only Devin agent, select a disposable workspace, publish a
   reply, perform safe tool activity, restart, and publish another reply. For
   the reply-only checkpoint, instruct Devin to use the Buzz CLI publication
   call and no other tools; a blanket "do not use tools" prompt makes the test
   invalid because raw ACP text is not automatically posted to the channel.
   After the reply appears, wait beyond the Devin compatibility grace and
   confirm the exact turn closes once with no requeue or duplicate publication.
10. Confirm the white-background Devin avatar appears in onboarding and for a
    newly created default Devin agent.
11. Confirm the Cognition dashboard attributes the test usage to the account
    authenticated on that OS user.
12. Complete the separate two-context authorization and workspace-isolation
    matrix.

## Updater and rollback gate

The updater stays disabled unless both the fork-owned public key and HTTPS
endpoint are embedded at build time.

1. Publish a signed candidate `N-1` and install it on the clean machine.
2. Publish signed candidate `N` and a matching signed updater manifest.
3. Confirm `N-1` discovers only the fork artifact and never upstream Buzz.
4. Apply the update, relaunch, and verify the installed version and signature.
5. Confirm identities, managed-agent records, logs, and Devin authentication
   remain available without migrating into upstream Buzz storage.
6. Test a deliberately unavailable update endpoint; the installed app must
   remain usable.
7. Test rollback to the previous signed app and verify configuration remains
   intact.
8. Rotate or revoke a test updater key only in a disposable pre-release lane;
   never experiment with the production key.

## Publication gate

Publication requires explicit owner approval after every preceding gate passes.

1. Create the immutable `buzz-for-devin-vX.Y.Z` tag at the reviewed commit.
2. Require the release workflow to verify that checkout `HEAD` exactly matches
   that tag.
3. Publish the signed/notarized DMG, checksum, source archive, release notes,
   and updater artifacts from the protected release environment.
4. Verify downloads, checksum, Gatekeeper acceptance, and updater URLs after
   publication.
5. Publish known limitations and the unofficial-project disclaimer.
6. Preserve the previous signed release for rollback.
7. Do not create a public community or invite beta users until release
   acceptance is recorded.

## Upstream gate

Upstream readiness is separate from fork publication:

1. Rebase or merge the latest `block/buzz` into a review branch without
   rewriting the user's working tree.
2. Re-run the focused and full gates on the resulting patch.
3. Open small generic pull requests in the documented patch order.
4. Exclude product branding, distribution secrets, community defaults, and
   release credentials.
5. Do not represent upstream acceptance as complete until the pull requests are
   reviewed and merged.
