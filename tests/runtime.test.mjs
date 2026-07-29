import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { resolveRuntimeArtifact } from "../skills/miku-text-file-ops/lib/runtime-artifacts.mjs";
import { runMikuTextFileOps } from "../skills/miku-text-file-ops/lib/run-miku-text-file-ops.mjs";

test("resolver selects newest standalone CLI and excludes importable runtime", () => {
  const runtimeRoot = fs.mkdtempSync(path.join(os.tmpdir(), "miku-text-file-ops-"));
  try {
    fs.writeFileSync(path.join(runtimeRoot, "miku-text-file-ops-0.3.1.mjs"), "x");
    fs.writeFileSync(path.join(runtimeRoot, "miku-text-file-ops-0.10.0.mjs"), "x");
    fs.writeFileSync(path.join(runtimeRoot, "miku-text-file-ops-runtime-99.0.0.mjs"), "x");
    assert.equal(
      resolveRuntimeArtifact({ runtimeRoot }).name,
      "miku-text-file-ops-0.10.0.mjs"
    );
  } finally {
    fs.rmSync(runtimeRoot, { recursive: true, force: true });
  }
});

test("resolver reports a hard error when standalone CLI is absent", () => {
  const runtimeRoot = fs.mkdtempSync(path.join(os.tmpdir(), "miku-text-file-ops-"));
  try {
    fs.writeFileSync(path.join(runtimeRoot, "miku-text-file-ops-runtime-0.3.1.mjs"), "x");
    assert.throws(
      () => resolveRuntimeArtifact({ runtimeRoot }),
      /standalone CLI runtime not found/
    );
  } finally {
    fs.rmSync(runtimeRoot, { recursive: true, force: true });
  }
});

test("bundled runtime exposes version and help metadata", () => {
  const version = runMikuTextFileOps({ args: ["--version"] });
  assert.equal(version.status, 0);
  assert.equal(version.stderr, "");
  assert.equal(version.stdout, "0.3.1\n");

  const help = runMikuTextFileOps({ args: ["--help"] });
  assert.equal(help.status, 0);
  assert.equal(help.stderr, "");
  assert.match(help.stdout, /COMMAND is exactly one of: search, read, create, update, delete/);
});

test("bundled runtime digest and size match the accepted upstream asset", () => {
  const runtime = resolveRuntimeArtifact();
  const bytes = fs.readFileSync(runtime.path);
  assert.equal(bytes.length, 698665);
  assert.equal(
    crypto.createHash("sha256").update(bytes).digest("hex"),
    "148963640dce0259d97a9e878226596c215e4ce00d1de581ebf6c8d0998245d9"
  );
});

test("launcher executes a structured path search", () => {
  const result = runMikuTextFileOps({
    args: ["--root", process.cwd(), "--json", "search"],
    input: `${JSON.stringify({
      mode: "paths",
      projection: "files",
      include: ["README.md"]
    })}\n`
  });
  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
  const response = JSON.parse(result.stdout);
  assert.equal(response.status, "success");
  assert.equal(response.operation, "search");
  assert.ok(response.results.some((record) => record.path === "README.md"));
});
