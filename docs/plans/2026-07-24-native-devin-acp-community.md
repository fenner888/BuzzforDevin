# Native Devin ACP Community Plan

**Date:** 2026-07-24

**Status:** Foundation approved for development

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

The agent must start with a visible, user-selected workspace. A community
message must not silently widen filesystem access beyond that workspace.

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

### Phase 2: Local proof

- Build the desktop app locally.
- Detect the existing official Devin CLI.
- Create an owner-only agent.
- Run it in a disposable repository.
- Confirm streaming responses and tool activity.
- Confirm restart and session behavior.
- Confirm usage is charged to the authenticated user's account.

### Phase 3: Multi-user proof

- Test with two distinct Buzz identities.
- Verify each identity connects its own Devin account.
- Verify owner-only isolation.
- Verify allowlist behavior.
- Confirm one member cannot access another member's workspace or credentials.

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

### Phase 6: Optional cloud capabilities

Evaluate separately:

- Local-to-cloud `/handoff`
- Cloud session links and status cards
- Fusion selection
- Managed Devin fan-out
- Outposts
- Devin MCP or API integrations

None of these are part of the native local ACP MVP.

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
Mitigation: minimum-version tests, current documentation, and release
validation against the official CLI.

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
