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
  assert.equal(version.stdout, "0.4.0\n");

  const help = runMikuTextFileOps({ args: ["--help"] });
  assert.equal(help.status, 0);
  assert.equal(help.stderr, "");
  assert.match(help.stdout, /COMMAND is exactly one of: search, read, create, update, delete/);
});

test("package version matches the bundled runtime version", () => {
  const packageJson = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), "package.json"), "utf8")
  );
  const version = runMikuTextFileOps({ args: ["--version"] });
  assert.equal(version.status, 0);
  assert.equal(version.stderr, "");
  assert.equal(version.stdout, `${packageJson.version}\n`);
});

test("bundled runtime digest and size match the accepted upstream asset", () => {
  const runtime = resolveRuntimeArtifact();
  const bytes = fs.readFileSync(runtime.path);
  assert.equal(bytes.length, 698665);
  assert.equal(
    crypto.createHash("sha256").update(bytes).digest("hex"),
    "f505fc005e4016b96392b00701cadb19deab417d1c2593a37b926e707300b582"
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

test("launcher supports projection routing from count through matches", () => {
  const cases = [
    {
      projection: "count",
      request: {
        mode: "paths",
        projection: "count",
        include: ["skills/**/*.md"]
      },
      expectedType: "searchSummary"
    },
    {
      projection: "summary",
      request: {
        mode: "paths",
        projection: "summary",
        include: ["skills/**"]
      },
      expectedType: "facet"
    },
    {
      projection: "files",
      request: {
        mode: "paths",
        projection: "files",
        include: ["skills/**/*.md"]
      },
      expectedType: "file"
    },
    {
      projection: "matches",
      request: {
        mode: "content",
        pattern: "projection",
        syntax: "literal",
        projection: "matches",
        include: ["skills/**/*.md"]
      },
      expectedType: "match"
    }
  ];

  for (const entry of cases) {
    const { result, response } = runJson("search", entry.request);
    assert.equal(result.status, 0, entry.projection);
    assert.equal(result.stderr, "", entry.projection);
    assert.equal(response.status, "success", entry.projection);
    assert.equal(response.completeness.complete, true, entry.projection);
    assert.ok(
      response.results.some((record) => record.type === entry.expectedType),
      entry.projection
    );
  }
});

test("launcher supports range-first reads for known and unknown match lines", () => {
  const { response: search } = runJson("search", {
    mode: "content",
    pattern: "projection",
    syntax: "literal",
    projection: "matches",
    include: ["skills/miku-text-file-ops/SKILL.md"]
  });
  const match = search.results.find((record) => record.type === "match");
  assert.ok(match);

  const startLine = Math.max(1, match.line - 40);
  const endLine = match.line + 40;
  const { result: rangedResult, response: ranged } = runJson("read", {
    items: [{
      path: match.path,
      range: { startLine, endLine }
    }]
  });
  assert.equal(rangedResult.status, 0);
  assert.deepEqual(
    ranged.results[0].requestedSelection,
    { range: { endLine, startLine } }
  );
  assert.equal(ranged.results[0].returnedRange.startLine, startLine);
  assert.ok(ranged.results[0].returnedRange.endLine <= endLine);

  const { result: initialResult, response: initial } = runJson("read", {
    items: [{
      path: "skills/miku-text-file-ops/SKILL.md",
      firstLines: 120
    }]
  });
  assert.equal(initialResult.status, 0);
  assert.deepEqual(initial.results[0].requestedSelection, { firstLines: 120 });
  assert.equal(initial.results[0].returnedRange.startLine, 1);
});

test("launcher preserves actionable partial search and read results", () => {
  const { result: searchResult, response: search } = runJson("search", {
    mode: "content",
    pattern: "Skill",
    syntax: "literal",
    projection: "matches",
    include: ["skills/**/*.md"],
    limits: {
      maxMatches: 1,
      maxMatchesPerFile: 1
    }
  });
  assert.equal(searchResult.status, 1);
  assert.equal(search.status, "partial");
  assert.equal(search.completeness.complete, false);
  assert.ok(search.completeness.reasons.includes("match_limit"));
  assert.ok(search.results.some((record) => record.type === "match"));

  const { result: readResult, response: read } = runJson("read", {
    items: [{
      path: "skills/miku-text-file-ops/SKILL.md",
      range: { startLine: 1, endLine: 20 }
    }],
    limits: {
      maxLinesPerItem: 2
    }
  });
  assert.equal(readResult.status, 1);
  assert.equal(read.status, "partial");
  assert.equal(read.completeness.complete, false);
  assert.ok(read.completeness.reasons.includes("line_limit"));
  assert.deepEqual(read.results[0].returnedRange, {
    endLine: 2,
    startLine: 1
  });
  assert.deepEqual(read.results[0].remainingRanges, [{
    endLine: 20,
    startLine: 3
  }]);
});

function runJson(command, request) {
  const result = runMikuTextFileOps({
    args: ["--root", process.cwd(), "--json", command],
    input: `${JSON.stringify(request)}\n`
  });
  return {
    result,
    response: JSON.parse(result.stdout)
  };
}
