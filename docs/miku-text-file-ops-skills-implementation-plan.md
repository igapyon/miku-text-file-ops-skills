# miku-text-file-ops-skills Implementation Plan

## Status

Validated implementation plan.

Checked on 2026-07-30 against the current local documentation under
`miku-text-file-ops/docs/` and the current miku-soft Agent Skills naming
convention.

This document plans work in the `miku-text-file-ops-skills` repository. It does
not change the product semantics owned by the upstream `miku-text-file-ops`
repository.

## Conclusion

Build `miku-text-file-ops-skills` as a CLI-backed Agent Skill that bundles the
standalone Node.js CLI release artifact.

The plan is consistent with the upstream specification and accepted Agent Skill
integration design after these clarifications:

- Keep the Agent Skill package version and bundled product runtime version
  identical by default. Require their major and minor components to match, but
  allow the patch component to differ for a Skill-only bug fix that does not
  require a new upstream CLI artifact.
- Verify the product runtime version with artifact provenance and `--version`;
  never infer it only from the Agent Skill package version.
- If the declared CLI artifact is missing or unusable, stop with a hard runtime
  error and recovery instructions. Do not switch silently to native patching,
  the importable runtime bundle, Java, or MCP.
- Leave workspace authorization, sandbox enforcement, external-root access, and
  destructive-operation approval to the host or agent harness.
- Resolve and invoke the bundled launcher from the installed Skill root. Do not
  search npm, use `npx`, install a replacement, or rely on a bare command name.
- Pass large request JSON as UTF-8 without BOM through stdin. In a
  workspace-only harness, prefer ignored control files under
  `<project-root>/workplace/tmp/miku-text-file-ops/`; a host-authorized secure
  OS temporary directory remains valid.
- Keep encoding-sensitive work routed through this Skill for the current task,
  project root, and matching path or encoding rule. Do not extend that routing
  to unrelated ordinary UTF-8 files.
- Do not advertise work-in-progress JSONL, exhaustive-stream, artifact,
  continuation, capability-cache, `doctor`, or state-management behavior.

## Upstream Documentation Review

The following authority order was confirmed from the upstream documentation
index:

1. `docs/specification.md` owns public product semantics.
2. `docs/agent-integration.md` owns Agent Skill discovery and routing, subject
   to the specification.
3. `docs/implementation-strategy.md` owns implementation provenance, subject to
   the specification.
4. `docs/release-and-bundles.md` owns accepted upstream build and release
   operations.
5. Files under `docs/notes/` are work in progress and are not callable product
   behavior.

The plan was checked against every Markdown file currently listed in the
upstream `docs` directory:

| Upstream document | Confirmed consequence for this repository |
| --- | --- |
| `docs/README.md` | The primary distribution is an Agent Skill with a bundled CLI; ordinary UTF-8 work remains with native tools. |
| `docs/specification.md` | The Skill is a thin adapter over the five operations and must not implement encoding, path, patch, revision, or result semantics. |
| `docs/agent-integration.md` | Activation, projection-first search, range-first read, packaging size, canonical launcher, and forward-testing rules belong in this repository. |
| `docs/implementation-strategy.md` | Use the new upstream runtime; do not port source, schemas, fixtures, or compatibility behavior from `miku-grep` or `miku-readfile`. |
| `docs/release-and-bundles.md` | Bundle the standalone CLI asset, not the importable runtime bundle or source archive as the executable. |
| `docs/notes/search-scaling-and-artifact-delivery.md` | JSONL, exhaustive delivery, artifacts, auto-spill, and continuation remain out of scope. |
| `docs/notes/environment-capability-cache.md` | Capability caching and administrative commands remain out of scope. |

At review time, the upstream local checkout was at commit `2a4cac1` with tag
`v0.3.1`. Its worktree contained an uncommitted version-only update to `0.3.2`,
including the version examples in `docs/release-and-bundles.md`. This dirty
worktree is design evidence only. Runtime intake must use a reviewed upstream
release artifact and a pinned tag or commit.

