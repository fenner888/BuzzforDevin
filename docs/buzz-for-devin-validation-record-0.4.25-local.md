# Buzz for Devin 0.4.25 local validation record

This is a non-release local rehearsal record. It deliberately retains
`not run` and `fail` results for gates that require a notarized immutable
artifact, a clean machine, protected credentials, or additional live
multi-user actions. It is not release approval.

No email addresses, authentication output, tokens, cookies, private keys,
Keychain contents, signing-secret values, or Devin configuration contents are
recorded here.

## Candidate

| Field | Value |
| --- | --- |
| Candidate version | `0.4.25-local-rehearsal` |
| Source commit | `c2cdc92a972fa4686344ccf64b9d46c262c7cf86` |
| Artifact SHA-256 | `84d1a126d14c5fb0df64ee93492adf97d5d6dc298d78dc941573e23d3b7bb788` |
| Artifact download source | Local Developer ID rehearsal; not published |
| Build workflow run | Local build; signed-canary workflow not run |
| Test date | 2026-07-25 through 2026-07-27 |
| Tester | Local maintainer |

## Contexts

The operating-system users are anonymized as A and B. Separate Devin account
attribution has not yet been confirmed in Cognition's dashboard.

| Field | Context A | Context B |
| --- | --- | --- |
| Anonymized Buzz identity label | A | B |
| Anonymized Devin account label | Unverified A | Unverified B |
| macOS version | 26.5.1 | 26.5.1 |
| Architecture | Apple Silicon | Apple Silicon |
| Devin CLI version | 3000.2.17 | 3000.2.17 |
| Buzz for Devin version | 0.4.25 | 0.4.25 |
| Disposable workspace marker | Local disposable workspace | Not run |

## Runtime readiness

| Check | Result | Redacted observation |
| --- | --- | --- |
| CLI missing is distinguished | pass | Focused readiness tests passed |
| Installed but unauthenticated is distinguished | pass | Focused readiness tests passed |
| Authenticated and ready is distinguished | pass | Live contexts A and B reported ready |
| ACP startup failure is distinguished | pass | Focused startup-failure tests passed |
| Installation link opens Cognition's official CLI documentation | pass | Focused link tests passed |
| Login action uses `devin auth login` | pass | Command-policy tests passed |

## Native ACP and restart

| Check | Context A | Context B | Redacted observation |
| --- | --- | --- | --- |
| Runtime appears as `Devin` with the white-background icon | pass | pass | Source, built asset, automated render, and live onboarding checked |
| Default command resolves to `devin acp` | pass | pass | Live process trees used the official CLI |
| Default invocation is owner-only | pass | not run | Automated policy coverage passed; B live policy was not independently inspected |
| Default worker count is one | pass | not run | A checked; B not independently inspected |
| Initial visible channel reply | pass | not run | B completed a DM checkpoint, not a channel checkpoint |
| Published reply closes the exact turn after the compatibility grace | pass | not run | A exact-turn closure passed |
| Published reply is not retried or duplicated | pass | not run | A duplicate check passed |
| Safe tool activity in the disposable workspace | pass | not run | No B workspace was created |
| Visible reply after app restart | pass | not run | B normal quit cleanup passed; relaunch reply was not run |
| Cognition activity attributed to the local account | not run | not run | Dashboard confirmation requires an interactive account check |

## Authorization and isolation

| Check | Result | Redacted observation |
| --- | --- | --- |
| A can invoke agent A | pass | Prior live owner invocation passed; re-confirmed 2026-07-27 18:29 UTC |
| B cannot invoke agent A under owner-only | pass | 2026-07-27: established by the revocation test — with agent A back on `owner-only`, B attempted an invocation and was denied |
| B can invoke agent B | pass | Exact DM reply `MFENNER_CONTEXT_OK` appeared |
| A cannot invoke agent B under owner-only | not run | Live cross-owner denial remains open |
| Explicitly allowlisted B can invoke agent A | pass | 2026-07-27: B appeared in B's mention list via the kind:30177 directory, B's channel mention passed the inbound gate, and the turn published one reply in 6.4s |
| Unlisted identity remains blocked | not run | Only the one allowlisted identity was exercised |
| Removing B from the allowlist blocks B again | pass | 2026-07-27: after revoking and restarting, B attempted an invocation and was denied. Record, kind:30177 projection, and spawn env had all returned to `owner-only` with no allowlist variable. Two caveats: the denial only holds after a restart, and revoking on the instance left the definition still allowlisting B until that was cleared separately |
| Allowlisting does not admit external direct messages | not run | Live DM boundary test remains open |
| Agent A cannot read workspace B's marker | not run | B disposable workspace remains open |
| Agent B cannot read workspace A's marker | not run | B disposable workspace remains open |
| Both owned agents still work after restart | not run | A passed separately; the two-context row remains open |
| No usage is attributed to the wrong Devin account | not run | Cognition dashboard confirmation remains open |

