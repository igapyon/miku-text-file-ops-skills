# Search and Read Requests

Use the installed launcher and transport contract in
[runtime.md](runtime.md). Send exactly one UTF-8 no-BOM JSON object on stdin.

## Search

```bash
node "<installed-skill-root>/lib/run-miku-text-file-ops.mjs" \
  --root "<project-root>" --json search <<'JSON'
{"mode":"paths","projection":"files","include":["**/*.md"]}
JSON
```

For content evidence, use `mode: "content"` and provide `pattern`. Choose
`count`, `summary`, or `files` before `matches` when a query is broad.

## Read

```bash
node "<installed-skill-root>/lib/run-miku-text-file-ops.mjs" \
  --root "<project-root>" --json read <<'JSON'
{"items":[{"path":"README.md","firstLines":120}]}
JSON
```

Each item uses exactly one selector: `full`, `range`, `firstLines`, or
`lastLines`. Retain the returned raw-byte `revision` for update or delete.
Consult the bundled CLI's `--help` for the complete request-field contract.

## Encoding Policy

Path search does not decode files. Content search and read use repository
encoding policy; a read item may override its own encoding. Read
[encoding-policy.md](encoding-policy.md) for the resolution order and do not
parse or merge repository policy in the Skill.
