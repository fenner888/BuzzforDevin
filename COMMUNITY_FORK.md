# Buzz for Devin Community Fork

Buzz for Devin is a community-maintained derivative of
[`block/buzz`](https://github.com/block/buzz). It adds a first-class native
Devin ACP runtime and provides a reference community where members can bring
their own authenticated Devin agents.

## Status

- This is not an official Block release.
- This is not an official Cognition release.
- Native Devin runtime support is implemented and covered by focused and
  regression tests.
- Local proof is complete. A second macOS-user context has also proven its own
  isolated identity, Nest, authenticated Devin runtime, reply path, and process
  cleanup. The remaining live authorization/workspace matrix, notarized
  packaging, and upstream review are not yet complete.
- No public release is currently represented as production ready.

## Integration Boundary

The integration uses the official Devin CLI's native `devin acp` command. It
does not replace ACP with a custom protocol, proxy model traffic, or provide a
shared Cognition account.

Each user installs and authenticates Devin independently. The fork may detect
the CLI, explain how to install it, and verify authentication, but it must not
store or transmit the user's Cognition credentials.

## Data and Runtime Isolation

The release distribution will use its own product name, bundle identifier,
deep-link scheme, and application-support directory.

It must not:

- Replace or modify the user's official `devin` binary.
- Rewrite the user's Devin configuration.
- Copy authentication material into the repository or Buzz configuration.
- Expand workspace permissions without an explicit user action.
- Default an agent to responding to every community member.

The default invocation policy is `owner-only`. `Allowlist` and `anyone` remain
explicit, owner-controlled choices.

## Upstream Path

Generally useful changes should be developed as focused, reviewable commits
that can be proposed to `block/buzz`, including:

1. Native Devin runtime metadata and discovery.
2. `devin acp` launch defaults.
3. Authentication readiness checks.
4. Runtime icon and onboarding copy.
5. Unit and desktop integration tests.

Fork-only branding, installers, release workflows, and community defaults
remain separate from upstream-facing changes.

The proposed generic patch boundaries and fork-only exclusions are recorded in
[docs/buzz-for-devin-upstream-patch-plan.md](docs/buzz-for-devin-upstream-patch-plan.md).
Reviewer-ready upstream descriptions are drafted in
[docs/buzz-for-devin-upstream-pr-drafts.md](docs/buzz-for-devin-upstream-pr-drafts.md).

If upstream Buzz ships equivalent native Devin support, duplicate integration
logic should be removed from this fork.

## Distribution

The initial distribution target is a locally built macOS application installed
under `~/Applications`. It will use immutable source tags and clearly describe
what is built and installed.

The source-build distribution uses `Buzz for Devin`,
`community.buzzfordevin.desktop`, `buzz-for-devin://`, and the
`buzz-for-devin-desktop` Keychain service. Its `~/.buzz-for-devin` Nest and
`~/.local/bin/buzz-for-devin` convenience link are also isolated so it can
coexist with upstream Buzz.
See [docs/buzz-for-devin-macos.md](docs/buzz-for-devin-macos.md).
The signed release, clean-machine, updater, rollback, and publication gates are
defined in
[docs/buzz-for-devin-release-checklist.md](docs/buzz-for-devin-release-checklist.md).
The candidate evidence schema and public release-note draft live in
[docs/buzz-for-devin-validation-record-template.md](docs/buzz-for-devin-validation-record-template.md)
and
[docs/buzz-for-devin-release-notes-draft.md](docs/buzz-for-devin-release-notes-draft.md).

The Devin CLI must come from Cognition's official installation path. Buzz for
Devin will not redistribute a privately built or modified Devin executable.

Windows and Linux support are later milestones, not implied by the first
macOS release.

## Licensing and Names

Buzz remains available under the Apache License, Version 2.0. Cognition and
Devin names and marks belong to their respective owners.

All public documentation and releases must retain the community-project
disclaimer and avoid implying endorsement by Block or Cognition.
