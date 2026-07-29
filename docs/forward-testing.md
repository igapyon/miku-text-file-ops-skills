# Agent Routing Forward Test

## Scope

On 2026-07-30, fresh Codex subagent threads received raw user tasks with access
to the installable `skills/miku-text-file-ops/` directory. They were told not
to inspect repository tests or developer documents. Positive data-operation
cases used an isolated mixed UTF-8 and Windows-31J workspace under
`/private/tmp`; repository files were not mutated.

The reusable golden inputs are recorded in
`tests/fixtures/agent-routing-v1.json`. Deterministic contract tests validate
their categories and expected trace fields. This document records the
independent agent observations; it is not loaded by the installed Skill.

## Observed Routing

| Raw-task class | Observation |
| --- | --- |
| Broad mixed-encoding `ERROR` search | Selected the Skill, checked bundled CLI `0.4.1`, ran `summary` before `files`, returned no match text, and reported complete exact counts. |
| Windows-31J revision-guarded update | Selected the Skill, used bounded `firstLines: 120`, handed the read revision to one context-diff update, and preserved Windows-31J, CRLF, no BOM, and the final newline. |
| Ordinary UTF-8 README edit | Rejected the Skill and chose native `rg` followed by the normal patch path. |
| Ordinary TypeScript analysis | Rejected the Skill and chose native repository and TypeScript analysis tools. |
| Mojibake recovery | Selected the Skill and executed `read` with `firstLines: 120` and authoritative item encoding; the result was complete with no remaining range. |
| Explicit product-name candidate search | Selected the Skill and executed path `files` with a narrowed legacy-name glob. |
| PNG metadata | Rejected the Skill as binary-file work. |

Every executed positive case used
`node lib/run-miku-text-file-ops.mjs --root ... --json <operation>`. Selection
without launcher execution was not counted as a successful positive result.

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

Model token counts are intentionally not conformance evidence. The portable
evidence is the selected operation, projection, selector or range, structured
status and completeness, effective limits, returned text characters, protocol
bytes, and revision handoff.