## Product Boundary

The Agent Skill may own:

- activation and non-activation rules
- deterministic runtime artifact lookup
- a canonical CLI launcher
- search projection and read-range workflow guidance
- revision handoff guidance
- structured response and exit-code handling guidance
- references, examples, tests, installation bundles, and release automation

The Agent Skill must not own:

- text decoding or encoding
- repository encoding-rule merging
- path containment or symlink policy
- ignore or glob semantics
- safe regular-expression implementation
- logical-line behavior
- contextual patch matching or application
- revision calculation
- atomic mutation
- output-budget calculation
- result-envelope construction
- diagnostic-code definitions

Repository encoding configuration remains an upstream core concern at
`.mikusoft/miku-text-file-ops.json`. A Skill helper may pass requests to the
runtime but must not merge or reinterpret that configuration.

## Naming and Version Decisions

Use these names:

- repository: `miku-text-file-ops-skills`
- npm orchestration package: `miku-text-file-ops-skills`
- Agent Skill frontmatter name: `igapyon-miku-text-file-ops`
- installed Skill directory: `skills/igapyon-miku-text-file-ops/`
- upstream CLI artifact:
  `skills/igapyon-miku-text-file-ops/runtime/miku-text-file-ops-<product-version>.mjs`
- release ZIP:
  `igapyon-miku-text-file-ops-skills-<skill-package-version>.zip`

The formal installed Skill identity follows the miku-soft Agent Skills naming
convention and uses the `igapyon-` prefix. The product name, CLI name,
repository name, npm orchestration package, runtime artifact names, and
release ZIP name remain unchanged. `miku-text-file-ops` and
`miku-text-file-ops-skills` remain compatibility triggers without creating
additional Skill identities or directories.

Maintain two explicit version records:

- `skillPackageVersion`: the version in this repository's `package.json`
- `bundledProductVersion`: the version reported by the received upstream CLI

As the repository's default release-versioning rule, these versions are
identical. Their major and minor components must match. The patch component
may differ for a Skill-only bug fix that does not require a new upstream CLI
artifact. Verify both records independently so that accidental major/minor
drift fails before release.

The upstream package and CLI bundle currently target Node.js 22. Set this
repository's installed runtime requirement to Node.js `>=22`, verify Node.js 22
as the minimum, and use Node.js 24 as the release-build baseline.

## Initial Repository Shape

```text
README.md
TODO.md
LICENSE
THIRD_PARTY_NOTICES.md
package.json
package-lock.json
.gitignore
.github/
  workflows/
    ci.yml
    release-build.yml
docs/
  development.md
  miku-soft-reference.md
  upstream-runtime.md
  forward-testing.md
  miku-text-file-ops-skills-implementation-plan.md
scripts/
  build-skill-bundle.mjs
  build-skill-bundle-zip.mjs
skills/
  igapyon-miku-text-file-ops/
    SKILL.md
    index.json
    agents/
      openai.yaml
    references/
      INDEX.md
      search-read.md
      mutations.md
      response-handling.md
      encoding-policy.md
      runtime.md
      workflow.md
    lib/
      runtime-artifacts.mjs
      cli-runner.mjs
    runtime/
      miku-text-file-ops-<product-version>.mjs
    licenses/
      UNICODE-LICENSE.txt
tests/
workplace/
  .gitkeep
```

`agents/openai.yaml` is optional metadata. Keep it only if it contributes useful
installed Skill metadata.

## Implementation Phases

### Phase 0: Pin and Receive the Upstream Runtime

1. Select the upstream GitHub Release, tag, and commit used as the
   compatibility source.
2. Accept only the reviewed Release asset for the version selected by the
   Skills package; the current accepted version is `v0.6.0`.
3. Have a human place the standalone CLI release asset under
   `skills/igapyon-miku-text-file-ops/runtime/`.
