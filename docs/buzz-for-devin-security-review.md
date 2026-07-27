# Buzz for Devin security review

**Review date:** 2026-07-25

**Scope:** native Devin ACP runtime, managed-process launch policy, workspace
mapping, account isolation, invocation authorization, local packaging, and the
fork web deep-link boundary.

This review does not treat a passing unit test as live multi-user proof. The
separate operating-system account matrix remains a release gate in
[buzz-for-devin-multi-user-validation.md](buzz-for-devin-multi-user-validation.md).

## Authorization matrix

Buzz signs and verifies community events independently of Devin. The
`buzz-acp` inbound author gate decides whether an event may start or steer a
turn before the prompt reaches `devin acp`.

| Author | `owner-only` | `allowlist` | `anyone` | `nobody` |
| --- | --- | --- | --- | --- |
| Agent owner | Allow | Allow | Allow | Deny |
| Verified sibling agent owned by the same owner | Allow | Allow | Allow | Deny |
| Explicitly allowlisted external identity | Deny | Allow | Allow | Deny |
| Unlisted external identity | Deny | Deny | Allow | Deny |

Direct messages are stricter: only the owner or a verified sibling is admitted
under `owner-only`, `allowlist`, or `anyone`; `nobody` denies all authors.
Allowlisting an external identity for community channels does not allow that
identity to invoke the agent through a direct message.

The product default remains `owner-only`. `allowlist` and `anyone` require an
explicit owner change. The automated suite covers owner, sibling, allowlisted,
unlisted, stranger, direct-message, missing-metadata, and setup-listener
fail-closed cases. Live proof with two independent identities is still
required.

### Which record the gate reads (2026-07-27 finding)

The enforced policy is the **instance** record's `respond_to` /
`respond_to_allowlist` pair. `build_respond_to_env` converts that pair into
`BUZZ_ACP_RESPOND_TO` (and `BUZZ_ACP_RESPOND_TO_ALLOWLIST`) when the agent's
child process is spawned. A definition's behavior group is a *template*: it is
copied onto an instance only when a new instance is minted from it, and
`update_persona` propagates only `display_name` and `avatar_url` to instances
that already exist.

An upstream routing defect made the two diverge silently. For a
definition-linked agent, the profile panel's Edit action opened the
**definition** editor, so the dialog displayed a definition-level allowlist
while the running agent continued to enforce its instance policy. Observed
live on `Devin Phase 2 Live`: the definition (kind `30175`,
`d=ea752a17-…`) carried `allowlist` with one entry, the instance (kind
`30177`, `d=1dcd8dfd…a506`) carried `owner-only` with none, and the running
harness had `BUZZ_ACP_RESPOND_TO=owner-only` with no allowlist variable set.

