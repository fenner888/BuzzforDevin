# Native Devin ACP Community Plan

**Date:** 2026-07-24

**Status:** Native runtime implementation, automated validation, documentation,
unsigned macOS packaging, one installed live publication, automatic relaunch,
and rebuilt restart-tree proof are complete. Cold first-turn latency
investigation, two-context isolation, signed clean-machine release validation,
publication, and upstream submission remain open.

**Repository:** `fenner888/BuzzforDevin`

**Upstream:** `block/buzz`

## Decision Summary

Build a community-maintained Buzz distribution that recognizes Devin for
Terminal as a native ACP runtime.

The first community will let each member connect their own Devin account and
workspace. The project will not operate a central Devin account or pay for
community-wide agent usage.

Start from current upstream Buzz, preserve its history, and keep the generic
runtime work suitable for an upstream pull request.

## Product Contract

Buzz for Devin provides:

- Native discovery of an installed Devin CLI.
- Clear authentication readiness.
- A guided path to create a Devin-backed Buzz agent.
- An explicit local workspace boundary.
- Owner-controlled invocation policy.
- Community channels where humans and independently owned agents participate.

The user provides:

- Their Cognition account.
- Their Devin subscription, quota, and credits.
- Their local machine or approved execution environment.
- Their repository permissions.
- Their Devin Skills and Rules.
- Approval for any broader invocation policy.

## Technical Baseline

The currently verified local CLI is:

```text
devin 3000.2.17
```

It exposes:

```bash
devin acp
devin auth login
devin auth status
devin models
```

`devin acp` runs an ACP server over standard input and output. Buzz's managed
agent harness already launches ACP runtimes and connects them to community
channels.

## Implementation Snapshot

As of 2026-07-26, Phase 1 is implemented in the fork:

- `KnownAcpRuntime` is the capability authority for the `devin` runtime.
- Bare `devin` commands normalize to `devin acp`.
- Readiness distinguishes missing CLI, unauthenticated CLI, authenticated
  readiness, and ACP startup failure.
- Buzz projects the Rust catalog into the frontend without a duplicate
  TypeScript runtime table or React runtime checks.
- The catalog and profile surfaces use the white-background Devin icon.
- Persona-only cards use the catalog icon before an agent instance exists, so
  a stopped/unlaunched Devin persona does not fall back to initials. This was
  verified in the installed unsigned macOS app without pressing Play.
- Agent cards project the catalog's model-selection capability. Devin displays
  `Runtime default`; runtimes that support Buzz model configuration retain the
  configured/default model label.
- The same catalog declares that Devin owns its bootstrap model selection, so
  Buzz removes its generic `BUZZ_ACP_MODEL` value for Devin instead of passing
  an unrelated workspace default. Focused tests lock existing Claude, Codex,
  Goose, Buzz Agent, and custom-runtime launch behavior unchanged.
- Packaged release builds resolve bundled sidecars beside the running desktop
  executable before consulting any source-checkout target directory. Debug
  builds retain workspace-first resolution. This prevents an installed app on
  a developer Mac from silently launching a stale `target/debug/buzz-acp`.
- Managed Devin processes retain permission mode `default`, remove the
  legacy `WINDSURF_API_KEY` environment variable without reading it, and
  default to owner-only invocation with one worker.
- Fork release builds isolate their Nest and bundled CLI convenience link as
  `~/.buzz-for-devin` and `~/.local/bin/buzz-for-devin`, without importing or
  falling back to upstream `~/.buzz`.
- Devin's catalog policy disables permission auto-approval, enables the
  owner-consent bridge, and enforces `default` mode. ACP
  `session/request_permission` requests surface exact per-request **Allow
  once** and **Deny** actions when the runtime offers the corresponding
  one-shot choices. Buzz returns only the exact one-shot option selected by
  the owner; that option must belong to the current request, and the encrypted
  owner-signed decision must match the exact channel, turn, and request id.
  Stale, unknown, absent, persistent, or timed-out decisions fail closed. Buzz
  never selects a persistent grant or bypass mode.
