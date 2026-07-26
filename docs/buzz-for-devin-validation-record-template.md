# Buzz for Devin validation record

Copy this template for each release candidate. Store only non-secret,
publishable evidence. Do not record email addresses, authentication output,
tokens, cookies, private keys, Keychain contents, signing-secret values, or
Devin configuration contents.

Use `pass`, `fail`, or `not run` for every result. A release candidate cannot
pass while any required row is `fail` or `not run`.

## Candidate

| Field | Value |
| --- | --- |
| Candidate version | |
| Source commit | |
| Artifact SHA-256 | |
| Artifact download source | |
| Build workflow run | |
| Test date | |
| Tester | |

## Contexts

Use anonymized labels. Contexts A and B must be separate macOS users or
separate Macs and must use separate Devin accounts.

| Field | Context A | Context B |
| --- | --- | --- |
| Anonymized Buzz identity label | | |
| Anonymized Devin account label | | |
| macOS version | | |
| Architecture | | |
| Devin CLI version | | |
| Buzz for Devin version | | |
| Disposable workspace marker | | |

## Runtime readiness

Manufacture startup failures only through disposable agent configuration.
Never remove or edit Devin authentication data to reach a test state.

| Check | Result | Redacted observation |
| --- | --- | --- |
| CLI missing is distinguished | | |
| Installed but unauthenticated is distinguished | | |
| Authenticated and ready is distinguished | | |
| ACP startup failure is distinguished | | |
| Installation link opens Cognition's official CLI documentation | | |
| Login action uses `devin auth login` | | |

## Native ACP and restart

| Check | Context A | Context B | Redacted observation |
| --- | --- | --- | --- |
| Runtime appears as `Devin` with the white-background icon | | | |
| Default command resolves to `devin acp` | | | |
| Default invocation is owner-only | | | |
| Default worker count is one | | | |
| Initial visible channel reply (prompt permits only the Buzz publication call) | | | |
| Published reply closes the exact turn after the compatibility grace | | | |
| Published reply is not retried or duplicated | | | |
| Safe tool activity in the disposable workspace | | | |
| Visible reply after app restart (prompt permits only the Buzz publication call) | | | |
| Cognition activity attributed to the local account | | | |

## Authorization and isolation

| Check | Result | Redacted observation |
| --- | --- | --- |
| A can invoke agent A | | |
| B cannot invoke agent A under owner-only | | |
| B can invoke agent B | | |
| A cannot invoke agent B under owner-only | | |
| Explicitly allowlisted B can invoke agent A | | |
| Unlisted identity remains blocked | | |
| Removing B from the allowlist blocks B again | | |
| Allowlisting does not admit external direct messages | | |
| Agent A cannot read workspace B's marker | | |
| Agent B cannot read workspace A's marker | | |
| Both owned agents still work after restart | | |
| No usage is attributed to the wrong Devin account | | |

## macOS distribution

| Check | Result | Redacted observation |
| --- | --- | --- |
| Developer ID signature verifies | | |
| Gatekeeper accepts a browser-downloaded copy | | |
| Notarization ticket is stapled and validates | | |
| Entitlements verify | | |
| DMG checksum matches the release record | | |
| Clean install succeeds on Apple Silicon macOS 11 or newer | | |
| Upstream Buzz and Buzz for Devin coexist | | |
| `buzz://` remains owned by upstream Buzz | | |
| `buzz-for-devin://` opens only Buzz for Devin | | |
| Keychain prompts do not repeat during normal relaunch | | |
| Upgrade preserves identity and managed-agent records | | |
| Rollback restores the previous signed app | | |
| Uninstall removes the app but preserves user data and Keychain state | | |
| Failed updater endpoint leaves the installed app usable | | |

## Security and quality gates

| Check | Result | Evidence reference |
| --- | --- | --- |
| Focused Rust tests | | |
| Focused frontend tests | | |
| Focused Playwright onboarding tests | | |
| Full `just ci` | | |
| JavaScript dependency audit | | |
| Root Rust advisory policy | | |
| Desktop Tauri advisory policy | | |
| Root and desktop Rust license, duplicate, and source policy | | |
| Changed-file secret scan | | |
| Packaging lifecycle test | | |
| Final diff review | | |

## Exceptions and sign-off

List every intentional limitation or pre-existing warning. Do not convert an
open release gate into an exception merely to ship.

| Role | Name | Date | Decision |
| --- | --- | --- | --- |
| Runtime reviewer | | | |
| Security reviewer | | | |
| Distribution reviewer | | | |
| Release owner | | | |