## Defects found during this validation pass

Recorded so none of these is lost between passes. Details and evidence live in
[the security review](buzz-for-devin-security-review.md).

| Defect | State | Effect if unfixed |
| --- | --- | --- |
| Profile Edit opened the definition editor for definition-linked agents, so an allowlist change never reached the instance the runtime enforces | fixed (`resolveProfileEditTarget`) | Owner believes access was granted or revoked when the live agent's policy never changed |
| Agent directory discovery queried kind:10100 instead of kind:30177 | fixed | An allowlisted identity never sees the agent in autocomplete |
| Instance projection republished a retained allowlist under non-allowlist modes | fixed (`agent_event_content`) | Revoked pubkeys stay publicly readable on the relay |
| Inherited `ACP_BACKEND` reached the Devin adapter | fixed (`scrub_env_vars`) | Every Devin turn fails with "ACP host has not authenticated" despite a valid login |
| Revocation is not enforced until the agent restarts | open — product decision | A revoked identity keeps full access for an unbounded window |
| Revoking on an instance leaves its definition still allowlisting the identity | open | The next agent minted from that definition silently re-grants the revoked identity |
| ~~`auth_probe_args` probes a credential store ACP mode ignores~~ | withdrawn | Not a defect. `devin auth status` reported "Not logged in" only because the probe inherited `ACP_BACKEND`; the readiness and discovery probes both pass `runtime.scrub_env_vars`, so the same scrub fix makes the probe accurate. With `ACP_BACKEND` unset the adapter does fall back to stored CLI credentials, so that store is the correct thing to probe and `devin auth login` is the correct remediation |

## macOS distribution

| Check | Result | Redacted observation |
| --- | --- | --- |
| Developer ID signature verifies | pass | Strict local signature verification passed |
| Gatekeeper accepts a browser-downloaded copy | fail | Local rehearsal is unnotarized and was rejected |
| Notarization ticket is stapled and validates | fail | No protected notarization credentials or ticket are configured |
| Entitlements verify | pass | Local Developer ID rehearsal passed |
| DMG checksum matches the release record | pass | SHA-256 recorded above |
| Clean install succeeds on Apple Silicon macOS 11 or newer | not run | A separate clean machine is required |
| Upstream Buzz and Buzz for Devin coexist | pass | Isolated bundle identity and install path checked |
| `buzz://` remains owned by upstream Buzz | pass | Deep-link boundary verification passed |
| `buzz-for-devin://` opens only Buzz for Devin | pass | Deep-link boundary verification passed |
| Keychain prompts do not repeat during normal relaunch | not run | Must be repeated with a notarized immutable artifact |
| Upgrade preserves identity and managed-agent records | pass | Local installed-app lifecycle passed |
| Rollback restores the previous signed app | not run | Repeat with signed immutable N-1 and N artifacts |
| Uninstall removes the app but preserves user data and Keychain state | pass | Recoverable local uninstall lifecycle passed |
| Failed updater endpoint leaves the installed app usable | pass | Fail-closed updater policy tests passed |

## Security and quality gates

| Check | Result | Evidence reference |
| --- | --- | --- |
| Focused Rust tests | pass | Security review validation summary |
| Focused frontend tests | pass | Security review validation summary |
| Focused Playwright onboarding tests | pass | Security review validation summary |
| Full `just ci` | pass | Fork CI run `30237114011` |
| JavaScript dependency audit | pass | Security review dependency section |
| Root Rust advisory policy | pass | Security review dependency section |
| Desktop Tauri advisory policy | fail | Inherited maintenance advisories remain |
| Root and desktop Rust license, duplicate, and source policy | pass | Security review dependency section |
| Changed-file secret scan | pass | Security review validation summary |
| Packaging lifecycle test | pass | Security review packaging section |
| Final diff review | not run | Repeat against the immutable release commit |

## Exceptions and sign-off

Open gates are not converted into exceptions. No release role has signed off.

| Role | Name | Date | Decision |
| --- | --- | --- | --- |
| Runtime reviewer | | | |
| Security reviewer | | | |
| Distribution reviewer | | | |
| Release owner | | | |