4. Record the original asset URL, release tag, commit, received filename,
   received date, file size, and SHA-256 in `docs/upstream-runtime.md`.
5. Verify that `--version` and `--help`:
   - exit with status `0`
   - do not read stdin
   - write UTF-8 with a final LF to stdout
   - write nothing to stderr
6. Do not use the importable `miku-text-file-ops-runtime-<version>.mjs` as an
   executable.
7. Do not use a locally rebuilt artifact from an uncommitted upstream worktree
   as the release input.

This phase is a gate for runtime wiring, bundle verification, and isolated
runtime smoke tests.

### Phase 1: Establish Repository Conventions

1. Create repository metadata and npm orchestration files.
2. Keep `package.json` private; npm publication is not part of this product.
3. Add `.gitignore` entries for:
   - `.DS_Store`
   - `node_modules/`
   - `.npm-cache/`
   - `dist/`
   - `bundle/`
   - `release-assets/`
   - `coverage/`
   - logs
   - `.vscode/mcp.json`
   - `.codex/skills/`
   - all `workplace/` contents except `.gitkeep`
4. Document canonical source, generated files, local deployment, and
   `workplace/` use in `README.md`.
5. Record miku-soft reference date, Skill revision, and workflow in
   `docs/miku-soft-reference.md`.

Use `miku-indexgen-skills` only as a shape reference for current naming,
installable bundles, generated `index.json`, and isolated bundle smoke tests.
Use `miku-readfile-skills` only as a shape reference for compact CLI-backed
runtime wiring and narrow activation tests. Do not copy either repository
wholesale or import their product logic.

### Phase 2: Implement the Thin Runtime Adapter

Implement `skills/igapyon-miku-text-file-ops/lib/runtime-artifacts.mjs` to:

- resolve artifacts relative to the installed Skill directory rather than the
  caller's current directory
- accept only standalone CLI names matching
  `miku-text-file-ops-<version>.mjs`
- reject or ignore `miku-text-file-ops-runtime-<version>.mjs`
- select versioned artifacts deterministically
- fail clearly when no valid artifact exists

Implement `skills/igapyon-miku-text-file-ops/lib/cli-runner.mjs` to:

- invoke Node.js with the resolved standalone CLI
- pass `--root`, `--json`, and one of the five operation commands unchanged
- pass the UTF-8 request JSON through stdin
- preserve stdout, stderr, process status, and signal
- avoid parsing and rewriting the canonical JSON response unless a test needs
  to inspect it

Do not add a Java preference, MCP fallback, result formatter, repository config
merger, or a parallel operation implementation.

The runtime fallback rule is:

1. use the declared standalone CLI artifact
2. if it is missing or unusable, stop
3. report the expected location and recovery action
4. never continue an encoding-sensitive mutation with an unrelated tool

### Phase 3: Author the Agent Skill Contract

Use the upstream recommended frontmatter description, keeping it at or below
100 words.

Target at most 200 lines for `SKILL.md`; treat 500 lines as the hard review
threshold. Keep only:

- activation and non-activation rules
- workspace-root and runtime-path setup
- projection selection
- range-first reading
- revision and mutation safety rules
- canonical launcher usage
- response and exit-code handling
- fallback behavior
- direct reference routing

Place full requests, result details, diagnostics, encoding configuration, and
extended examples in one-level-deep files under `references/`. Link every
reference directly from `SKILL.md` and state when it should be read.

Do not duplicate the same rule in `SKILL.md` and a reference.

### Phase 4: Encode the Accepted Agent Workflow

The Skill workflow must implement these accepted routing rules:

1. Fix the workspace root before invoking the CLI.
2. Confirm the bundled CLI path once.
3. Use `search` when candidates must be identified.
4. For broad searches, choose the smallest useful projection:
   - existence or quantity: `count`
   - broad shape and scan health: `summary`
   - candidate paths: `files`
   - selective source evidence: `matches`
5. Use zero search-context lines by default.
6. Around match line `L`, initially read
   `max(1, L - 40)` through `L + 40`.
