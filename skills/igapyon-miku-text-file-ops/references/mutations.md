# Mutation Requests

Run one single-file mutation per invocation. Send multiline content and diffs
as JSON strings with escapes such as `\n`. Use the installed launcher and
transport contract in [runtime.md](runtime.md), and read
[encoding-policy.md](encoding-policy.md) before choosing `writeAs`.

## Create

```bash
node "<installed-skill-root>/lib/run-miku-text-file-ops.mjs" \
  --root "<project-root>" --json create <<'JSON'
{"path":"new.txt","content":"first\nsecond\n","writeAs":{"encoding":"utf-8","lineEnding":"lf","bom":false}}
JSON
```

Create is exclusive and needs no preliminary read. When `writeAs` omits a
field, the CLI applies matching repository path rules and repository defaults
before built-in UTF-8, LF, and no-BOM defaults.

## Update

```bash
node "<installed-skill-root>/lib/run-miku-text-file-ops.mjs" \
  --root "<project-root>" --json update <<'JSON'
{"path":"notes.txt","expectedRevision":"sha256:<revision-from-read>","change":{"type":"context-diff","diff":"@@\n old\n-old value\n+new value\n"}}
JSON
```

Pass the `revision` from the read that supplied the required patch context.
After success, retain `newRevision` for any later mutation. Update resolves the
input encoding independently; an item encoding used by an earlier read is not
implicitly carried into the update. Its output representation defaults to
preserve.

If the response has a `stale_revision` diagnostic, the mutation was not
applied. Do not resend the unchanged request. Read the target again, inspect
the latest bounded context, compare it with the context retained from the
first read, and rebuild the mutation with the new read revision.

Mutation paths whose first segment is `.git` are protected without regard to
ASCII letter case. Treat `.GIT/config` and `.GiT/config` as protected paths
and report the structured `protected_path` diagnostic.

Rebuild automatically only when the intended location remains unique and no
intervening change would be removed. If anchors overlap an intervening change,
the target becomes ambiguous, the encoding policy changes, or rebuilding could
discard current work, stop and present the bounded conflict to the user. A
second stale result returns to this decision; it is not an automatic retry
loop.

## Delete

```bash
node "<installed-skill-root>/lib/run-miku-text-file-ops.mjs" \
  --root "<project-root>" --json delete <<'JSON'
{"path":"notes.txt","expectedRevision":"sha256:<revision-from-read-or-update>"}
JSON
```

Confirm the target and pass its observed revision. Do not require unrelated
source text merely to delete it. Consult the bundled CLI's `--help` for the
complete mutation and `writeAs` contracts.

The same `stale_revision` recovery rule applies to delete: reread and rebuild
the deletion decision; never replace the old revision with the observed one
while retaining an old decision. Ask the user when the intervening content
change could affect whether the file should still be deleted.
