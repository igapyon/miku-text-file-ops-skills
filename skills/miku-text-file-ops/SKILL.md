---
name: miku-text-file-ops
description: Use when the user explicitly names `miku-text-file-ops` or `miku-text-file-ops-skills`, or when encoding-aware local text operations are required for non-UTF-8 files, Windows-31J, BOM or newline preservation, mojibake, or decode errors. Run the bundled standalone CLI for search, read, create, update, and delete. Do not activate for ordinary UTF-8 reading, generic source search, routine patching, binary files, or code review.
---

# Miku Text File Ops

Use the bundled upstream CLI as a thin adapter for encoding-sensitive local
text-file work. Keep decoding, encoding, path, patch, revision, and response
semantics in the upstream runtime.

## Activation

Activate only when the user names this product or the task requires its
encoding-preserving behavior. Continue an already active workflow after an
explicit trigger.

Without those conditions, use ordinary native tools. Do not take over generic
UTF-8 reading, grep, source editing, binary-file work, or code review.

## Runtime

Require Node.js 22 or newer. Resolve a versioned standalone CLI from
`runtime/miku-text-file-ops-<version>.mjs`, relative to this Skill directory.
Use the newest valid filename version.

Run it through:

```bash
node lib/run-miku-text-file-ops.mjs --root <workspace> --json <command>
```

Pass one UTF-8 JSON request on stdin. Commands are exactly `search`, `read`,
`create`, `update`, and `delete`.

Never execute `miku-text-file-ops-runtime-<version>.mjs`; that artifact is an
importable API bundle, not the CLI. If the standalone CLI is missing or
unusable, stop with a hard error and report the expected runtime location. Do
not fall back to Java, MCP, native patching, or a Skill-local implementation.

Read [references/runtime.md](references/runtime.md) when resolving or invoking
the runtime.

## Workflow

1. Fix the workspace root before invoking the CLI.
2. Use `search` to find candidates. For broad work, request the smallest useful
   projection: `count`, `summary`, `files`, then `matches`.
3. Use `read` with bounded ranges. Around a known match line `L`, begin with
   `max(1, L - 40)` through `L + 40`; otherwise begin with `firstLines: 120`.
4. Refine a query before raising output limits.
5. Before `update` or `delete`, obtain the full-file raw-byte revision with
   `read`. For `create`, do not read a nonexistent target.
6. Perform one single-file mutation per invocation. Prefer `context-diff` for
   updates.
7. On `stale_revision`, read again and rebuild the request. Never retry a stale
   mutation blindly.
8. Preserve the runtime's stdout, stderr, exit status, and structured result.

Read [references/workflow.md](references/workflow.md) for operation selection
and mutation safeguards. Read
[references/response-handling.md](references/response-handling.md) when a
result is partial, nonzero, or diagnostic-heavy.

## Boundaries

- Treat host workspace authorization, sandbox enforcement, external-root
  access, and destructive-operation approval as host responsibilities.
- Never read with this runtime and then write the same encoding-sensitive file
  with an unrelated patch tool.
- Do not advertise JSONL, exhaustive streaming, managed artifacts,
  continuation tokens, capability caches, `doctor`, or state commands.
- Read [index.json](index.json) first when discovering bundled files.