7. Merge overlapping ranges for the same file, splitting a merged range into
   bounded adjacent ranges when it exceeds the effective per-item line limit.
8. If no match line is known, start with `firstLines: 120`.
9. Use full-file read only when most of the file is needed and its known raw
   size is at most 16 KiB, or when the user explicitly asks for the whole file.
10. Treat `partial`, lower-bound counts, `exact: false`, skipped items,
    `remainingRanges`, and `usage.nextItemIndex` as incomplete evidence.
11. Resubmit only still-needed unprocessed items when `usage.nextItemIndex` is
    present, and never combine bounded responses into unbounded model output.
12. Refine the query before raising a limit; raise it only for a concrete
    exhaustive requirement within the host ceiling.
13. For `update`, obtain all required patch context and the full-file raw-byte
    revision with a bounded `read`; a full-file read is not required.
14. For `delete`, confirm the target and obtain its revision without requiring
    unrelated source text.
15. For `create`, do not read a nonexistent target.
16. Perform one single-file mutation per invocation.
17. Prefer `context-diff` for updates.
18. On `stale_revision`, read again and rebuild the request; do not retry
    blindly. Compare the reread context with the intended edit, continue only
    when the edit can be rebuilt safely, and ask the user when intervening
    changes overlap or invalidate the intended mutation.
19. Treat a successful mutation result as authoritative and re-read only when
    semantic confirmation is needed.
20. Once encoding-sensitive work activates the Skill, continue using it for
    matching search, read, mutation, verification, test-follow-up, and stale
    recovery within the current task and project root.
21. Keep control JSON separate from target text encoding. Control JSON is
    UTF-8 without BOM; target decoding and writing remain governed by the CLI
    request and `.mikusoft/miku-text-file-ops.json`.

For an encoding-sensitive target, never read with `miku-text-file-ops` and then
write with an unrelated patch tool.

### Phase 5: Add Verification

Automate at least these tests:

- runtime resolver accepts the standalone CLI
- runtime resolver ignores the importable runtime bundle
- missing runtime is a hard error
- version selection is deterministic
- `--version` metadata smoke
- `--help` metadata smoke
- path-mode and content-mode search
- bounded and partial read handling
- `create -> read -> context-diff update -> delete` in a temporary workspace
- Windows-31J preservation
- BOM, newline kind, mixed newline, and final-newline preservation
- stale revision failure
- encode and decode failure visibility
- exit `0`, `1`, `2`, and `3` handling without discarding structured output
- host approval boundary wording for destructive delete
- positive, recovery, negative, explicit, and ambiguous activation prompts
- actual bundled CLI invocation for every positive routing case
- 81-line window, 120-line initial read, 16 KiB full-read threshold, overlapping
  range merge, and refine-before-limit-raise behavior
- `SKILL.md` line, word, and UTF-8 byte counts
- frontmatter description word count
- direct reference links
- required `index.json`
- release ZIP contents and exclusions
- isolated installed-bundle runtime execution

Use isolated temporary directories for mutation tests. When the harness limits
write access to the project or repeatedly asks for external-root approval,
prefer ignored paths under `workplace/tmp/miku-text-file-ops/`. Create and
remove exact test artifacts inside one repository test process where practical;
do not use broad cleanup commands. Tests do not authorize destructive
operations against user workspaces.

Run repository tests with Node.js 22 and 24. Use Node.js 24 for the release
bundle build.

### Phase 6: Build Installable Bundles

Provide:

```text
npm test
npm run build:bundle
npm run build:bundle:zip
```

The installable directory and ZIP must contain:

- `skills/igapyon-miku-text-file-ops/SKILL.md`
- generated `index.json`
- required references
- required helper files
- the standalone CLI artifact
- required license and notice files

Exclude:

- `tests/`
- repository-level `docs/`
- `workplace/`
- `node_modules/`
- `bundle/`
- `.DS_Store`
- temporary `tmp/`, `output/`, and `state/` content
- the importable runtime bundle
- the upstream source archive

