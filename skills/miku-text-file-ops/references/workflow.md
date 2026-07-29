# Operation Workflow

## Search and Read

Use `search` when candidate paths are not yet known. Start with no search
context lines and choose the smallest projection that answers the current
question:

- `count` for existence or quantity
- `summary` for broad scan shape and health
- `files` for candidate paths
- `matches` for selective source evidence

Use bounded `read` requests. Around known line `L`, start with an 81-line
window from `max(1, L - 40)` through `L + 40`. Merge overlapping ranges for the
same file. Without a known line, start with `firstLines: 120`.

Read the full file only when most of it is needed and its known raw size is at
most 16 KiB, or when the user explicitly asks for the whole file.

## Mutations

Use `create` only for a nonexistent target. Use `update` or `delete` only after
a full-file read supplies the current raw-byte revision. Perform one file
mutation per CLI invocation.

Prefer contextual diff input for updates. On `stale_revision`, re-read the
file, reconstruct the edit against the new content, and submit a new request.
Do not replay the previous request.

Use the same runtime for the read and write sides of an encoding-sensitive
edit. Host approval remains required when the environment treats deletion or
external-root access as sensitive.
