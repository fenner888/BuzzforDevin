# Buzz for Devin multi-user validation

This runbook proves the Phase 2 live reply and Phase 3 account-isolation
requirements without exposing authentication material. Run it only with
disposable repositories that contain no credentials, personal data, or
production configuration.

## Required setup

Use two separate Devin credential contexts:

- Context A: machine A or macOS user A, Buzz identity A, Devin account A.
- Context B: machine B or macOS user B, Buzz identity B, Devin account B.

Changing only the Buzz identity inside one macOS login is not a separate Devin
credential context. The official Devin CLI stores authentication for the
operating-system user, while Buzz invocation authorization is enforced by Buzz
identity.

For each context:

1. Install the same immutable Buzz for Devin build.
2. Install the official Devin CLI through Cognition's documented installation
   path.
3. Authenticate interactively with `devin auth login` if needed.
4. Confirm readiness using only `devin auth status`.
5. Create a separate disposable repository with a unique, non-sensitive marker
   file.
6. Select only that context's repository as its Buzz Repos Directory.

Do not record command output containing tokens, cookies, Keychain values,
configuration contents, or environment variables. The test record needs only
the build identifier, anonymized account labels A/B, and pass/fail observations.

## Test matrix

| Test | Action | Expected result |
| --- | --- | --- |
| A owner invocation | Identity A mentions agent A under `owner-only` | Agent A replies and can work only in workspace A |
| B blocked by A | Identity B mentions agent A under `owner-only` | No Devin turn starts for agent A and no usage is attributed to account A |
| B own invocation | Identity B mentions agent B under `owner-only` | Agent B replies and can work only in workspace B |
| A blocked by B | Identity A mentions agent B under `owner-only` | No Devin turn starts for agent B and no usage is attributed to account B |
| Explicit allowlist | A changes agent A to `allowlist` and adds identity B | Identity B can invoke agent A; an unlisted identity remains blocked |
| Allowlist removal | A removes identity B | Identity B can no longer invoke agent A |
| Direct messages | An allowlisted external identity DMs agent A | The DM fails closed; channel allowlisting does not widen DM admission |
| Workspace A boundary | Agent A is asked for workspace B's unique marker | Agent A cannot access it through the configured `REPOS` mapping |
| Workspace B boundary | Agent B is asked for workspace A's unique marker | Agent B cannot access it through the configured `REPOS` mapping |
| Restart | Quit and reopen Buzz for Devin, then invoke each owned agent | Agent configuration is restored and each agent still uses its own OS-user Devin account |

The workspace checks prove the selected mapping and the operating-system user
boundary used by the test. They do not claim that Buzz's `REPOS` mapping is an
OS sandbox.

## Phase 2 live reply checkpoint

In context A:

1. Start the Devin-backed agent.
2. First ask it: `Use the Buzz CLI to publish exactly PHASE2_REPLY_OK to this
   reply destination. Do not inspect files or use any other tools.` A visible
   reply requires the one `buzz messages send` call; never use a blanket
   "do not use tools" instruction for this checkpoint because raw ACP text is
   not automatically reposted into Buzz.
3. Ask it to make a harmless, easily verified edit in workspace A.
4. Confirm that tool activity and the final response are visibly published in
   the Buzz channel.
5. Restart Buzz for Devin.
6. Repeat the exact publication-aware reply check, then ask for another
   harmless edit and confirm a second visible final response.
7. In Cognition's normal account dashboard, confirm that the activity is
   attributed to account A. Record only yes/no; do not capture account secrets.

Repeat the attribution check for context B during its own invocation. Usage
amounts may vary and are not an acceptance criterion; correct account
attribution is.

## Failure-state checks

Use a disposable test context where each state can be reached without altering
another user's credentials:

1. With no `devin` executable on `PATH`, Doctor reports that the CLI is missing
   and links to Cognition's official installation documentation.
2. With Devin installed but not authenticated, Doctor reports authentication
   required and offers the official CLI login flow.
3. After successful authentication, Doctor reports Devin ready.
4. With a deliberately invalid ACP launch configuration in the disposable
   agent record, startup reports an ACP startup failure rather than a missing or
   unauthenticated CLI.

Restore the disposable agent configuration after the fourth check. Never edit
or remove Devin authentication data to manufacture a failure.

## Evidence record

Copy
[the validation record template](buzz-for-devin-validation-record-template.md)
for the release candidate and record:

- Immutable build tag or source commit.
- macOS and architecture for contexts A and B.
- Devin CLI version for each context.
- Buzz identity labels A and B, without private keys.
- Devin account labels A and B, without email addresses if the record will be
  public.
- Pass/fail for every row in the matrix.
- Pass/fail for both Cognition usage-attribution checks.
- Any user-visible error text after confirming it contains no credential data.

Stop and file a blocking issue if an invocation crosses an owner or allowlist
boundary, a workspace marker is visible from the other context, credentials
appear in logs or UI, or usage is attributed to the wrong Devin account.
