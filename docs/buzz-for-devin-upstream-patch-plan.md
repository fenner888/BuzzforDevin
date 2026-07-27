# Buzz for Devin upstream patch plan

> **Current upstream path (2026-07-27):** Block merged the generic BYOH harness
> seam in PR #2773. The earlier broad draft PR #3072 is closed and superseded
> by the focused Devin preset
> [`block/buzz` PR #3225](https://github.com/block/buzz/pull/3225). The patch
> boundaries below remain an architectural and historical review record.

This document separates generally useful Buzz changes from community-fork
distribution work. The generic runtime series is prepared locally; it does not
authorize a push, tag, pull request, or release.

## Patch 1: catalog-driven runtime capabilities

Purpose: keep `KnownAcpRuntime` as the single source of runtime capability
facts and project those facts into discovery, readiness, and the frontend.

Include:

- `desktop/src-tauri/src/managed_agents/discovery.rs`
- `desktop/src-tauri/src/managed_agents/discovery/runtime_catalog.rs`
- `desktop/src-tauri/src/managed_agents/discovery/runtime_metadata.rs`
- the associated discovery, metadata, avatar, and existing-runtime tests
- the catalog-driven frontend API types and onboarding/settings projections

Review condition: product React code must not contain runtime-specific
capability checks or a second TypeScript runtime table.

## Patch 2: native Devin ACP runtime

Purpose: add the official Devin CLI as a first-class native ACP runtime.

Include:

- runtime ID `devin`, label `Devin`, executable `devin`
- default arguments `acp`
- underlying CLI `devin`
- skills directory `.devin/skills`
- readiness probe `devin auth status`
- interactive setup `devin auth login`
- official Cognition installation documentation
- the white-background Devin runtime icon and profile avatar mapping
- `devin` to `devin acp` argument normalization
- focused discovery, readiness, normalization, and regression tests

Review condition: the implementation must not read or manage Cognition
credentials, add bypass flags, claim cloud Devin parity, or change existing
runtime behavior.

## Patch 3: safe managed-runtime boundaries

Purpose: make native ACP process behavior safe and deterministic for a
non-interactive community surface.

Include as focused commits where independently reviewable:

- owner-signed interactive allow-once/reject-once handling with exact
  channel, turn, and request matching
- catalog-declared environment policy, Devin's enforced default permission
  mode, disabled automatic approval, and enabled owner-consent bridge
- owner-only and one-worker Devin defaults
- selected-workspace canonicalization and Nest ancestor/symlink rejection
- stale managed-child cleanup
- owner-only managed-agent log permissions
- runtime avatar normalization

Review condition: document that workspace mapping is not an operating-system
sandbox. Preserve the historical behavior of other runtimes unless a generic
security fix is intentionally proposed and covered by regression tests.

## Patch 4: generic build-time app identity

Purpose: let downstream distributions isolate product identity without
hardcoding fork checks in React.

Possible upstream candidates:

- build-time desktop app name and deep-link scheme
- build-time Keychain service name
- build-time Nest directory and bundled CLI convenience-link name
- build-time web app name, deep-link scheme, release page, and release API
- sidecar executable-bit preservation
- packaged-release sidecar precedence over source-checkout target directories

Review condition: upstream defaults must remain exactly Buzz-compatible. Keep
the concrete `Buzz for Devin` plist, generated Tauri config, and distribution
scripts out of the generic patch.

## Separate security patch

The `linkify-it` 5.0.2, `markdown-it` 14.3.0, and `@babel/core` 7.29.7
workspace overrides fix high-, low-, and moderate-severity advisories in the
existing JavaScript dependency graph. The lockfile-only updates to `spin`
0.9.9, `spin` 0.10.1, and `nostr` 0.44.5 replace yanked Rust selections with
compatible unyanked releases. None adds Devin capability. Propose this
maintenance independently so dependency review does not obscure the runtime
integration.

Include:

- `pnpm-workspace.yaml`
- `pnpm-lock.yaml`
- `Cargo.lock`
- `desktop/src-tauri/Cargo.lock`

Review condition: retain the package-verification record, confirm that the
resolved versions remain within the dependency ranges already declared by
their consumers, and require `pnpm audit --audit-level=low` to report no known
vulnerabilities.

## Fork-only changes

Do not include these in a native-runtime upstream pull request:

- `DEVIN.md`, `COMMUNITY_FORK.md`, and community delivery plans
- `Buzz for Devin` product names, bundle identifier, plist, and release URLs
- fork macOS build, install, upgrade, rollback, and uninstall scripts
- fork signing, notarization, updater, and release workflows
- public-community defaults, invitations, or release policy
- signing, notarization, updater keys, or publication configuration

## Validation evidence

Before proposing any patch, reproduce the smallest tests for that patch and
then the repository gate:

```bash
. ./bin/activate-hermit
cargo test -p buzz-acp
cargo test --manifest-path desktop/src-tauri/Cargo.toml
cd desktop && pnpm test
cd ..
just ci
```

For the runtime patch, also run the focused onboarding Playwright tests and the
safe official-CLI smoke checks from the approved implementation plan. Do not
record credentials or Devin configuration in logs or PR evidence.

## Current upstream drift audit

The development worktree is based on local commit `a7ca0dd86b4f`. A complete
patch was first applied to public `block/buzz` commit `07d0265cfc21` on
2026-07-25 and passed every component of `just ci` using shared build caches.

On 2026-07-26, public `block/buzz` `main` advanced to `871a3b377234`. The
complete staged patch was applied again to a detached worktree at that exact
head without modifying the development branch or its index. Four textual
conflicts were reviewed:

- `desktop/src-tauri/src/managed_agents/runtime.rs`: the resolution preserves
  upstream's `metadata`, `process`, `orphan_sweep`, `instance_reaper`, and
  `lifecycle` module boundaries, then adds the generic catalog-driven launch,
  presentation, and process-tree behavior.
- `desktop/src-tauri/src/managed_agents/runtime/path.rs`: the packaged sibling
  `buzz` sidecar remains first only when it is actually present; development
  and non-bundled ordering remains unchanged.
- `desktop/src/features/agents/ui/UnifiedAgentsSection.tsx`: upstream's
  authoritative `modelSource` resolver is retained and extended with the
  catalog-projected model-control capability. The older fork-only formatting
  helper is omitted from the upstream patch.
- `scripts/bundle-sidecars.sh`: Unix sidecars are made executable while Windows
  `.exe` files retain their native copied mode.

The refreshed tree at `871a3b377234` passes the complete compatibility gate:

- root and Tauri formatting, strict Clippy, source guards, and staged-diff
  whitespace validation;
- all 3,543 desktop frontend tests and the production desktop build;
- all 1,734 Tauri library tests, with 14 infrastructure or real-Keychain tests
  intentionally ignored, plus all 3 mixer diagnostics;
- web formatting, source guards, type checking, and production build;
- mobile formatting, analysis, source guards, and all 685 tests, with one
  intentionally skipped test; and
- the public-upstream patch has no unresolved merge markers.

The previous complete tree at `c2a4ee711e48` passed:

- locked root and Tauri Cargo metadata, root and Tauri formatting,
  `git diff --cached --check`, and shell syntax for the conflicted packaging
  script;
- `cargo clippy -p buzz-acp --all-targets -- -D warnings` and complete Tauri
  `cargo clippy --all-targets -- -D warnings`;
- all 608 `buzz-acp` unit tests and all 9 lifecycle tests after the exact-turn
  recovery was mirrored byte-for-byte from the development tree;
- the complete Tauri suite after that mirror: 1,672 library tests passed, 14
  infrastructure or real-Keychain tests intentionally ignored, and all 3
  mixer diagnostics passed;
- desktop Biome over 420 files, all 3,531 frontend tests, TypeScript, and the
  production Vite build;
- touched-web Biome, file-size and pubkey-truncation guards, TypeScript, and the
  production Vite build;
- root advisories plus root and desktop bans/licenses/sources policy checks,
  with only the repository's inherited warnings; and
- the expected failing desktop advisory gates. The all-target graph still
  reports GTK3, `audiopus_sys`, `mach`, `proc-macro-error`, and `rust-unic`;
  the Apple Silicon graph still reports `audiopus_sys`, `mach`, and
  `rust-unic`. No failed advisory result is represented as green.

This proves the reviewed change set integrates with public upstream as of
`871a3b377234` and passed the complete `just ci` gate there. A later refresh
and local commit series is recorded below. The gate must still be repeated on
the immutable candidate immediately before approval because upstream can
continue advancing.

The later installed-bundle trace also showed Buzz passing its unrelated global
model to Devin even though the catalog reports no Buzz model-control
capability. The catalog now carries the launch policy as a runtime fact:
Devin does not receive generic `BUZZ_ACP_MODEL`, while Claude, Codex, Goose,
Buzz Agent, and custom-runtime behavior remains unchanged. The focused policy
and Devin catalog tests pass in both the development checkout and the detached
upstream integration tree. A restart of the installed bundle proved the
packaged process path and removed the forced-model warning. The test prompt
mistakenly prohibited tools, which also prohibited `buzz messages send`—the
upstream Buzz publication path. A direct official-CLI ACP handshake returned
the requested exact text with zero tools and zero file changes despite the same
user-configured MCP startup warnings, disproving those warnings as the cause.
No MCP configuration or credentials were inspected or changed. A corrected
installed prompt subsequently received **Allow once** and published the exact
requested reply through the packaged sibling Buzz CLI. The official Devin ACP
process did not return `session/prompt` afterward, so the generic harness now
offers a default-off self-publication completion grace. Devin opts into 30
seconds through the Rust runtime catalog. The recovery targets the exact
publishing turn, drops its already-satisfied batch, invalidates that session,
and reports a successful end turn; existing runtimes remain unchanged. The
complete main-tree harness suite (614 unit and 9 lifecycle tests), Tauri suite
(1,684 passed and 14 intentionally ignored), formatting, strict Clippy, and the
full `just ci` gate pass. The rebuilt installed app published the requested
exact reply once after **Allow once** and cleared its working and permission
state after the 30-second grace.

That live proof also found a generic Unix teardown gap: an ACP child in its own
process group survived a managed-agent restart after the desktop stopped only
the harness group. Teardown now snapshots same-user descendants while the
tracked harness is alive and terminates their owned process groups before the
harness. The independent-child regression test and strict Tauri Clippy pass in
both the main tree and refreshed upstream tree. The refreshed tree retains its
upstream-specific process detection while carrying the same cleanup patch. A
real Restart in the newest installed build replaced harness PID 32354 and
Devin PID 34505 with PIDs 37044 and 37045; both old processes were reaped. A
normal unlocked relaunch also restored the saved managed agent without a Play
action.

The earlier cold first-turn delay was eliminated by catalog-driven eager Devin
startup and a 120-second idle default. In the rebuilt installed app, a clean
restart reached `agent_pool_ready` in 44 milliseconds. Cold and warm top-level
DM probes completed in 4.017 and 4.047 seconds, and each exact reply appeared
once in the main timeline with no permission prompt, thread, or duplicate.
Devin still uses its default permission mode; Buzz does not silently persist
approval or select bypass mode.

## Prepared public-upstream series

On 2026-07-27, the generic patch was refreshed onto public `block/buzz`
`7fc0cc82db4d9dced9c258bbe8b530164a832a77` on branch
`agent/upstream-native-devin-acp`:

- `c4b94ebc` — `feat(desktop): add native Devin ACP runtime`
- `1387fbc4` — `feat(acp): mediate runtime permissions through owners`

The series contains no fork product name, bundle identity, installer, signing
workflow, publication configuration, dependency manifest, or lockfile change.
It preserves upstream's modular runtime architecture and keeps
`KnownAcpRuntime` as the single capability authority. The white-background
Devin mark is the only new runtime asset.

Validation on the committed series passed:

- all 614 `buzz-acp` unit tests and all 9 pool-lifecycle integration tests;
- all 1,812 Tauri library tests, with 14 real-Keychain/infrastructure tests
  intentionally ignored, plus all 3 mixer diagnostics;
- all 3,644 desktop frontend tests;
- all 21 onboarding runtime-default Playwright tests;
- desktop TypeScript, Biome, file-size, text-size, and pubkey guards;
- root and Tauri formatting;
- strict `buzz-acp` and complete Tauri Clippy with warnings denied;
- focused Devin catalog, normalization, readiness, launch-policy, and
  process-tree tests; and
- clean diff, merge-marker, fork-branding, dependency-file, secret-pattern,
  and Rust dependency-policy scope checks.

The branch remains isolated from the fork development branch. The refreshed
series was pushed to the fork and is the head of draft
[`block/buzz` PR #3072](https://github.com/block/buzz/pull/3072). Its DCO check
plus Semgrep OSS and zizmor checks pass; review and upstream acceptance remain
open.

## Remaining upstream prerequisites

- Complete the live two-context authorization and isolation matrix.
- Repeat usage attribution in both independent operating-system/Devin
  contexts. Installed exact-turn closure, responsive cold and warm messaging,
  automatic relaunch, and real-process restart cleanup are proven locally.
- Re-run JavaScript and both Rust workspace dependency policy checks on the
  immutable final candidate. Resolve or explicitly review the inherited desktop
  GTK3, `audiopus_sys`, `mach`, `proc-macro-error`, and `rust-unic`
  maintenance advisories. Also retain the Apple Silicon-scoped result, which
  excludes GTK3 and `proc-macro-error` but still fails on `audiopus_sys`,
  `mach`, and `rust-unic`.
- Re-fetch/rebase and review the two-commit series against `block/buzz`
  immediately before submission, because upstream can advance after this
  audit.
- Obtain explicit approval before pushing or opening a pull request.
