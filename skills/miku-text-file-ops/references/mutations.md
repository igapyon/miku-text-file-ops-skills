# Mutation Requests

Run one single-file mutation per invocation. Send multiline content and diffs
as JSON strings with escapes such as `\n`.

## Create

```bash
node lib/run-miku-text-file-ops.mjs --root <workspace> --json create <<'JSON'
{"path":"new.txt","content":"first\nsecond\n","writeAs":{"encoding":"utf-8","lineEnding":"lf","bom":false}}
JSON
```

Create is exclusive and needs no preliminary read.

## Update

```bash
node lib/run-miku-text-file-ops.mjs --root <workspace> --json update <<'JSON'
{"path":"notes.txt","expectedRevision":"sha256:<revision-from-read>","change":{"type":"context-diff","diff":"@@\n old\n-old value\n+new value\n"}}
JSON
```

Pass the `revision` from the read that supplied the required patch context.
After success, retain `newRevision` for any later mutation.

## Delete

```bash
node lib/run-miku-text-file-ops.mjs --root <workspace> --json delete <<'JSON'
{"path":"notes.txt","expectedRevision":"sha256:<revision-from-read-or-update>"}
JSON
```

Confirm the target and pass its observed revision. Do not require unrelated
source text merely to delete it. Consult the bundled CLI's `--help` for the
complete mutation and `writeAs` contracts.
