# Buzz for Devin

**Bring your own Devin. Build together.**

Buzz for Devin is a community-maintained distribution of
[Buzz](https://github.com/block/buzz) that adds
[Devin for Terminal](https://docs.devin.ai/work-with-devin/devin-cli) as a
first-class Agent Client Protocol (ACP) runtime.

It is not a shared Devin account, a model proxy, or a replacement for
Cognition's products. Each community member connects the Devin account,
workspace, permissions, and usage plan they already control.

This project is not an official Block or Cognition release.

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