- Newly created Devin agents default to one worker. Existing saved agents keep
  their stored worker count because the legacy record format cannot
  distinguish an old default from an explicit user choice.

Focused Rust, frontend, and desktop regression tests pass. Local ACP startup,
session creation, prompt completion, tool activity, file-write behavior, and
restart behavior have been exercised with the official CLI and a disposable
repository.

The signed-in Cognition CLI usage surface now shows nonzero current-cycle CLI
usage attributed to the locally authenticated user after the official-CLI
smoke path. No authentication settings, tokens, or credentials were inspected,
and the private account identifier is not recorded. The installed app now
proves the packaged desktop launches its bundled `buzz-acp`, which launches
the official `devin acp`. The first post-install prompt was sent to a stale
same-name development-agent DM; the installed agent has a distinct public
identity by design. Opening the DM from the installed agent profile created
the correct membership, delivered a prompt, and initialized the official ACP
child without the earlier forced-model warning. A corrected installed prompt
then permitted exactly the Buzz publication call. After an explicit
per-request approval, Devin published the requested exact reply through the
packaged sibling CLI, and Buzz displayed it at the requested reply destination.
This proves installed message delivery and cross-install CLI selection.

The official Devin ACP process remained open after the publication instead of
returning `session/prompt`. A catalog-enabled, generic harness compatibility
recovery now waits 30 seconds, targets only the exact publishing turn, drops
the already-satisfied batch, rotates the cancelled session, and records a
successful end turn. It defaults off for all runtimes; only Devin opts in. In
the rebuilt installed app, the owner selected **Allow once**, Devin published
the requested exact top-level reply, and a check after 45 seconds found one
publication with no working or permission state remaining.

That proof exposed a separate generic restart defect: desktop teardown
signalled only the `buzz-acp` process group, while ACP runtimes intentionally
launch their CLI in an independent process group. The old Devin child
therefore survived one managed-agent restart. Teardown now snapshots
same-user descendants while the tracked harness is live and terminates their
owned process groups before the harness. A subprocess regression test proves
an independently grouped ACP child is reaped. The rebuilt installed app then
proved the same behavior with the official CLI: Restart replaced harness PID
32354 and Devin PID 34505 with PIDs 37044 and 37045, and both old processes
were gone. A normal unlocked app relaunch also restored the saved managed
agent without requiring Play.

A separate cold-turn investigation found two latency boundaries. Desktop
requested deferred ACP subprocess startup for every managed runtime, so the
first accepted message also paid roughly 40 seconds for the official Devin
process and initialize handshake. After initialization, one turn produced no
ACP stdout or network-byte progress and remained silent under the generic
15-minute idle allowance until a manual restart; the same queued request then
succeeded in under a minute.

The runtime catalog now declares whether a desktop-requested lazy harness may
defer its ACP subprocess and may supply a runtime-specific default idle
timeout. Devin initializes its single worker when the managed agent starts and
defaults to a 120-second silence bound only when the record, inherited
environment, and merged user environment provide no override. Existing
runtimes preserve deferred startup and the harness idle default. Content-free
timing events identify pool initialization, prompt dispatch, first ACP
activity, and prompt completion. Focused and full Rust suites, desktop
regressions, frontend catalog/readiness tests, formatting, clippy, typecheck,
and frontend lint guards pass. The rebuilt unsigned application bundle also
passes the fork package verifier. After the isolated Keychain item was
unlocked, the installed app automatically restored the saved managed agent,
applied the 120-second default, launched the packaged harness and official
`devin acp` without a Play action or incoming message, and reported
`agent_pool_ready` after 37 milliseconds. A clean managed-agent restart then
reaped both old processes, re-subscribed, and reported ready after 44
milliseconds. In the live agent profile's top-level DM, the cold probe was
dispatched about 2.4 seconds after send and completed in 4.017 seconds; the
immediately following warm probe was dispatched after about 1.1 seconds and
completed in 4.047 seconds. Both exact replies appeared once in the main DM
timeline with the white-background Devin avatar and no thread. The installed
cold/warm policy check is complete.