The failure mode is bidirectional and matters most for revocation: an owner
who *removed* an identity from that dialog would believe access was revoked
while the live agent kept honouring the original policy. Fixed by
`resolveProfileEditTarget`, which routes an instance-backed profile to the
instance editor so the displayed policy is the enforced one; definition
editing remains available from the agent library's actions menu and from the
instance editor's linked-definition hop. This routing is upstream code
(`block/buzz` #1274, #1928) and is not fork-specific.

### Revocation is not effective until the agent restarts (2026-07-27 finding)

`build_respond_to_env` runs once, at spawn. A running harness therefore keeps
enforcing the policy it was started with, and an inbound-author change only
takes effect on the next start. Measured live while revoking one allowlisted
identity:

| Time (UTC) | Persisted record | Live harness environment |
| --- | --- | --- |
| 18:39:55 | `owner-only` | `allowlist` + revoked pubkey |
| 18:42:35 | `owner-only` | `owner-only`, allowlist variable absent |

For those two minutes and forty seconds the revoked identity retained full
invocation access. The agent record had `auto_restart_on_config_change: true`,
and no automatic restart occurred within that window; the UI surfaced a
`RESTART REQUIRED` badge and waited. That is the documented behaviour rather
than a malfunction — the setting restarts the agent "once it is idle and
connected" — but the security consequence is what matters: the revocation
window is bounded by agent idleness plus operator attention, not by the
revoking action, and nothing about the badge communicates that the old policy
is still being enforced meanwhile.

Treat "removing an identity revokes access" as true only after a restart, and
do not record that row as passing on the basis of the persisted record alone.

**Disposition.** This is left unfixed in this pass, deliberately. The narrow
change — treat an authorization *narrowing* as grounds for an immediate
restart rather than waiting for idleness — is the wrong shape of fix: it makes
policy correctness depend on process lifecycle, and it silently converts a
permission edit into cancelled work in progress. The right fix is for the
inbound-author gate to be evaluated per event against current policy instead
of against a snapshot captured in the spawn environment, so revocation is
effective the moment it is saved and no restart is implicated at all. That is
an architectural change to `buzz-acp`'s policy plumbing, it is upstream-generic,
and it warrants maintainer agreement rather than being bundled into a fix pass
for an unrelated defect.

Until then the honest statement is the one above: revocation is effective on
restart. A release must not claim prompt revocation, and the
`RESTART REQUIRED` badge does not currently tell an owner that the previous
policy is still being enforced — which is the part most likely to mislead.

### Non-allowlist modes republish a stale allowlist (2026-07-27 finding)

The definition write path clears the allowlist whenever the mode is not
`allowlist`, because "storing it for other modes would republish stale pubkeys
the author didn't choose" (`apply_persona_behavior`). The instance write path
does not. After revoking the one allowlisted identity, the instance record and
its public kind:30177 projection both still carried that pubkey alongside
`"respond_to":"owner-only"`.

This is a disclosure and hygiene defect, not an access-control one. Spawn drops
`BUZZ_ACP_RESPOND_TO_ALLOWLIST` for non-allowlist modes, and
`relayAgentIsSharedWithUser` gates on `respondTo === "allowlist"` before it
consults membership, so the stale entry grants nothing and does not restore
the agent to the revoked identity's autocomplete. The residual harm is that a
revoked association stays publicly readable on the relay. The instance path
should match the definition path.

## Inherited ACP host state must not reach the adapter (2026-07-27 finding)

Cognition's own documentation frames Devin Desktop as an ACP *host* that
launches third-party agents and injects environment into them (see
<https://docs.devin.ai/desktop/acp>, "Enabling custom agents" and the
`devin.acp.agentEnv.<agentName>` setting). `ACP_BACKEND=windsurf` is part of
that host-side state: it tells a spawned `devin acp` that its host is Devin
Desktop, and therefore that the host supplies credentials over ACP.

When Buzz is the host, that claim is false. If the variable is inherited —
for example because Buzz was launched from a terminal running inside Devin
Desktop — the adapter announces "ACP host is the sole source of credentials.
Local CLI credentials (env vars, on-disk REPL store) will NOT be used" and
every turn fails with `-32000 ACP host has not authenticated`, even though
`devin auth login` succeeded. With the variable absent the same binary reports
"`ACP_BACKEND` not set. Will accept host credentials if provided, otherwise
fall back to env vars and stored CLI credentials" and turns succeed.

The same leak also corrupted readiness reporting: `devin auth status` returned
"Not logged in" under contamination and "Logged in (via Devin)" without it.

`ACP_BACKEND` is therefore scrubbed alongside `WINDSURF_API_KEY` in Devin's
`scrub_env_vars`. That single list is consumed by process launch
(`apply_runtime_env_policy`), the login/readiness probe, and runtime discovery,
so one entry fixes invocation and readiness together. Verified in a packaged
build: the desktop process carried `ACP_BACKEND` while the Devin harness it
spawned did not.

Buzz's own probing of `devin auth status` and remediation via `devin auth login`
remain correct, because an uncontaminated adapter falls back to exactly that
stored-credential path.

## Devin authentication boundary

- Buzz probes readiness with `devin auth status`.
- Interactive setup launches `devin auth login` in a visible terminal.
- Buzz does not read, serialize, log, copy, or remove Cognition credentials.
- Devin authentication belongs to the operating-system user. It is not scoped
  to a Buzz identity inside one macOS login.
- The inherited legacy `WINDSURF_API_KEY` variable is removed from Devin's
  catalog-discovery probe, readiness probe, visible login terminal, and managed
  runtime without reading its value. This prevents an ambient key from silently
  replacing the account selected by the official Devin login flow.
- Account-isolation acceptance therefore requires separate machines or
  separate macOS users with independently authenticated Devin CLIs.

## Process launch and permissions

The runtime catalog is the capability authority. Its Devin entry declares only:

```text
devin acp
```

No dangerous or bypass flag is added. Immediately before spawning the managed
harness, Buzz enforces `BUZZ_ACP_PERMISSION_MODE=default` and
`BUZZ_ACP_AUTO_APPROVE_PERMISSIONS=false` and
`BUZZ_ACP_INTERACTIVE_PERMISSIONS=true` for Devin after all ambient and
user-configured environment layers. A saved agent or parent process cannot
override those values.

If Devin sends an ACP permission request, Buzz surfaces **Allow once** and
**Deny** to the agent owner. The encrypted owner-signed control must match the
exact channel, turn, and JSON-RPC request id. No `allow_always` or bypass
decision is accepted; stale, missing, unavailable, and timed-out decisions
fail closed. Existing non-Devin runtime behavior is unchanged.

The managed harness receives the existing Buzz agent identity and relay
environment required by Buzz architecture. The Devin integration adds no
Cognition secret to that environment and does not log environment values.

## Workspace boundary

The configured Repos Directory must be an existing absolute directory. Buzz
canonicalizes parent segments and symlink targets before checking that the
selection is not the Nest or one of its ancestors. It exposes the validated
target as the Nest's `REPOS` mapping.

This is path validation and mapping, not an operating-system sandbox. Devin
retains the official CLI's permission behavior and the local OS user's access.
The release does not claim that prompts cannot reach other paths available to
that OS user. Cross-account workspace isolation must be proven with separate
OS users or machines, and public documentation must keep this limitation
visible.

## Storage and logs

- The fork release uses its own bundle identifier, application-support
  directory, deep-link scheme, Keychain service, `~/.buzz-for-devin` Nest,
  and `~/.local/bin/buzz-for-devin` convenience link.
- The isolated release Nest does not fall back to upstream `~/.buzz/REPOS` or
  import legacy `~/.sprout` knowledge.
- New Devin agents default to one worker. Existing records keep their stored
  value because legacy storage cannot prove whether a value matching Buzz's
  former global default was implicit or explicitly chosen.
- Managed-agent log files are created as owner-only (`0600`) on Unix.
  Reopening a legacy log tightens it to `0600`.
- Source scans found no strong credential patterns in changed files.
- Logs can still contain tool and runtime output. A public beta must inspect
  representative logs for accidental sensitive output without copying
  credentials into the test record.

## Distribution boundary

- The source build is unsigned and updater-disabled. It is for development
  validation only.
- Install and upgrade validate the product name, bundle identifier, deep-link
  scheme, and every bundled executable before changing the installed app.
- Installation stages on the destination filesystem and switches only after
  validation. Upgrade and rollback preserve recoverable prior app bundles.
- The repeatable lifecycle test covers malformed-bundle rejection, refusal
  while the installed executable is running, install, upgrade, rollback, and
  uninstall entirely inside a temporary directory.
- Packaged releases prefer executable-directory sidecars over source-checkout
  `target` outputs. Debug builds keep workspace-first discovery. Focused tests
  cover both orderings so an installed app cannot silently mix with a stale
  developer `buzz-acp` when the checkout still exists.
- Devin's runtime-catalog policy suppresses Buzz's generic
  `BUZZ_ACP_MODEL` bootstrap value because the native ACP server owns model
  selection. The policy is applied in Rust launch code without a runtime-ID
  branch; focused regression coverage proves existing known and custom runtime
  bootstrap behavior is unchanged.
- Uninstall moves only the app to Trash. It intentionally preserves application
  data and Keychain entries.
- The web client defaults to upstream Buzz but supports explicit fork app-name,
  deep-link, release-page, and release-API build values. A fork deployment must
  set all four.

## Dependency review

No Devin feature dependency was added. The release audit found advisories in
three existing transitive selections:

- two high-severity quadratic-complexity advisories in `linkify-it` 5.0.0;
- a low-severity smartquotes quadratic-complexity advisory in `markdown-it`
  14.1.0; and
- a moderate-severity source-map arbitrary-file-read advisory in
  `@babel/core` 7.28.5.

The project now constrains those existing dependency ranges to patched,
same-major releases: `linkify-it` 5.0.2, `markdown-it` 14.3.0, and
`@babel/core` 7.29.7. Each package was verified before the override against
npm's official registry, its established upstream repository, maintainers,
integrity metadata, publication history, and substantial download history.
After the overrides, `pnpm audit --audit-level=low` reports no known
vulnerabilities, and `pnpm why` resolves exactly one copy of each patched
package.

The root Rust workspace advisory, license, duplicate, and source policy checks
pass. The advisory fetch was run with Git's global and system configuration
disabled for that process because this machine's pre-existing GitHub routing
requires an interactive credential. That routing and its credentials were not
inspected or modified.

The refreshed advisory index initially reported yanked transitive selections
for `spin` 0.9.8, `spin` 0.10.0, and `nostr` 0.44.3/0.44.4. Both lockfiles now
select the compatible unyanked releases `spin` 0.9.9, `spin` 0.10.1, and
`nostr` 0.44.5. The two `spin` patches retain their existing crate series and
feature surface. The `nostr` patch was additionally compared against 0.44.3:
its dependency and feature surface is unchanged, while its substantive source
changes erase the cached keypair on drop and reject authenticated undersized
NIP-44 payloads without panicking. Neither lockfile contains those yanked
selections. Existing permitted git-source and duplicate-version warnings remain
repository-wide maintenance concerns.

The separately excluded desktop Tauri workspace does not currently pass
`cargo deny check advisories`. The exact locked graph reports unmaintained
dependencies in four inherited groups:

- ten GTK3 binding advisories in Tauri's cross-platform Linux graph
  (`RUSTSEC-2024-0411` through `RUSTSEC-2024-0420`);
- `audiopus_sys` through Buzz's existing `opus` audio dependency
  (`RUSTSEC-2026-0150`);
- two locked `mach` selections and `proc-macro-error`
  (`RUSTSEC-2020-0168` and `RUSTSEC-2024-0370`); and
- five crates from the unmaintained `rust-unic` project through
  `tauri-utils 2.9.3 -> urlpattern 0.3.0`: `unic-char-property`,
  `unic-char-range`, `unic-common`, `unic-ucd-ident`, and
  `unic-ucd-version` (`RUSTSEC-2025-0081`, `RUSTSEC-2025-0075`,
  `RUSTSEC-2025-0080`, `RUSTSEC-2025-0100`, and `RUSTSEC-2025-0098`).

Cargo Deny reports no safe upgrade for these locked selections. None was
introduced by the Devin runtime work.

For the first-release target, the narrower
`cargo deny --target aarch64-apple-darwin check advisories` excludes the GTK3
and `proc-macro-error` findings because those crates are not in the Apple
Silicon graph. It still fails on `audiopus_sys`, the two `mach` selections, and
the five `rust-unic` crates. The target-scoped result is useful triage, not a
green gate.

The desktop advisory failure is inherited from the upstream dependency graph,
not a Devin dependency or fork regression. Root and desktop bans, license,
and source checks still pass. The fork does not silently ignore these
advisories: a release must update the affected upstream dependencies where
safe fixes exist and explicitly review any no-fix maintenance risk before
signing.

## Local validation snapshot

This is development evidence, not release sign-off. The generic integration
series is submitted only as draft
[`block/buzz` PR #3072](https://github.com/block/buzz/pull/3072); it is not an
immutable release candidate. The prior draft head was `fff496e6`, based on
public upstream commit `63c62fcf3eb5`.

On 2026-07-27 the series was refreshed locally onto public upstream
`7fc0cc82db4d9dced9c258bbe8b530164a832a77` as two generic commits,
`c4b94ebc` and `1387fbc4`. The refreshed patch preserves upstream's restored
Goose and Buzz Agent onboarding entries and keeps onboarding visibility,
ordering, model capability, runtime icons, launch defaults, and
authentication policy projected from Rust `KnownAcpRuntime` rather than a
duplicate TypeScript table. It is now the draft PR head.

The following complete gates passed on 2026-07-25 against the then-current
upstream base; the 2026-07-26 refresh evidence is recorded below. After the
exact-turn completion recovery was added and the app was rebuilt, a fresh
development-tree `just ci` also passed in full on 2026-07-26:

- `cargo test -p buzz-acp permission`: 16 tests passed.
- Focused Tauri Devin tests: 14 tests passed.
- Focused frontend readiness, catalog, link, and identity tests: 73 tests
  passed through the repository test loader.
- Focused onboarding Playwright tests: 77 tests passed.
- The Devin onboarding Playwright check decodes and renders the actual SVG,
  verifies an opaque white canvas and dark mark, and rejects transparent output.
- `just ci`: passed, including repository formatting, linting, unit tests,
  desktop builds/tests, Tauri compilation/tests, web checks, and mobile checks.
- `pnpm audit --audit-level=low`: no known vulnerabilities.
- Root `cargo deny check advisories`: passed.
- Desktop `cargo deny check advisories`: failed on the inherited GTK3,
  `audiopus_sys`, `mach`, `proc-macro-error`, and `rust-unic` maintenance
  advisories documented above.
- Apple Silicon-scoped desktop `cargo deny check advisories`: failed on the
  inherited `audiopus_sys`, `mach`, and `rust-unic` maintenance advisories;
  GTK3 and `proc-macro-error` are outside that target graph.
- Root and desktop `cargo deny check bans licenses sources`: passed with only
  the repository's existing permitted duplicate and git-source warnings.
- Redacted changed-file secret scan: no credential material found; candidates
  were semantic test placeholders or nonliteral E2E mock expressions.
- The complete `buzz-acp` suite passed: 614 unit tests and 9 lifecycle tests.
- The complete desktop Tauri suite passed: 1,684 tests, with 14 intentionally
  ignored tests that require real Keychain or external infrastructure.
- After the catalog model-launch policy fix, the installed bundle launched its
  sibling `buzz-acp` and the official `devin acp` without the previous
  forced-model warning.
- A corrected installed prompt permitted exactly the Buzz publication call.
  After the owner selected **Allow once**, Devin published the requested exact
  reply and Buzz rendered it at the requested reply destination. The packaged
  sibling `buzz` CLI took precedence over an unrelated installed Buzz CLI.
- The official Devin ACP child remained open after successful publication
  instead of returning `session/prompt`. The source now exposes a generic,
  default-off post-publication completion grace. Devin opts into 30 seconds
  through `KnownAcpRuntime`; the timer can signal only the exact publishing
  turn, the already-satisfied batch is never retried, and the cancelled session
  is invalidated before later work. The rebuilt installed app published the
  requested exact reply after **Allow once**; after 45 seconds the turn showed
  no working or permission state and the reply count remained one.
- The same live test found that a managed-agent restart could orphan the
  official CLI because `buzz-acp` and its ACP child use independent process
  groups. Generic Unix teardown now snapshots same-user live descendants before
  stopping the tracked harness and terminates their owned process groups first.
  A subprocess regression test proves the independent child is reaped. In the
  rebuilt installed app, a real Restart replaced harness PID 32354 and Devin
  PID 34505 with PIDs 37044 and 37045; both old processes were gone.
- A normal unlocked app relaunch restored the saved managed agent without a
  Play action. A later cold prompt exposed two availability boundaries: the
  first message paid for deferred Devin initialization, and one initialized
  process then stayed silent under the generic 15-minute idle allowance.
  Devin now opts out of deferred subprocess startup and receives a
  catalog-provided 120-second silence default while preserving explicit
  overrides. In the rebuilt installed app, Keychain unlock automatically
  restored the saved agent, started the official `devin acp` before any new
  message, and reported `agent_pool_ready` after 37 milliseconds. A clean
  managed-agent restart reaped both old processes, re-subscribed, and reported
  ready after 44 milliseconds. The top-level DM cold and warm probes completed
  their ACP waits in 4.017 and 4.047 seconds respectively, and each exact reply
  appeared once in the main timeline with no permission prompt, thread, or
  duplicate. Buzz did not auto-approve a request or select a persistent or
  bypass grant.
- On 2026-07-27, a second macOS-user context created a new Buzz identity and a
  private `~/.buzz-for-devin` nest owned only by that user. The first context's
  nest timestamp did not change. Onboarding reported the official Devin CLI
  authenticated and ready, rendered the white-background Devin icon, retained
  Devin as the default harness with `Default model`, and launched independent
  `buzz-acp` and `devin acp` processes. A newly owned agent published the exact
  DM reply `MFENNER_CONTEXT_OK`. Normal app quit removed the desktop process
  and all observed harness and Devin children. This proves the second
  context's own invocation and process isolation; cross-owner denial,
  allowlisting, workspace-marker boundaries, restart, and Cognition
  usage-attribution rows remain open.
- No MCP configuration or credential material was inspected or changed.

The complete patch was applied to a detached worktree at public `block/buzz`
commit `07d0265cfc21` and passed every component of `just ci` using shared
build caches. After upstream advanced by six commits, it was refreshed again
on 2026-07-26 at `c2a4ee711e48`. Two conflicts were reviewed explicitly:
runtime process detection now retains upstream's Linux
`buzz-desktop.bi` entry plus the fork's `Buzz for Devin` entry, and sidecar
bundling retains upstream's executable-mode behavior plus the fork's named
destination. Upstream's removal of the old Agent directory UI remains intact.

The refreshed tree passed locked metadata, formatting, Rust clippy for
`buzz-acp` and the complete Tauri crate, 603 `buzz-acp` unit plus 9 lifecycle
tests, 1,670 Tauri library tests plus 3 mixer diagnostics (14 external/real
Keychain tests intentionally ignored), 3,534 desktop frontend tests,
desktop/web TypeScript and production builds, and the touched web guards.
Root advisories and root/desktop bans, licenses, and sources still pass. The
desktop advisory gates retain the same documented no-safe-upgrade failures;
neither is represented as green.

Public upstream later advanced again to `871a3b377234`. The patch was applied
to a fresh detached worktree and four conflicts were resolved without changing
the development branch: upstream's modular managed-runtime architecture was
preserved; packaged-sidecar PATH precedence remained conditional on the
sidecar's presence; upstream's `modelSource` card resolver was extended with
the catalog model-control capability; and Unix-only executable-mode repair was
kept in sidecar bundling. The resolved tree has no merge markers or whitespace
errors and passes complete root, desktop, Tauri, web, and mobile `just ci`.
That includes 3,543 desktop frontend tests, 1,734 Tauri library tests with 14
intentional external/real-Keychain ignores, all 3 mixer diagnostics, and 685
mobile tests with one intentional skip.

Public upstream subsequently advanced to `63c62fcf3eb5`. The generic runtime
and permission changes were adapted to that architecture and committed locally
as `26ca733c` and `fff496e6`. The final series has a clean worktree and scope
audit and contains no fork branding, distribution, signing, dependency
manifest, or lockfile changes. All 614 `buzz-acp` unit tests, 9 lifecycle
integration tests, 1,811 Tauri library tests (14 intentional ignores), 3 mixer
diagnostics, and 3,642 desktop frontend tests pass. TypeScript, frontend
source guards, Rust formatting, and strict Clippy for both `buzz-acp` and the
complete Tauri crate also pass.

Public upstream then advanced to `7fc0cc82db4d9dced9c258bbe8b530164a832a77`.
The locally refreshed two-commit series passes all 614 `buzz-acp` unit tests,
all 9 lifecycle tests, 1,812 Tauri library tests with 14 intentional
external/real-Keychain ignores, all 3,644 desktop frontend tests, and all 21
tests in `onboarding-agent-defaults.spec.ts`. The frontend production build,
E2E build, Biome and source guards, Rust formatting, and strict Clippy for
`buzz-acp` and the full Tauri crate also pass. `cargo deny check` exits
successfully for the refreshed upstream dependency graph while still reporting
its inherited source and yanked-version warnings; the patch changes no
dependency manifest or lockfile. A redacted changed-file secret scan found no
credential-shaped material. Final review removed one production `expect()` from
avatar normalization; the safe branch and its focused regression test pass.

On 2026-07-26, `pnpm audit --audit-level=low` was rerun against the current
lockfile and reported no known vulnerabilities. A high-confidence scan of
every staged changed file found no credential-shaped literals, and
`git diff --cached --check` remained clean. Cognition's current official CLI
quickstart and command reference were also rechecked: the catalog installation
endpoints, `devin auth status`, `devin auth login`, `devin acp`, and the
documented precedence of `WINDSURF_API_KEY` over stored login credentials still
match the implementation. Three dependency-free release-config tests also
prove the isolated non-updating default, fail-closed partial updater
configuration, and paired key-plus-endpoint enablement.

A separate high-confidence scan covered every tracked and untracked changed
file and found no credential-shaped literals. Four representative production
log files under the fork's application-support directory were checked without
printing their contents; no high-confidence secret pattern was found.

Final review also removed persistent ACP permission choices from the UI and
from the harness selection path. Only one-shot allow or reject choices can be
submitted; no bypass or persistent grant is selected. The native Devin process
name is included in same-user crash recovery, and the independent-process-group
regression remains covered so a desktop crash or restart does not leave the
official CLI running.

The final local Apple Silicon source build also passed:

- Bundle identifier: `community.buzzfordevin.desktop`.
- Deep-link scheme: `buzz-for-devin`.
- Architecture: `arm64`.
- Main executable SHA-256:
  `23df661b2b2bae9933dc74439baedc8646e5c7886b541c56823c6fb8d9966d23`.
- Bundle-content manifest SHA-256:
  `11204fd22c8493a20e8cf72b6656d89d056d0d251b2b3a0439ad53e94f19b370`.
- The packaged frontend embeds `/runtime-icons/devin.svg`; the source and
  built SVGs are byte-identical and both contain the white background.
- Fork builds link manual updates and web downloads to
  `fenner888/BuzzforDevin`; ordinary upstream builds retain Block's release
  URLs.
- The bundle is unsigned as expected for a source build.
- A separate local Developer ID rehearsal signed every bundled executable, the
  app, and `Buzz for Devin_0.4.25_aarch64.dmg` with
  `Developer ID Application: Mark Fenner (Q7H78WYTAR)`. Strict code-signature,
  application-identity, and entitlement verification passed. The signed DMG
  SHA-256 was
  `84d1a126d14c5fb0df64ee93492adf97d5d6dc298d78dc941573e23d3b7bb788`.
  Gatekeeper then rejected it as `Unnotarized Developer ID`, and stapler
  reported no ticket, as expected without protected Apple notarization
  credentials. This artifact was not published.
- The isolated install, running-app refusal, upgrade, rollback, and recoverable
  uninstall lifecycle suite passed.
- Installation at `~/Applications/Buzz for Devin.app` preserved application
  data and Keychain entries, matched the verified binary hash, and relaunched
  from the stable path.
- The manual signed-canary workflow parses successfully, has read-only
  repository permissions, uses only `workflow_dispatch`, contains no
  publication command, and pins all three external actions to full commit SHAs
  verified against their official tags.
- The canary workflow runs the complete repository gate plus JavaScript and
  Rust dependency policy checks before importing any signing certificate. A
  failed Apple Silicon advisory check blocks by default. A protected
  environment reviewer may explicitly record acceptance of the documented
  no-safe-upgrade maintenance findings for that short-lived canary; the failed
  audit remains visible and is never relabeled as green.
- The `buzz-for-devin-release` GitHub environment now exists with a required
  reviewer. It contains no signing or notarization secrets, so the canary
  remains fail-closed.

The toolchain snapshot was Rust 1.95.0, Node 24.14.0, pnpm 11.4.0, macOS
26.5.1 on Apple Silicon, and Devin CLI 3000.2.17. `devin auth status` and
`devin acp --help` both returned success with their output suppressed where it
could contain account context.

## Open release gates

- Complete the live two-context authorization, workspace, restart, and usage
  attribution matrix. Context B's own identity, Nest, authenticated runtime,
  owned reply, and quit cleanup are proven; the cross-context rows remain open.
- Perform a clean-machine install and first-launch test.
- Export the validated Developer ID certificate to the protected GitHub
  environment and configure Apple notarization credentials. Local Developer ID
  signing is proven; notarization remains blocked.
- Configure the updater signing key and fork-owned HTTPS endpoint, then test
  update and rollback from signed builds.
- Resolve or explicitly review the inherited desktop GTK3, `audiopus_sys`,
  `mach`, `proc-macro-error`, and `rust-unic` maintenance advisories. Do not
  mark the desktop advisory gate green while it still fails.
- Follow the documented
  [upstream patch plan](buzz-for-devin-upstream-patch-plan.md) so generic
  runtime changes remain separate from fork branding and distribution work.
  The refreshed two-commit series satisfies this separation and is submitted
  as a draft; upstream review and merge remain open.
- Complete every
  [release checklist](buzz-for-devin-release-checklist.md) gate before
  publication.
- Obtain explicit approval before pushing, tagging, opening a pull request,
  signing, notarizing, publishing, or creating a public community.
