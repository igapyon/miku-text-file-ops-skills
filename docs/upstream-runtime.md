# Upstream Runtime

## Accepted Runtime

The bundled runtime is the reviewed standalone Node.js CLI asset from the
upstream `miku-text-file-ops` GitHub Release.

| Field | Value |
| --- | --- |
| Upstream repository | `https://github.com/igapyon/miku-text-file-ops` |
| Release | `v0.3.1` |
| Release URL | `https://github.com/igapyon/miku-text-file-ops/releases/tag/v0.3.1` |
| Asset | `miku-text-file-ops-0.3.1.mjs` |
| Received path | `skills/miku-text-file-ops/runtime/miku-text-file-ops-0.3.1.mjs` |
| Received date | 2026-07-29 |
| Size | 698665 bytes |
| SHA-256 | `148963640dce0259d97a9e878226596c215e4ce00d1de581ebf6c8d0998245d9` |
| Reported version | `0.3.1` |

The Agent Skill package version is independent from the bundled upstream
runtime version.

## Artifact Roles

Only `miku-text-file-ops-0.3.1.mjs` is executable in this Skill.

`miku-text-file-ops-runtime-0.3.1.mjs` is an importable API bundle and is not
received or executed. The source archive is not a runtime artifact.

## Verification

Verify every received replacement before wiring or release:

```bash
shasum -a 256 skills/miku-text-file-ops/runtime/miku-text-file-ops-<version>.mjs
node skills/miku-text-file-ops/runtime/miku-text-file-ops-<version>.mjs --version
node skills/miku-text-file-ops/runtime/miku-text-file-ops-<version>.mjs --help
```

Update this document with the new Release, asset, size, digest, received date,
and reported version. Keep the old runtime only when the repository explicitly
supports multiple bundled versions; otherwise replace it after review.