Buzz still leaves Devin in its safe default permission mode: the owner can
choose a one-time, session, or workspace-scoped grant offered by Devin, but
Buzz does not silently persist an approval or select bypass mode. No MCP
configuration or credential material was inspected or changed. The
selected-workspace mapping has been canonicalized and adversarially tested for
parent segments and symlink targets. This mapping is not represented as an OS
sandbox.

## Proposed Architecture

```text
Buzz desktop
  |
  +-- managed agent record
        |
        +-- Buzz agent identity and channel membership
        +-- workspace root
        +-- respond-to policy
        +-- buzz-acp supervisor
              |
              +-- devin acp
                    |
                    +-- user's Devin authentication
                    +-- user's Devin quota
                    +-- user's selected workspace
```

Buzz owns community messaging and agent lifecycle. Devin owns reasoning,
coding tools, local execution, and Cognition account usage.

## Anticipated Runtime Changes

### Runtime catalog

Add a `KnownAcpRuntime` entry for Devin with:

- ID: `devin`
- Label: `Devin`
- Command: `devin`
- Default argument: `acp`
- Underlying CLI: `devin`
- Skill directory: `.devin/skills`
- Authentication probe: `devin auth status`
- Official installation documentation
- Devin runtime icon

Do not claim ACP model switching until the capability is verified through the
ACP handshake and tested in Buzz.

### Command normalization

Teach the default-argument resolver that `devin` launches with `acp` when no
explicit arguments are configured.

Do not pass `--permission-mode dangerous`. The initial integration must retain
Devin's safe default permission behavior unless a user explicitly changes it
outside the fork's defaults.

### Readiness

The onboarding and Doctor surfaces should distinguish:

1. Devin CLI missing.
2. Devin CLI present but unauthenticated.
3. Devin CLI authenticated and ready.
4. Devin ACP startup failed.

Errors shown to the user must not include credentials or sensitive command
environment values.

### Workspace

The ACP harness starts in Buzz's persistent Nest. The active community's
validated, user-selected Repos Directory is exposed there as `REPOS`; path
segments and symlink targets are canonicalized before the mapping is applied,
and a target that is the Nest or one of its ancestors is rejected.

