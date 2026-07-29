# miku-text-file-ops-skills

Agent Skills package for encoding-aware local text-file operations through the
bundled `miku-text-file-ops` standalone CLI.

The canonical Skill source is under `skills/miku-text-file-ops/`. The package
is a thin CLI-backed adapter; decoding, encoding, search, patch, revision, and
result semantics remain in the upstream runtime.

## Requirements

- Node.js 22 or newer
- `zip` and `unzip` for release bundle verification

## Commands

```bash
npm test
npm run build:bundle
npm run build:bundle:zip
npm run build
```

The release ZIP is written as:

```text
bundle/igapyon-miku-text-file-ops-skills-<package-version>.zip
```

## Runtime

The received standalone CLI lives under
`skills/miku-text-file-ops/runtime/`. See
[`docs/upstream-runtime.md`](docs/upstream-runtime.md) for its provenance and
verification record.

## Repository Operation

- `skills/miku-text-file-ops/` is the canonical installable source.
- `index.json` is generated with `miku-indexgen`; do not edit it manually.
- `workplace/` is local scratch space; only `.gitkeep` is tracked.
- `.codex/skills/`, `bundle/`, `release-assets/`, and dependencies are ignored.
- GitHub PRs, tags, and Releases are human-operated.

Developer documents are under [`docs/`](docs/).
