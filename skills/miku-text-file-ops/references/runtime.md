# Runtime

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

## Metadata Checks

The selected CLI must run both commands successfully without reading stdin:

```bash
node runtime/miku-text-file-ops-<version>.mjs --version
node runtime/miku-text-file-ops-<version>.mjs --help
```

Successful metadata output is UTF-8 on stdout with a final LF and no stderr.
Treat the filename version as artifact-selection input and `--version` as the
startup and identity smoke check.

## Failure

Missing, empty, unstartable, or wrongly named artifacts are hard errors. Report
the expected directory and ask for a reviewed upstream standalone CLI Release
asset. Never substitute the importable runtime, a source archive, native file
tools, Java, or MCP.
