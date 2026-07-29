# Response Handling

Treat the canonical JSON response as the source of truth. Preserve stdout,
stderr, process status, and signal instead of converting a nonzero exit into an
empty or prose-only result.

Inspect completeness fields and diagnostics before reporting. Evidence remains
incomplete when the response reports `partial`, lower-bound counts,
`exact: false`, skipped items, `remainingRanges`, or a next item index.

Refine paths, patterns, projections, or ranges before increasing limits.
Surface decoding, encoding, stale revision, path, ignore, and budget
diagnostics without replacing upstream codes or messages.

A successful mutation response is authoritative. Re-read only when semantic
confirmation is useful; do not re-read automatically merely to confirm that a
successful write occurred.
