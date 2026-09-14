# Runtime and Transport

- [Declared artifact and execution contract](#declared-artifact)
- [Metadata checks](#metadata-checks)
- [Agent transport and Windows](#agent-transport)
- [Encoding and failure boundaries](#encoding-boundary)

## Declared Artifact

The executable artifact is:

```text
runtime/miku-text-file-ops-<version>.mjs
```

Resolve it relative to the installed Skill directory. Filename versions use
numeric dot components; select the newest valid standalone CLI deterministically.

Do not match or execute:

```text
runtime/miku-text-file-ops-runtime-<version>.mjs
```

That name identifies the upstream importable runtime API.

## Closed Execution Contract

Treat the installed Skill root and the operated project root as different
locations. For normal data operations, invoke only:

```bash
node "<installed-skill-root>/lib/run-miku-text-file-ops.mjs" \
  --root "<project-root>" --json <command>
```

The launcher resolves the accepted versioned runtime relative to its own
installed location. Request paths are relative to `<project-root>`; the CLI
does not search parent directories for a root.

Do not use `npx`, `npm install`, a bare `miku-text-file-ops` command from
`PATH`, an npm registry search, a network download, or another installed copy.
If the bundled launcher or runtime cannot be used, stop with a hard error.

## Metadata Checks

Direct execution of the versioned artifact is reserved for metadata checks.
It must run both commands successfully without reading stdin:

```bash
node "<installed-skill-root>/runtime/miku-text-file-ops-<version>.mjs" --version
node "<installed-skill-root>/runtime/miku-text-file-ops-<version>.mjs" --help
```

Successful metadata output is UTF-8 on stdout with a final LF and no stderr.
Treat the filename version as artifact-selection input and `--version` as the
startup and identity smoke check.

## Agent Transport

Pass exactly one UTF-8 JSON object without a BOM on stdin. Keep long or
multiline request JSON in a UTF-8 no-BOM temporary file and redirect that file
to stdin instead of expanding it into the command line. This avoids command
length, quoting, newline, and shell-metacharacter problems.

Create collision-resistant temporary files with access limited to the current
user where the host supports it. Preserve stdout, stderr, and the process exit
code separately; do not merge stderr into JSON stdout with `2>&1`. Delete the
exact temporary request and response files after they are no longer needed.

`--json` selects one canonical JSON response on stdout. It does not change the
stdin contract. Parse the response even for a nonzero exit.

### Temporary-File Location

Choose a location already covered by the harness authorization. In a
workspace-only harness, or when external temporary paths trigger repeated
approval prompts, prefer:

```text
<project-root>/workplace/tmp/miku-text-file-ops/
```

When the host already provides a preauthorized secure temporary directory, it
is also suitable.

Treat this as harness-owned operational storage, not as target project content.
Ensure `workplace/` is ignored or exclude `workplace/**` from CLI searches, do
not stage the files, and never place them under a source directory. Use
collision-resistant names, restrict access where supported, and remove only
the exact files created for the invocation. Do not use project-local temporary
storage when its contents could be committed, scanned, or exposed.

The shell redirects the absolute control-file path. Paths inside the request
remain relative to `--root`. The harness creates the UTF-8 no-BOM control JSON;
do not recursively invoke this CLI to create its own request file.

For repeated tests, prefer one repository test process that creates and removes
the exact project-local artifacts over many separate shell create/delete
commands. This reduces approval churn without weakening cleanup.

## Windows `cmd.exe`

Input redirection keeps the CLI process exit code directly observable:

```bat
node "<installed-skill-root>\lib\run-miku-text-file-ops.mjs" ^
  --root "<project-root>" --json read ^
  < "%TEMP%\miku-text-file-ops-request.json" ^
  > "%TEMP%\miku-text-file-ops-response.json" ^
  2> "%TEMP%\miku-text-file-ops-stderr.txt"
set "MIKU_TEXT_FILE_OPS_EXIT=%ERRORLEVEL%"
```

The equivalent `type` pipeline is:

```bat
type "%TEMP%\miku-text-file-ops-request.json" ^
  | node "<installed-skill-root>\lib\run-miku-text-file-ops.mjs" ^
      --root "<project-root>" --json read ^
  > "%TEMP%\miku-text-file-ops-response.json" ^
  2> "%TEMP%\miku-text-file-ops-stderr.txt"
```

Prefer input redirection when the harness must reliably capture the CLI exit
code because pipeline status behavior varies. `type` does not convert the
request encoding: create the file as UTF-8 without a BOM first. Do not rely on
Windows PowerShell defaults that may produce UTF-16 or a BOM.

The same commands may replace `%TEMP%` with a reviewed project-local directory
such as `<project-root>\workplace\tmp\miku-text-file-ops`.

The accepted upstream contract is documented in
[miku-text-file-ops CLI Invocation Contract](https://github.com/igapyon/miku-text-file-ops/blob/923e6ca2ffecb158bb8067fe88430f0bf06dbb07/docs/cli-invocation.md)
and tracked by
[miku-text-file-ops#15](https://github.com/igapyon/miku-text-file-ops/issues/15).

The `v0.6.0` runtime additionally treats scan diagnostics as incomplete
discovery and protects mutation paths whose first segment is `.git` without
regard to ASCII letter case.

## Encoding Boundary

The request and response control JSON are always UTF-8, and request stdin must
not contain a BOM. Target files may use Windows-31J or a supported UTF
encoding. Delegate target decoding, encoding, and conversion to the bundled
CLI; see [encoding-policy.md](encoding-policy.md).

## Failure

Missing, empty, unstartable, or wrongly named artifacts are hard errors. Report
the expected directory and ask for a reviewed upstream standalone CLI Release
asset. Never substitute the importable runtime, a source archive, native file
tools, Java, MCP, or an externally obtained CLI.
