# Buzz for Devin upstream pull-request drafts

These are review drafts only. The generic implementation is locally committed
on `agent/upstream-native-devin-acp`, but nothing has been pushed and no pull
request has been opened. Rebase the series on current `block/buzz`, resolve
documented drift, and replace every evidence placeholder before submission.

## PR 1: catalog-driven native runtime capabilities

### Draft title

`refactor(desktop): project ACP runtime capabilities from the Rust catalog`

### Draft summary

- Make `KnownAcpRuntime` the authority for runtime label, command, default
  arguments, underlying CLI, skills directory, authentication probe,
  installation guidance, icon, permission policy, and environment policy.
- Project catalog data through the existing Tauri discovery response.
- Remove duplicated runtime presentation decisions from React rendering.
- Preserve the behavior and metadata of every existing runtime.

### Non-goals

- No Devin runtime entry yet.
- No fork branding or distribution behavior.
- No second TypeScript runtime table.
- No runtime-specific checks in React rendering.

### Required evidence

- Catalog metadata tests for Claude, Codex, Goose, and Buzz Agent.
- Frontend projection and existing-runtime regression tests.
- Tauri tests and `just ci`.

## PR 2: add the official Devin CLI as a native ACP runtime

### Draft title

`feat(desktop): add Devin as a native ACP runtime`

### Draft summary

- Add runtime ID `devin`, label `Devin`, executable `devin`, and default
  argument `acp`.
- Add `.devin/skills`, `devin auth status`, and `devin auth login` metadata.
- Link installation help to Cognition's official Devin CLI documentation.
- Normalize a bare `devin` command to `devin acp`.
- Add the white-background Devin runtime icon and catalog-projected default
  avatar.
- Distinguish missing CLI, unauthenticated CLI, ready CLI, and ACP startup
  failure.
- Opt Devin into the generic, default-off exact-turn completion grace for the
  official ACP behavior where a visible publication can outlive
  `session/prompt`.

### Safety and non-goals

- Do not read, store, print, migrate, or modify Cognition credentials.
- Do not add dangerous permission or bypass flags.
- Do not claim model switching, Fusion, fan-out, Outposts, cloud handoff, or
  cloud Devin parity.
- Do not change existing runtime behavior.
- Keep default invocation owner-only.
- Never retry the triggering batch after its visible result was published.

### Required evidence

- Devin catalog metadata tests.
- `devin` to `devin acp` normalization tests.
- Authentication-readiness tests.
- Discovery/catalog exposure tests.
- Existing-runtime regression tests.
- Exact-turn and no-requeue post-publication recovery tests.
- Safe local `devin --version`, `devin auth status`, and `devin acp --help`
  smoke checks with authentication output suppressed.
- Focused frontend/Tauri tests and `just ci`.

## PR 3: make managed ACP permission and environment policy catalog-driven

### Draft title

`fix(acp): enforce catalog-declared managed runtime policy`

### Draft summary

- Carry catalog-declared environment removals and enforced environment values
  to runtime probes, visible login, and managed process launch.
- Let the ACP harness receive catalog-projected automatic and interactive
  permission policy.
- Disable automatic permission approval for Devin and require an encrypted
  owner-signed, exact-turn **Allow once** or **Deny** decision.
- Preserve the historical auto-approval behavior of existing managed runtimes.

### Security review focus

- Environment precedence after user-configured values.
- No environment-value logging.
- Fail-closed permission selection.
- Existing-runtime regression coverage.
- Clear documentation that workspace mapping is not an OS sandbox.

### Required evidence

- Permission-mode unit tests.
- Runtime environment-policy tests.
- Readiness and visible-login environment tests.
- Existing-runtime regression tests.
- Rust formatting, Clippy, Tauri tests, and `just ci`.

## PR 4: support downstream desktop identity without changing Buzz defaults

### Draft title

`refactor(desktop): make downstream app identity build-configurable`

### Draft summary

- Allow build-time app name, deep-link scheme, Keychain service, Nest
  directory, and bundled CLI-link name.
- Allow the web build to receive matching app name, deep-link, release-page,
  and release-API values.
- Preserve executable bits when bundling sidecars.
- Keep every unset/default value identical to upstream Buzz.

### Fork-only exclusions

- No `Buzz for Devin` plist or product constants.
- No fork bundle identifier or release URL.
- No fork build/install/rollback/uninstall scripts.
- No signing, notarization, updater, or publication workflow.
- No public-community defaults or invitation policy.

### Required evidence

- Default Buzz identity regression tests.
- Alternate-identity build tests.
- Deep-link parsing tests for both the upstream default and alternate scheme.
- Frontend build, Tauri build/tests, and `just ci`.

## Separate dependency-maintenance PR

### Draft title

`chore(deps): select patched JavaScript and Rust transitive releases`

### Draft summary

- Constrain existing transitive JavaScript selections to `linkify-it` 5.0.2,
  `markdown-it` 14.3.0, and `@babel/core` 7.29.7.
- Replace yanked lockfile selections with compatible `spin` 0.9.9, `spin`
  0.10.1, and `nostr` 0.44.5.
- Keep this maintenance independent of Devin capability.

### Required evidence

- Official registry and repository verification for each selected package.
- `pnpm why` showing one resolved patched version of each JavaScript package.
- `pnpm audit --audit-level=low`.
- Root and desktop-workspace `cargo deny check advisories`.
- Root and desktop-workspace `cargo deny check bans licenses sources`.
- Locked Rust metadata and `just ci`.

## Submission order

1. Catalog-driven runtime capabilities.
2. Native Devin runtime.
3. Managed runtime policy, split further if reviewers prefer.
4. Generic downstream identity.
5. Independent dependency maintenance.

Each proposal must be understandable and testable on its own. Do not stack fork
branding or distribution files onto the generic upstream series.
