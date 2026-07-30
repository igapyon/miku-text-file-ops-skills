---
name: igapyon-miku-text-file-ops
description: Use when the user explicitly names `igapyon-miku-text-file-ops`, `miku-text-file-ops`, or `miku-text-file-ops-skills`, or when encoding-aware local text operations are required for non-UTF-8 files, mixed encodings, repository encoding rules, Windows-31J, explicit encoding conversion, BOM or newline preservation, mojibake, decode errors, or unexpectedly skipped text files. Run the bundled standalone CLI for search, read, create, update, and delete. Do not activate for ordinary UTF-8 reading, generic source search, routine patching, binary files, or code review.
---

# Miku Text File Ops

Use the bundled upstream CLI as a thin adapter for encoding-sensitive local
text-file work. Keep decoding, encoding, path, patch, revision, and response
semantics in the upstream runtime.

## Execution Contract

Require Node.js 22 or newer. Resolve the installed Skill root and read
`index.json` before discovering bundled files. Keep that root separate from the
project or workspace root being operated on.

For data operations, use only the bundled launcher:

```bash
node "<installed-skill-root>/lib/run-miku-text-file-ops.mjs" \
  --root "<project-root>" --json <command>
```

Pass exactly one UTF-8 no-BOM JSON request on stdin. `--json` selects the
machine-readable stdout format; it does not select the input format. Request
paths are relative to `--root`. Commands are exactly `search`, `read`, `create`,
`update`, and `delete`.

Never locate or obtain the CLI through `npx`, `npm install`, a bare-command
`PATH` search, an npm registry search, or a network download. Never substitute
another installed copy.

Never execute `miku-text-file-ops-runtime-<version>.mjs`; that artifact is an
importable API bundle, not the CLI. If the standalone CLI is missing or
unusable, stop with a hard error and report the expected runtime location. Do
not fall back to Java, MCP, native patching, or a Skill-local implementation.

Read [references/runtime.md](references/runtime.md) when resolving or invoking
the runtime. Read
[references/encoding-policy.md](references/encoding-policy.md) whenever
repository rules, encodings, BOM, or line endings affect a decision. Read
[references/search-read.md](references/search-read.md) for search and read
requests. Read
[references/mutations.md](references/mutations.md) before create, update, or
delete.

## Workflow

1. Fix the workspace root before invoking the CLI.
2. Use `search` to find candidates. For broad work, request the smallest useful
   projection: `count`, `summary`, `files`, then `matches`.
3. Use `read` with bounded ranges. Around a known match line `L`, begin with
   `max(1, L - 40)` through `L + 40`; otherwise begin with `firstLines: 120`.
4. Merge overlapping windows. Split a merged window into adjacent ranges when
   it exceeds the effective per-item line limit.
5. Refine a query before raising output limits. Raise one only for a concrete
   exhaustive requirement within the host ceiling.
6. Before `update`, use a bounded `read` that returns the required patch
   context and full-file raw-byte revision. Before `delete`, confirm the target
   and obtain its revision; source text beyond that confirmation is unnecessary.
   For `create`, do not read a nonexistent target.
7. Perform one single-file mutation per invocation. Prefer `context-diff` for
   updates.
8. On `stale_revision`, inspect the structured diagnostic details, read again,
   review the latest content, and rebuild the request. Never retry the
   unchanged mutation blindly. If the latest content conflicts with the user's
   intent or rebuilding could discard an intervening change, stop and present
   the bounded conflict to the user.
9. Preserve the runtime's stdout, stderr, exit status, and structured result.

After an encoding-sensitive requirement is established, keep using the bundled
CLI for every matching path in the current work scope through search, read,
mutation, verification, follow-up fixes, and conflict recovery. Do not extend
that scope to unrelated ordinary UTF-8 paths.

Read [references/workflow.md](references/workflow.md) for operation selection
work-scope continuity, and mutation safeguards. Read
[references/response-handling.md](references/response-handling.md) when a
result is partial, nonzero, or diagnostic-heavy.

## Boundaries

- Treat host workspace authorization, sandbox enforcement, external-root
  access, and destructive-operation approval as host responsibilities.
- Never read with this runtime and then write the same encoding-sensitive file
  with an unrelated patch tool.
- Do not advertise JSONL, exhaustive streaming, managed artifacts,
  continuation tokens, capability caches, `doctor`, or state commands.
