import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { resolveRuntimeArtifact } from "../skills/igapyon-miku-text-file-ops/lib/runtime-artifacts.mjs";
import { runMikuTextFileOps } from "../skills/igapyon-miku-text-file-ops/lib/run-miku-text-file-ops.mjs";

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
  assert.equal(version.stdout, "0.4.1\n");

  const help = runMikuTextFileOps({ args: ["--help"] });
  assert.equal(help.status, 0);
  assert.equal(help.stderr, "");
  assert.match(help.stdout, /COMMAND is exactly one of: search, read, create, update, delete/);
});

test("package and bundled runtime versions follow the patch-drift policy", () => {
  const packageJson = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), "package.json"), "utf8")
  );
  const version = runMikuTextFileOps({ args: ["--version"] });
  assert.equal(version.status, 0);
  assert.equal(version.stderr, "");
  const packageParts = packageJson.version.split(".").map(Number);
  const runtimeParts = version.stdout.trim().split(".").map(Number);
  assert.deepEqual(packageParts.slice(0, 2), runtimeParts.slice(0, 2));
  assert.deepEqual(packageParts, [0, 4, 2]);
  assert.deepEqual(runtimeParts, [0, 4, 1]);
});

test("bundled runtime digest and size match the accepted upstream asset", () => {
  const runtime = resolveRuntimeArtifact();
  const bytes = fs.readFileSync(runtime.path);
  assert.equal(bytes.length, 718307);
  assert.equal(
    crypto.createHash("sha256").update(bytes).digest("hex"),
    "af5c3c80eb48e1e8890e439015fd177d242b50e5af87d24b73d0dda5f7c7ef73"
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
    include: ["skills/igapyon-miku-text-file-ops/SKILL.md"]
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
      path: "skills/igapyon-miku-text-file-ops/SKILL.md",
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
      path: "skills/igapyon-miku-text-file-ops/SKILL.md",
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

test("partial count remains a lower bound instead of a false exact total", () => {
  const { result, response } = runJson("search", {
    mode: "paths",
    projection: "count",
    limits: { maxFilesVisited: 1 }
  });
  assert.equal(result.status, 1);
  assert.equal(response.status, "partial");
  assert.equal(response.completeness.complete, false);
  const summary = response.results.find(
    (record) => record.type === "searchSummary"
  );
  assert.equal(summary.scanComplete, false);
  assert.equal(summary.filesMatched, null);
  assert.equal(summary.filesMatchedAtLeast, 1);
});

test("partial multi-item read exposes a suffix-only resubmission point", () => {
  const items = [
    { path: "README.md", firstLines: 1 },
    { path: "skills/igapyon-miku-text-file-ops/SKILL.md", firstLines: 1 }
  ];
  const { result, response } = runJson("read", {
    items,
    limits: { maxItems: 1 }
  });
  assert.equal(result.status, 1);
  assert.equal(response.status, "partial");
  assert.equal(response.usage.nextItemIndex, 1);
  assert.equal(response.usage.itemsProcessed, 1);
  assert.equal(response.usage.itemsSkipped, 1);

  const continuation = runJson("read", {
    items: items.slice(response.usage.nextItemIndex)
  });
  assert.equal(continuation.result.status, 0);
  assert.equal(continuation.response.results[0].path, items[1].path);
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
