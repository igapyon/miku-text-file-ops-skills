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

## Encoding-Sensitive Work Scope

Start a work scope after the Skill is selected and the current user task,
project root, and a path rule or file-specific encoding requirement are known.
The scope is defined by that task and matching paths, not by elapsed time or a
number of turns.

For every matching path in that scope, continue using the bundled CLI through:

- candidate search and bounded reads
- create, update, and delete
- semantic verification after a mutation
- follow-up edits caused by build or test results
- `stale_revision` reread, comparison, and request rebuilding
- another file matched by the same established path rule

Normal build and test tools may run normally. If their result requires another
change to a matching path, return to the bundled CLI. Do not switch an
encoding-sensitive path to an unrelated patch tool because a mutation failed.

Do not extend the scope to an unrelated ordinary UTF-8 file merely because it
shares the project root. End it when the requested work and verification are
complete, the user moves to a distinct nonmatching task, the user changes the
encoding policy or target set, or the user cancels the work.

## Turn and Harness Boundary

When a later turn retains the same task context and known policy, select the
Skill again for matching paths. In a new thread without that context, do not
assume an invisible prior activation.

For durable repository-wide enforcement, record the requirement in project
guidance such as `AGENTS.md`, or have the harness inject it again. The
`.mikusoft/miku-text-file-ops.json` file is runtime policy consumed after CLI
invocation; its presence alone cannot force an unaware agent to select the
Skill.

## Revision-Conflict Transition

Use this state transition:

```text
read(context1, revision1)
  -> mutation(revision1)
  -> stale_revision (mutation not applied)
  -> bounded reread(context2, revision2)
  -> compare context1, context2, policy, and user intent
       -> safe: rebuild from context2 and try once with revision2
       -> unsafe: do not mutate; present the bounded conflict to the user
```

Automatic rebuilding is safe only when the intended location remains unique,
the intervening change will not be removed, the new patch can be built from
observed current lines, and the encoding policy is unchanged.

Ask the user when an anchor overlaps an intervening edit, the intended target
is ambiguous, rebuilding may discard current work, stale results repeat, or
the encoding policy changed or became unclear. Report the path, intended
change, and only the old and current context needed for the decision; do not
produce an unbounded full-file diff by default.
