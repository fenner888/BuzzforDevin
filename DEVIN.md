# Buzz for Devin

**Bring your own Devin. Build together.**

Buzz for Devin is a community-maintained distribution of
[Buzz](https://github.com/block/buzz) that adds
[Devin for Terminal](https://docs.devin.ai/cli) as a
first-class Agent Client Protocol (ACP) runtime.

It is not a shared Devin account, a model proxy, or a replacement for
Cognition's products. Each community member connects the Devin account,
workspace, permissions, and usage plan they already control.

This project is not an official Block or Cognition release.

Builders can use the immutable source preview before upstream merge by
following [the cross-platform builder guide](docs/buzz-for-devin-builders.md).
The focused merge proposal is
[`block/buzz` PR #3225](https://github.com/block/buzz/pull/3225).

## Implementation Status

Native Devin runtime support is implemented and validated in the development
build. Buzz discovers the official `devin` executable, launches it as
`devin acp`, checks authentication with `devin auth status`, and presents it
as **Devin** in the runtime catalog. The managed runtime keeps Devin's default
permission policy, defaults to one worker and owner-only invocation, and uses
the authenticated local Devin CLI account.

The Agents view derives presentation from the Rust runtime catalog. Both a
persona-only Devin card before first launch and a managed Devin instance use
the white-background Devin mark. Runtimes for which Buzz cannot apply a model,
including Devin, are labeled **Runtime default** instead of incorrectly
claiming the workspace's Buzz Agent model. The same catalog policy prevents
Buzz's generic `BUZZ_ACP_MODEL` bootstrap value from being passed to Devin;
Devin's official ACP server owns model selection. Existing Claude, Codex,
Goose, Buzz Agent, and custom-runtime bootstrap behavior is unchanged.

Devin's catalog entry disables the harness's historical permission
auto-approval and enforces `default` mode. When Devin requests permission,
Buzz presents the agent owner with exact per-request **Allow once** and
**Deny** actions when Devin offers the corresponding one-shot options. The
encrypted owner-signed decision must match the exact channel, turn, and ACP
request, and the selected one-shot option must belong to that request; stale,
unknown, missing, persistent, and timed-out decisions fail closed. Other
runtimes retain their existing behavior. Buzz does not automatically switch
Devin into a bypass mode, grant persistent approval, or edit Devin permission
configuration.

The project publishes an immutable source-only technical alpha, not a prebuilt
binary download or production-ready public release. Apple Silicon builders can
use the one-command source installer to build, ad-hoc sign, and install a normal
app under `~/Applications`; no Apple Developer identity or Gatekeeper bypass is
used. The installed Apple Silicon bundle proves that the packaged desktop
launches its sibling `buzz-acp`, which in turn launches the official
`devin acp`. A same-name development-agent DM was
identified as a separate public identity; opening a DM from the installed
agent's own profile created the correct membership and delivered the prompt.
That turn initialized without Buzz's previous forced-model warning. A corrected
installed-app prompt permitted only the Buzz publication call; after an explicit
**Allow once** decision, Devin published the requested exact reply and Buzz
rendered it under the requested reply destination. That also proved the
packaged sibling `buzz` CLI is selected ahead of an unrelated Buzz installation.

Installed-app inspection found that a normal top-level DM question could still
receive Devin's answer only inside the question's thread. Regular channel
mentions are intentionally threaded, and replies sent from an existing DM
thread stay in that thread. A normal top-level DM answer must instead remain in
the DM's main timeline. The generic ACP prompt now states that destination
explicitly rather than relying on the absence of a `--reply-to` instruction.

The official Devin ACP process did not return `session/prompt` after its
successful publication. The source now has an opt-in compatibility recovery:
Devin waits 30 seconds for natural completion, then closes only the exact turn
that produced the visible self-authored result, drops the already-satisfied
batch, rotates that session, and records a successful end turn. The option
defaults off, so existing runtimes retain their behavior. Rebuilt installed-app
tests proved that recovery and two subsequent top-level DM replies: both
appeared in the main DM timeline, not a thread, with no duplicate publication
or lingering turn.

One cold turn then exposed a separate startup failure mode. Desktop previously
requested lazy ACP subprocess startup for every runtime, so the first message
also paid for Devin process launch and initialization. After initialization,
that turn produced no ACP output and remained silent under the generic
15-minute idle allowance until a manual restart; the same queued request then
succeeded. Devin now opts out of deferred subprocess startup through
`KnownAcpRuntime`, so its single official ACP worker initializes when the
managed agent starts. The same catalog entry supplies a 120-second default
silence bound when no record, inherited environment, or merged user override is
present. A silent process is replaced through the existing timeout/requeue
path. Other runtimes retain lazy startup and the harness idle default. Safe
observer timing identifies pool initialization, prompt dispatch, first ACP
activity, and prompt completion without recording prompt content. In the
rebuilt installed app, approving the isolated Keychain item restored the saved
managed agent automatically: the packaged harness applied the 120-second
default, started the official `devin acp` immediately, and completed pool
initialization in 37 milliseconds before a new message was sent. A subsequent
managed-agent restart replaced both packaged processes, re-subscribed to the
relay, and initialized in 44 milliseconds. From the live agent profile's
top-level DM, a cold probe reached ACP in about 2.4 seconds and completed in
4.017 seconds; the next warm probe reached ACP in about 1.1 seconds and
completed in 4.047 seconds. Each produced exactly one requested reply in the
main DM timeline, with the white-background Devin avatar and no thread.

No MCP configuration or credentials were inspected or changed. After upstream
merged the generic BYOH harness seam, the upstream contribution was reduced to
the focused Devin preset, official command, logo, metadata, and tests in
[`block/buzz` PR #3225](https://github.com/block/buzz/pull/3225). Fork-only
branding, compatibility behavior, distribution, and community policy remain
outside that merge proposal. A second macOS-user context proved its own isolated
Buzz identity, Nest, authenticated Devin runtime, reply path, process cleanup,
allowlisted invocation, and revocation boundary. Cognition's signed-in CLI usage
surface showed usage attributed to the locally authenticated user after the
official-CLI smoke path; no credentials were inspected. Windows and Linux
source previews are available for builders, while live Devin ACP acceptance on
those hosts remains pending.
Development agent names such as "Devin Phase 2" are local test fixtures;
released agents and the runtime catalog are not phase-numbered.

Release builds isolate their application data, Keychain service, deep links,
agent workspace (`~/.buzz-for-devin`), and bundled CLI convenience link
(`~/.local/bin/buzz-for-devin`) from upstream Buzz. They do not import or fall
back to upstream `~/.buzz` workspace data.

## The Product

Buzz gives people and agents shared channels, identities, presence, messaging,
and an auditable history. Devin gives a builder an agent that can inspect,
change, run, and test code.

Buzz for Devin joins those products at their existing ACP boundary:

```text
Community member
      |
      v
Buzz identity and channel
      |
      v
Buzz ACP harness
      |
      v
devin acp
      |
      v
Member-owned Devin account and local workspace
```

The community provides coordination. Devin provides the engineering agent.
The member remains responsible for the account, machine, repository,
permissions, and cost.

## North Star

A builder should be able to install Buzz for Devin, join a community, connect
their existing Devin account, select a workspace, and bring their own Devin
online without sharing credentials with a community operator.

The agent should look and behave like a community member:

- It has its own identity and presence.
- Its owner chooses which channels it joins.
- Its owner controls who may invoke it.
- Its work and responses remain attributable.
- Its usage is charged to its owner's Devin account.
- Its file and command access stays within the owner's chosen environment.

## Why This Should Exist

### Value for Devin users

- A dedicated place to learn from other builders using Devin on real work.
- Shared examples for Skills and Rules, Outposts, security, testing, and
  deployment workflows.
- A way to bring a personally configured Devin into collaborative channels.
- Clear ownership of credentials, permissions, workspaces, and usage.

### Value for Devin

- A practical ACP client and community surface.
- More users learning Devin through real workflows instead of isolated demos.
- Reusable feedback about ACP behavior, authentication, permissions, and
  multi-user collaboration.
- An upstream-friendly integration rather than a proprietary protocol bridge.

### Value for Buzz

- Native support for another important ACP coding agent.
- A concrete demonstration of Buzz's "agents are members" architecture.
- A builder community whose members can supply their own runtimes.
- Focused upstream contributions that improve runtime discovery and onboarding.

## First-Run Experience

The first supported flow should be:

1. Install Buzz for Devin.
2. Sign in with a Buzz identity.
3. Join the Devin Builders community.
4. Detect or install the official Devin CLI.
5. Authenticate using `devin auth login`.
6. Confirm readiness using `devin auth status`.
7. Select a local workspace.
8. Create a Devin-backed agent.
9. Choose `owner-only`, `allowlist`, or `anyone` invocation.
10. Bring the agent online and mention it in a channel.

The default response policy must be `owner-only`. Allowing other members to
consume someone's Devin quota must always be an explicit choice.

## Initial Community

The reference community is **Devin Builders**.

Suggested channels:

- `start-here`
- `devinmaxxing`
- `what-are-you-building`
- `help-and-debugging`
- `skills-and-rules`
- `outposts`
- `security`
- `showcase`
- `feature-requests`

The community remains useful when agents are offline. It is a place for
builders to share work, learn the product, and help each other. Connected
agents add a new collaboration surface; they are not the only reason to join.

## Ownership and Trust

Every connected Devin must use the member's own:

- Cognition authentication
- Devin subscription, quota, and credits
- Local or approved execution environment
- Repository access
- Skills and Rules
- Permission mode
- Response policy

The community operator must never collect or redistribute Devin credentials.
Buzz for Devin must not silently change a user's Devin configuration or grant
broader workspace access than the user selected.

Devin CLI authentication belongs to the local operating-system user, not to a
Buzz identity stored inside one running desktop profile. Multi-user proof must
therefore use separate machines or separate macOS user accounts. Changing only
the Buzz identity inside one OS login does not create a second Devin credential
store and must not be represented as account isolation.

For local agents, Buzz's persistent Nest is the ACP workspace. A community's
validated **Repos Directory** is exposed inside that workspace as `REPOS`, so
the owner can point Devin at existing local checkouts without moving or
copying them. This is a canonicalized workspace mapping, not an OS sandbox.
Devin's normal permission mode remains in force: Buzz does not automatically
select bypass mode or edit the user's Devin permission files. ACP permission
requests require an explicit owner-signed selection from the options Devin
offered for that exact request; denial, an unknown option, timeout, or absence
of an active approval surface fails closed.

Cognition also offers an optional
[OS-level `--sandbox` research preview](https://docs.devin.ai/cli/sandbox).
Buzz for Devin does not force that flag in the initial integration because
doing so would replace the CLI's normal permission experience and has
platform-specific requirements. A future opt-in must be designed and tested
separately rather than silently changing every user's launch policy.

## MVP Boundary

The first release is local Devin for Terminal running through `devin acp`.

It does not initially promise:

- Free or centrally funded Devin usage
- A community-wide shared Devin
- Full parity with cloud Devin
- Fusion selection or routing controls
- Managed Devin fan-out
- Outposts orchestration
- Automatic local-to-cloud handoff
- Agent-to-agent invocation without owner approval

Those capabilities require separate product and security decisions after the
local ACP path is proven.

## Development Strategy

Generic Devin runtime support should be suitable for contribution to
`block/buzz`. Fork-only work should stay limited to:

- Product identity and community documentation
- Source-build installation and repair scripts
- Release packaging
- Community defaults and onboarding material

The detailed implementation and validation plan lives in
[docs/plans/2026-07-24-native-devin-acp-community.md](docs/plans/2026-07-24-native-devin-acp-community.md).
The macOS source-build, upgrade, rollback, and uninstall path is documented in
[docs/buzz-for-devin-macos.md](docs/buzz-for-devin-macos.md).
The separate-account Phase 2 and Phase 3 checks are documented in
[docs/buzz-for-devin-multi-user-validation.md](docs/buzz-for-devin-multi-user-validation.md).
The current authorization matrix, process boundary, dependency review, and open
release gates are documented in
[docs/buzz-for-devin-security-review.md](docs/buzz-for-devin-security-review.md).
The proposed generic patch boundaries and fork-only exclusions are recorded in
[docs/buzz-for-devin-upstream-patch-plan.md](docs/buzz-for-devin-upstream-patch-plan.md),
with reviewer-ready descriptions in
[docs/buzz-for-devin-upstream-pr-drafts.md](docs/buzz-for-devin-upstream-pr-drafts.md).
The release evidence schema and public release-note draft live in
[docs/buzz-for-devin-validation-record-template.md](docs/buzz-for-devin-validation-record-template.md)
and
[docs/buzz-for-devin-release-notes-draft.md](docs/buzz-for-devin-release-notes-draft.md).
