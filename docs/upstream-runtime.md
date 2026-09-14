# Upstream Runtime

## Accepted Runtime

The bundled runtime is the reviewed standalone Node.js CLI asset from the
upstream `miku-text-file-ops` GitHub Release.

| Field | Value |
| --- | --- |
| Upstream repository | `https://github.com/igapyon/miku-text-file-ops` |
| Release | `v0.6.0` |
| Release URL | `https://github.com/igapyon/miku-text-file-ops/releases/tag/v0.6.0` |
| Upstream commit | `923e6ca2ffecb158bb8067fe88430f0bf06dbb07` |
| Asset | `miku-text-file-ops-0.6.0.mjs` |
| Received path | `skills/igapyon-miku-text-file-ops/runtime/miku-text-file-ops-0.6.0.mjs` |
| Received date | 2026-09-15 |
| Size | 721194 bytes |
| SHA-256 | `8308228d3c277394a13a0737f5a0eeabb345a02d1c59827fcd70062404ee939d` |
| Reported version | `0.6.0` |

As the default release-versioning rule, the Agent Skill package version
matches the bundled upstream runtime version. Their major and minor components
must match, but the patch component may differ for a Skill-only bug fix that
does not require a new upstream CLI artifact. Verify both versions
independently from package metadata, artifact provenance, and `--version`.

## First-Execution History

| Skills release | Runtime status |
| --- | --- |
| `v0.3.2` | Planning and repository foundation only. The upstream `v0.3.2` worktree candidate was not accepted because no reviewed Release asset had passed the first-execution gate. |
| `v0.3.5` | Accepted upstream `v0.3.1` standalone CLI and passed the first installed metadata and data-operation execution checks. |
| `v0.4.0` | Adopted the policy that the Skills package and bundled CLI use the same version. |
| `v0.4.1` | Accepted the repository-encoding fix and expanded isolated ZIP verification to the Windows-31J mutation workflow. |
| `v0.5.0` | Accepted the upstream standalone CLI Release asset with the stdin, `--root`, `--json`, and revision-aware agent-facing contract updates. |
| `v0.6.0` | Accepted the upstream standalone CLI Release asset with source-diagnostic completeness reporting and case-insensitive `.git` mutation protection. |

## Artifact Roles

Only `miku-text-file-ops-0.6.0.mjs` is executable in this Skill.

`miku-text-file-ops-runtime-0.6.0.mjs` is an importable API bundle and is not
received or executed. The source archive is not a runtime artifact.

## Verification

Verify every received replacement before wiring or release:

```bash
shasum -a 256 skills/igapyon-miku-text-file-ops/runtime/miku-text-file-ops-<version>.mjs
node skills/igapyon-miku-text-file-ops/runtime/miku-text-file-ops-<version>.mjs --version
node skills/igapyon-miku-text-file-ops/runtime/miku-text-file-ops-<version>.mjs --help
```

Update this document with the new Release, asset, size, digest, received date,
and reported version. Keep the old runtime only when the repository explicitly
supports multiple bundled versions; otherwise replace it after review.