The Devin runtime retains the
[official CLI's normal permission behavior](https://docs.devin.ai/cli/reference/permissions).
Buzz does not automatically select bypass mode, add broad Read or Write grants,
or modify project or user Devin configuration. A community message must not
silently widen filesystem access beyond the workspace and permission scopes the
owner chose. Buzz projects ACP permission requests into its owner-only activity
surface. The owner can explicitly select an exact one-shot allow or reject
option offered by the runtime. Buzz validates the option against that live
request before returning it; unknown or persistent options, timeout, stale
controls, and unattended turns fail closed. Buzz does not choose persistent
approval or bypass.

Cognition's optional
[`--sandbox` flag](https://docs.devin.ai/cli/sandbox) adds OS-level isolation
but is currently a research preview with platform-specific prerequisites. It
is not forced by this integration. Any future opt-in sandbox control requires
its own product, compatibility, and security review.

The first functional test uses a disposable Git repository containing no
credentials, personal data, or production configuration.

## Response and Cost Controls

Buzz currently supports three invocation policies:

- `owner-only`
- `allowlist`
- `anyone`

The Devin runtime defaults to `owner-only`.

The UI should explain that:

- The agent owner pays for Devin usage.
- `Allowlist` lets named community identities invoke the agent.
- `Anyone` may allow every eligible community member to consume the owner's
  quota and operate within the configured workspace.

No project default may silently select `anyone`.

## Community Design

The reference community is **Devin Builders**.

Its purpose is to help users:

- Learn Devin through real workflows.
- Share Skills and Rules.
- Compare local, cloud, and Outposts execution accurately.
- Show what they are building.
- Get help with setup and debugging.
- Discuss secure agent operation.
- Improve this integration.

The community must remain useful without a connected agent. Agent
participation enhances the workspace but does not replace human discussion.

## Delivery Phases

### Phase 0: Foundation

- Create the GitHub fork.
- Create the local checkout.
- Define product purpose and boundaries.
- Define community-fork policy.
- Record implementation and validation plan.

### Phase 1: Native runtime

- Add Devin runtime metadata.
- Add command normalization.
- Add authentication readiness.
- Add icon and UI copy.
- Add focused unit tests.

Status: implemented and validated in the development build.

### Phase 2: Local proof

- Build the desktop app locally.
- Detect the existing official Devin CLI.
- Create an owner-only agent.
- Run it in a disposable repository.
- Confirm streaming responses and tool activity.
- Confirm restart and session behavior.
- Confirm usage is charged to the authenticated user's account.

Status: complete. CLI discovery, authentication readiness, one-worker ACP
startup, session creation, safe tool activity, disposable-repository writes,
restart behavior, canonicalized selected-workspace mapping, and signed-in
Cognition CLI usage attribution are proven. Packaged sidecar selection,
current-agent DM membership, and prompt delivery to the official CLI are also
proven. A corrected installed test received explicit one-time permission and
published the exact requested reply through the packaged sibling Buzz CLI.
After 45 seconds the exact turn was closed and the reply remained single. The
newest rebuilt app also automatically restored the saved managed agent after a
normal unlocked relaunch, and a real Restart reaped the old independently
grouped Devin CLI before starting the replacement process tree. Installed
cold/warm verification proved the catalog-driven eager-start and
bounded-silence policy: the restored and restarted pools initialized before a
message was sent, and consecutive top-level DM probes completed in about four
seconds with one reply each in the main timeline. A later Welcome-thread test
showed that Buzz displayed Devin's session/workspace approval choices but
offered only **Allow once** and **Deny** actions, so ordinary
`buzz messages send` publication prompted on every turn. Exact one-shot option
selection with live-request validation is now implemented and covered by the
focused and broader test suites; no option is selected automatically.

The installed-app message-location check also established two distinct rules.
A top-level human message in a regular channel intentionally receives the
agent's ordinary response in a thread rooted at that message. A top-level DM
response belongs in the DM's main timeline. The previous generic prompt only
omitted `--reply-to` for a top-level DM; it did not explicitly tell the ACP
agent to publish without that flag. Devin therefore chose a threaded reply.
The runtime-neutral prompt now supplies the explicit top-level DM publication
instruction while preserving existing channel-thread and DM-thread behavior.
Two rebuilt installed-app turns confirmed that top-level DM answers remain in
the main timeline.

### Phase 3: Multi-user proof

- Test with two distinct Buzz identities in separate OS-user credential
  contexts (separate machines or separate macOS user accounts).
- Verify each OS-user context connects its own Devin account. Switching only a
  Buzz identity within one OS login is not a separate Devin authentication
  context.
- Verify owner-only isolation.
- Verify allowlist behavior.
- Confirm one member cannot access another member's workspace or credentials.

Status: automated author-gate coverage passes for owner-only, allowlist,
sibling, stranger, and fail-closed direct-message cases. A second macOS-user
context has created its own Buzz identity and private Nest, detected its own
authenticated Devin CLI, launched independent runtime processes, published an
owned DM reply, and exited without leaving those processes behind. This is
partial live evidence, not completion of the matrix. Cross-owner denial,
allowlist and revocation, direct-message admission, workspace-marker
boundaries, restart, and account attribution remain open and are defined in
[the multi-user validation runbook](../buzz-for-devin-multi-user-validation.md).

### Phase 4: Community beta

- Create the Devin Builders community.
- Publish onboarding and troubleshooting guides.
- Invite a small group of Devin users.
- Gather ACP, permission, usability, and cost feedback.

### Phase 5: Upstream and release

- Submit generic native Devin support to `block/buzz`.
- Keep fork-only branding and distribution separate.
- Tag an immutable community release.
- Publish a clear source-build installer and uninstall path.

Status: source-build identity isolation plus recoverable macOS build, install,
upgrade, rollback, and uninstall scripts are implemented. The generic native
runtime and owner-consent work is separated from fork branding in two commits
and submitted as draft
[`block/buzz` PR #3072](https://github.com/block/buzz/pull/3072). A reviewed
refresh based on public upstream `7fc0cc82` is now the draft head; upstream
review remains open. Clean-machine proof, immutable tagging, notarization,
updater setup, and publication remain open. The current security and release
audit is recorded in
[the security review](../buzz-for-devin-security-review.md).

### Phase 6: Optional cloud capabilities

Evaluate separately:

- Local-to-cloud `/handoff`
- Cloud session links and status cards
- Fusion selection
- Managed Devin fan-out
- Outposts
- Devin MCP or API integrations

None of these are part of the native local ACP MVP.

## Later Bonus Track: Hermes

After the Phase 1–5 release and upstream-readiness gates are complete, evaluate
Hermes as a separate optional agent runtime or bridge. That work must begin
with an architecture and credential-boundary review; it must not reuse,
inspect, migrate, or modify existing Hermes authentication or configuration.
Hermes support is not a release blocker for native Devin ACP support and is not
included in current completion percentages.

## Acceptance Criteria

The MVP is complete only when:

- A fresh supported machine can build the app from an immutable tag.
- The app detects an official Devin CLI without modifying it.
- Authentication status is accurate.
- `devin acp` starts through the Buzz harness.
- A user can select a disposable workspace.
- The agent responds in the selected community channel.
- Owner-only behavior blocks other identities.
- Allowlist behavior permits only configured identities.
- Restarting the app restores the expected agent configuration.
- Logs contain no Cognition credentials.
- Error states explain the next action.
- Tests cover discovery, default arguments, readiness, and response policy.
- The README clearly states that the project is unofficial.

## Security Review Checklist

Before a public beta:

- Review every process-spawn argument and environment variable.
- Confirm credentials stay in Devin's authentication storage.
- Confirm logs redact command environment and auth material.
- Confirm workspace selection cannot be bypassed by path traversal.
- Test symlink behavior at workspace boundaries.
- Test owner-only and allowlist enforcement with separate identities.
- Confirm no default uses `dangerous` permission mode.
- Run dependency and secret scans.
- Review the authorization matrix for community and agent operations.

## Known Risks

### Credit abuse

Another member could consume the owner's quota if invocation is too broad.
Mitigation: owner-only default, explicit warnings, and allowlist testing.

### Workspace exposure

A community prompt could ask an agent to inspect sensitive files.
Mitigation: visible workspace selection, safe permissions, disposable testing,
and no automatic access expansion.

### Product confusion

Users may assume the fork is an official Cognition product or that local ACP
equals cloud Devin.
Mitigation: persistent community-project disclaimer and precise onboarding.

### Runtime drift

The Devin CLI may change ACP behavior or authentication commands.
Mitigation: catalog and argument-normalization tests, safe release-time CLI
smoke checks, current documentation, and validation against the official CLI.

### Fork maintenance

Long-lived divergence from Buzz would increase cost and reduce trust.
Mitigation: focused upstream PRs and removal of duplicate code after merges.

## Intentional Non-Changes

The foundation phase does not:

- Modify Buzz runtime code.
- Change the relay.
- Create a production community.
- Install another Devin CLI.
- Change the user's Devin authentication.
- Change the user's existing Buzz or Hermes installations.
- Enable public invocation.
- Publish a release.
