# Agent Routing Forward Test

## Scope

On 2026-07-30, fresh Codex subagent threads received raw user tasks with access
to the installable `skills/igapyon-miku-text-file-ops/` directory. They were
told not to inspect repository tests or developer documents. Positive
data-operation cases used an isolated mixed UTF-8 and Windows-31J workspace
under `/private/tmp`; repository files were not mutated.

The reusable golden inputs are recorded in
`tests/fixtures/agent-routing-v1.json`. Deterministic contract tests validate
their categories and expected trace fields. This document records the
independent agent observations; it is not loaded by the installed Skill.

## Observed Routing

| Raw-task class | Observation |
| --- | --- |
| Broad mixed-encoding `ERROR` search | Selected the Skill, checked bundled CLI `0.5.0`, ran `summary` before `files`, returned no match text, and reported complete exact counts. |
| Windows-31J revision-guarded update | Selected the Skill, used bounded `firstLines: 120`, handed the read revision to one context-diff update, and preserved Windows-31J, CRLF, no BOM, and the final newline. |
| Ordinary UTF-8 README edit | Rejected the Skill and chose native `rg` followed by the normal patch path. |
| Ordinary TypeScript analysis | Rejected the Skill and chose native repository and TypeScript analysis tools. |
| Mojibake recovery | Selected the Skill and executed `read` with `firstLines: 120` and authoritative item encoding; the result was complete with no remaining range. |
| Explicit product-name candidate search | Selected the Skill and executed path `files` with a narrowed legacy-name glob. |
| PNG metadata | Rejected the Skill as binary-file work. |

Every executed positive case used
`node <installed-skill-root>/lib/run-miku-text-file-ops.mjs --root ...
--json <operation>`. Selection without launcher execution was not counted as a
successful positive result.

## Observed Context Decisions

A separate fresh thread received seven independent raw tasks and produced these
first decisions:

- broad path quantity: path `count`
- broad mixed-encoding scan health: content `summary` with zero context
- exact match quantity: content `count`; report partial output as “at least N”
- nearby matches at lines 20 and 45: merge the two 81-line windows to lines
  1–85, splitting only if the effective per-item limit requires it
- an explicitly requested 8 KiB whole file: `full`
- one relevant section in a 64 KiB file: `matches`, then bounded ranges
- `usage.nextItemIndex = 2`: resubmit only still-needed items from index 2

The thread refined before raising limits, rejected false completeness and
false exact-count claims, and did not propose concatenating bounded responses
into unbounded output.

## Runtime Evidence

The broad search ran `summary` and then `files`; both returned exit `0`,
`status: "success"`, `completeness.complete: true`, zero skipped files, and
zero diagnostics. The update used the read revision as `expectedRevision`; the
update and verification read both returned exit `0` and preserved the expected
metadata.

The isolated bundle transport test additionally places its UTF-8 no-BOM request
under `<project-root>/workplace/tmp/miku-text-file-ops/`, keeps `workplace/`
ignored, uses the absolute control-file path only for stdin, resolves the target
relative to `--root`, and removes the exact request file in the same test
process. This deterministic case covers workspace-only harnesses without
requiring repeated external-root approval.

Model token counts are intentionally not conformance evidence. The portable
evidence is the selected operation, projection, selector or range, structured
status and completeness, effective limits, returned text characters, protocol
bytes, and revision handoff.

## Observed Post-Selection Workflow

Fresh subagent threads then received only the installable Skill and raw
post-selection tasks. They did not inspect repository tests or developer
documents.

### Closed Runtime and Temporary JSON

One thread configured `.java` as Windows-31J and created a 57-line Japanese
file. It:

- resolved and used the absolute bundled launcher without `npx`, package
  installation, PATH lookup, registry search, or network download
- passed a 4,416-byte UTF-8 no-BOM request file through stdin
- kept JSON stdout and empty stderr in separate files and captured exit `0`
- read the target again through the same launcher
- confirmed `encodingSource: "repositoryRule"`, Windows-31J, LF, no BOM, equal
  content, and equal create/read revisions
- deleted the exact six request, response, and stderr files plus the isolated
  project

### Encoding-Sensitive Scope Continuity

A separate thread configured `.java` and `.jsp` as Windows-31J while keeping
`README.md` as ordinary UTF-8. Initial and follow-up create, read, update, and
verification operations for both legacy files all used the bundled launcher.
The repository policy and README used the normal UTF-8 patch path.

Final verification confirmed Windows-31J with no BOM and a final LF for both
legacy files, strict UTF-8 with no BOM and a final LF for README, and successful
strict-UTF-8 rejection of the two legacy byte streams. This demonstrated that
the post-selection scope continued across related files and follow-up edits
without expanding to the unrelated UTF-8 file.

### Overlapping Revision Conflict

A third thread read a Windows-31J settings file, retained its revision, then
simulated an intervening change to the same setting before submitting the
prepared update. The CLI returned exit `3` with structured `stale_revision`,
different expected and actual revisions,
`recovery: "reread_and_rebuild_request"`, and
`retryUnchangedRequest: false`.

The thread reread the file through the bundled launcher, detected that the
intervening edit overlapped the intended setting, applied no further mutation,
and produced a bounded user handoff asking whether to retain the external value
or replace it with the requested value.
