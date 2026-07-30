# Response Handling

Treat the canonical JSON response as the source of truth. Preserve stdout,
stderr, process status, and signal instead of converting a nonzero exit into an
empty or prose-only result.

Use the runtime's deterministic character and byte limits as portable context
budget proxies. Do not estimate model tokens or assume a context-window size.

Inspect completeness fields and diagnostics before reporting. Evidence remains
incomplete when the response reports `partial`, lower-bound counts,
`exact: false`, skipped items, `remainingRanges`, or a next item index.
Report a lower-bound count as “at least N”, never as an exact total.

When `usage.nextItemIndex` is present, resubmit only the still-needed
unprocessed items. Keep every result bounded; do not concatenate bounded
responses into one unbounded model response.

Refine paths, patterns, projections, or ranges before increasing limits. Raise
a limit only for a concrete exhaustive requirement and only within the
runtime-reported host ceiling.
Surface decoding, encoding, stale revision, path, ignore, and budget
diagnostics without replacing upstream codes or messages.

A successful mutation response is authoritative. Re-read only when semantic
confirmation is useful; do not re-read automatically merely to confirm that a
successful write occurred.

## Structured Envelope

Machine mode emits one canonical JSON object:

```json
{
  "schemaVersion": "miku-text-file-ops/v1",
  "operation": "read",
  "status": "success",
  "completeness": {"complete": true, "reasons": []},
  "results": [{"type": "read", "path": "notes.txt", "revision": "sha256:..."}],
  "diagnostics": [],
  "usage": {"recordsReturned": 1}
}
```

Inspect the actual envelope; operation-specific records may contain different
fields.

## Exit Status

- `0`: complete success
- `1`: useful partial result; consume results and diagnostics
- `2`: CLI syntax, JSON syntax, or request-validation error
- `3`: valid-request operation failure or unexpected runtime error

Always parse the JSON envelope on nonzero exit.

## Revision Conflicts

For `stale_revision`, the mutation was rejected because the target's raw bytes
changed after the read that supplied `expectedRevision`. Use the structured
diagnostic fields; do not parse the human-readable message.

```json
{
  "severity": "error",
  "code": "stale_revision",
  "path": "notes.txt",
  "details": {
    "expectedRevision": "sha256:<revision-from-read>",
    "actualRevision": "sha256:<revision-at-mutation>",
    "recovery": "reread_and_rebuild_request",
    "retryUnchangedRequest": false
  }
}
```

The stable recovery is to read the target again, review the latest content,
rebuild the intended mutation, and send a new request with the new revision.
Do not blindly resend the old request, substitute `actualRevision` into an old
request, or switch to an unrelated patch tool to bypass the revision guard.

This revision compares the last read with current raw bytes, not the file with
Git `HEAD`. Compare retained bounded context with a new bounded read. Use the
revision returned by that read; another process may have changed the file again
after the diagnostic's `actualRevision`.

If the intervening edit overlaps the intended change, makes the target
ambiguous, changes the encoding policy, repeats during recovery, or could be
lost by rebuilding, do not mutate. Present the path, intended change, and the
minimum old and current context needed for the user to decide.
