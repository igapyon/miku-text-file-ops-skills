# Operation Workflow

## Search and Read

Use zero context lines for the first content search. `count`, `summary`, and
`files` apply to path and content search; `matches` applies only to content
search. Expand an adjacent read range only when the first range lacks necessary
semantic context.

Read the full file only when most of it is needed and its known raw size is at
most 16 KiB, or when the user explicitly asks for the whole file.

When `usage.nextItemIndex` is present, resubmit only still-needed items from
that index onward. Do not replay items already processed.

## Mutations

A ranged or line-limited read still reports a revision over the complete raw
file. Retain that value with the returned context. For update, build the
contextual diff only from observed source lines. For delete, use a minimal read
selector that is sufficient to confirm the intended target.

Create relies on exclusive creation and has no preliminary revision. Update
and delete send `expectedRevision`; a successful update returns
`newRevision`, which becomes the expected revision for any later mutation.

Host approval remains required when the environment treats deletion or
external-root access as sensitive.