Add:

- `.github/workflows/ci.yml` for push and pull-request verification
- `.github/workflows/release-build.yml` for building and attaching the Skills
  ZIP after a human publishes a matching GitHub Release

Use Node 24-aware Action majors. The local workflow may prepare and attach the
ZIP, but repository creation, tag selection, release publication, branch push,
and pull-request creation remain human GitHub operations.

The upstream release workflow and the Skills release workflow are separate.
The upstream workflow explicitly does not create or update an Agent Skill.

### Phase 7: Generate Discovery Metadata and Finish Documentation

1. Generate `skills/igapyon-miku-text-file-ops/index.json` with
   `miku-indexgen`.
2. Never hand-edit generated `index.json`.
3. Regenerate it after changing bundled Markdown, JSON, helper, or runtime
   files.
4. Add a structural test that detects missing or stale indexed paths.
5. Document runtime provenance and update procedure.
6. Include Apache-2.0 and required third-party notices, including the Unicode
   license associated with the upstream runtime data.
7. Document installation and local synchronization without committing a
   user-local `.codex/skills/` copy.

### Phase 8: Forward-Test Agent Behavior

Use raw task prompts with Codex and, where practical, Qwen Code.

The golden prompt set must cover:

- explicit `igapyon-miku-text-file-ops` invocation
- compatibility invocation through `miku-text-file-ops` or
  `miku-text-file-ops-skills`
- Windows-31J preservation
- mixed-encoding search
- BOM and newline preservation
- recovery after mojibake or decode failure
- ordinary UTF-8 README editing that must not trigger
- ordinary source search that must not trigger
- binary-file work that must not trigger
- broad inventory, exact count, candidate selection, selective match, partial
  search, and partial multi-item read

For every positive case, confirm both Skill selection and actual bundled CLI
execution. Selection without CLI execution is a failure.

## Out of Scope for the Initial Skills Release

- Java runtime packaging or preference
- automatic MCP registration or fallback
- handoff-only execution as a replacement for the missing CLI
- importable runtime bundle execution
- source archive execution
- JSONL
- exhaustive stream delivery
- managed artifact delivery
- continuation tokens
- environment capability cache
- `doctor`, `capabilities`, or `state` commands
- npm publication
- multi-file mutation transactions
- copied implementations, schemas, tests, fixtures, or compatibility aliases
  from `miku-grep` or `miku-readfile`

## Completion Criteria

The initial repository is ready when:

- the upstream repository URL, tag, commit, artifact, SHA-256, and product
  version are pinned
- the Skill package and bundled product runtime major/minor versions match,
  with any patch-only difference documented as a Skill-only bug fix
- the standalone CLI is the only bundled execution artifact
- `SKILL.md` has the accepted trigger and non-trigger boundary
- the Skill does not duplicate core semantics
- all references are directly routed and progressively disclosed
- all automated tests pass on Node.js 22 and 24
- the Windows-31J and revision-guarded mutation workflow passes end to end
- partial results and nonzero structured responses remain visible
- the installable directory and release ZIP pass content checks
- the isolated ZIP can execute `--version`, `--help`, and representative data
  operations
- `index.json` is generated and current
- license and provenance records are included
- positive routing tests invoke the bundled CLI
- negative routing tests remain with ordinary native tools
- no work-in-progress upstream surface is advertised as accepted behavior

## First Execution Gate History

This gate is complete. The Skills `v0.3.2` release established the plan and
repository foundation without wiring an unreviewed runtime. The project then
intentionally accepted the upstream `v0.3.1` Release asset in Skills `v0.3.5`
and passed the first installed metadata and data-operation checks.

The uncommitted upstream `0.3.2` worktree candidate was never used as release
input. Later runtime updates continue to require a reviewed Release asset,
recorded provenance, an independent digest and version check, and isolated
bundle execution.
