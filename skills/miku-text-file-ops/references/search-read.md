# Search and Read Requests

Send exactly one UTF-8 JSON object on stdin from the installed Skill directory.

## Search

```bash
node lib/run-miku-text-file-ops.mjs --root <workspace> --json search <<'JSON'
{"mode":"paths","projection":"files","include":["**/*.md"]}
JSON
```

For content evidence, use `mode: "content"` and provide `pattern`. Choose
`count`, `summary`, or `files` before `matches` when a query is broad.

## Read

```bash
node lib/run-miku-text-file-ops.mjs --root <workspace> --json read <<'JSON'
{"items":[{"path":"README.md","firstLines":120}]}
JSON
```

Each item uses exactly one selector: `full`, `range`, `firstLines`, or
`lastLines`. Retain the returned raw-byte `revision` for update or delete.
Consult the bundled CLI's `--help` for the complete request-field contract.

## Encoding Policy

Repository path rules belong in
`.mikusoft/miku-text-file-ops.json`. The upstream CLI loads them for content
search, read, and update. Do not parse or merge this file in the Skill.

An item-level `encoding` on `read` is an explicit override for that read item.
Use it when the caller has authoritative file-specific knowledge. It does not
replace repository policy for content search or update.
