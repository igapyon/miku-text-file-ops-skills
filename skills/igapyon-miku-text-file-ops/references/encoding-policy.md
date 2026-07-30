# Encoding Policy

Keep repository encoding semantics in the bundled CLI. The Skill selects the
CLI and supplies requests; it does not parse, merge, or reimplement this policy.

- [Repository configuration](#repository-configuration)
- [Existing-file resolution](#existing-file-resolution)
- [Operation matrix](#operation-matrix)
- [Create defaults](#create-defaults)
- [Update preservation](#update-preservation)
- [Control JSON boundary](#control-json-boundary)

## Repository Configuration

Place strict UTF-8 JSON at:

```text
.mikusoft/miku-text-file-ops.json
```

For `.java` and `.jsp` as Windows-31J and other creates as UTF-8 with LF and no
BOM:

```json
{
  "schemaVersion": 1,
  "encodingRules": [
    {"glob": "**/*.java", "encoding": "windows-31j"},
    {"glob": "**/*.jsp", "encoding": "windows-31j"}
  ],
  "defaults": {
    "encoding": "utf-8",
    "lineEnding": "lf",
    "bom": false
  }
}
```

Rules are evaluated in array order; the first match wins. Supported canonical
encodings are `utf-8`, `utf-16le`, `utf-16be`, and `windows-31j`.
`legacyFallback`, when present, is exactly `"windows-31j"`.

`defaultCreate` is a deprecated alias for `defaults`. Never supply both.
Unknown fields, invalid globs, invalid values, or malformed configuration are
hard configuration errors.

## Existing-File Resolution

Decode an existing file in this order:

1. explicit read-item encoding, when the operation supports one
2. first matching repository encoding rule
3. BOM
4. strict UTF-8
5. configured `legacyFallback`
6. `encoding_undetermined`

An explicit encoding or repository rule that conflicts with a BOM produces
`encoding_conflict`. Never guess from locale or silently replace undecodable
bytes.

## Operation Matrix

| Operation | Policy behavior |
| --- | --- |
| path `search` | Does not decode file content. |
| content `search` | Uses rule, BOM, strict UTF-8, then fallback. |
| `read` | Uses item override, then rule, BOM, strict UTF-8, and fallback. |
| `create` | Uses explicit `writeAs`, matching rule defaults, repository defaults, then built-ins. |
| `update` | Resolves the existing input independently and preserves encoding, newline shape, and BOM by default. |
| `delete` | Uses the raw-byte revision and does not decode the target. |

The CLI loads repository configuration before dispatch. An invalid
configuration can therefore stop an operation even when that operation does
not decode the target.

## Create Defaults

Create resolves each output field independently:

- encoding: explicit `writeAs.encoding`, matching `encodingRules`, then
  `defaults.encoding`, then `utf-8`
- line ending: explicit `writeAs.lineEnding`, then `defaults.lineEnding`, then
  `lf`
- BOM: explicit `writeAs.bom`, then `defaults.bom`, then `false`

Thus a new matching `.java` or `.jsp` file uses Windows-31J even when
`writeAs.encoding` is omitted. An explicit request field overrides its default.

## Update Preservation

A read-item encoding applies only to that read. Update performs its own input
resolution; use repository policy when the same non-UTF-8 path will be updated
later.

Omitted update `writeAs` fields are `preserve`. Existing encoding and BOM
remain observable state and are not replaced by `defaults.encoding` or
`defaults.bom`. Existing uniform or mixed newline bytes are preserved according
to the CLI patch contract.

When an existing file has no observable newline, including a zero-byte file,
`defaults.lineEnding` supplies the separator for newly introduced lines while
`writeAs.lineEnding` remains `preserve`; LF is used when no repository default
exists. Use an explicit non-preserve field only for an intentional conversion.

## Control JSON Boundary

Repository policy controls target text files. CLI request JSON is a separate
transport and must always be UTF-8 without a BOM on stdin. Delegate every
non-UTF-8 target read, write, and encoding conversion to the bundled CLI.
