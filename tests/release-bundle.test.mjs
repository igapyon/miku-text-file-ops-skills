import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import test from "node:test";

import { resolveRuntimeArtifact } from "../skills/igapyon-miku-text-file-ops/lib/runtime-artifacts.mjs";

const root = process.cwd();
const packageJson = JSON.parse(fs.readFileSync(path.resolve(root, "package.json"), "utf8"));
const runtime = resolveRuntimeArtifact();
const zipPath = path.resolve(
  root,
  `bundle/igapyon-miku-text-file-ops-skills-${packageJson.version}.zip`
);

test("release zip contains the installable Skill and standalone runtime only", () => {
  execFileSync("node", ["scripts/build-skill-bundle-zip.mjs"], {
    cwd: root,
    stdio: "pipe"
  });
  const entries = execFileSync("unzip", ["-Z1", zipPath], {
    cwd: root,
    encoding: "utf8"
  }).trim().split(/\n/).filter(Boolean);

  for (const required of [
    "skills/igapyon-miku-text-file-ops/SKILL.md",
    "skills/igapyon-miku-text-file-ops/index.json",
    "skills/igapyon-miku-text-file-ops/lib/runtime-artifacts.mjs",
    "skills/igapyon-miku-text-file-ops/lib/run-miku-text-file-ops.mjs",
    "skills/igapyon-miku-text-file-ops/references/encoding-policy.md",
    `skills/igapyon-miku-text-file-ops/runtime/${runtime.name}`,
    "skills/igapyon-miku-text-file-ops/licenses/LICENSE",
    "skills/igapyon-miku-text-file-ops/licenses/UNICODE-LICENSE.txt"
  ]) {
    assert.ok(entries.includes(required), `missing zip entry: ${required}`);
  }
  assert.equal(
    entries.filter((entry) =>
      /^skills\/igapyon-miku-text-file-ops\/runtime\/miku-text-file-ops-[0-9.]+\.mjs$/.test(entry)
    ).length,
    1
  );
  assert.equal(
    entries.some((entry) => entry.startsWith("skills/miku-text-file-ops/")),
    false
  );
  assert.equal(entries.some((entry) => entry.includes("-runtime-")), false);
  assert.equal(entries.some((entry) => entry.startsWith("tests/")), false);
  assert.equal(entries.some((entry) => entry.startsWith("docs/")), false);
  assert.equal(entries.some((entry) => entry.includes("workplace/")), false);
});

test("isolated extracted bundle runs runtime metadata through its launcher", () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "miku-text-file-ops-bundle-"));
  try {
    execFileSync("unzip", ["-q", zipPath, "-d", temporaryRoot]);
    const launcher = path.resolve(
      temporaryRoot,
      "skills/igapyon-miku-text-file-ops/lib/run-miku-text-file-ops.mjs"
    );
    assert.equal(
      execFileSync(process.execPath, [launcher, "--version"], { encoding: "utf8" }),
      `${runtime.version}\n`
    );
    const help = execFileSync(
      process.execPath,
      [launcher, "--help"],
      { encoding: "utf8" }
    );
    assert.match(help, /SEARCH REQUEST/);
    assert.match(help, /READ REQUEST/);
    assert.match(help, /CREATE REQUEST/);
    assert.match(help, /UPDATE REQUEST/);
    assert.match(help, /DELETE REQUEST/);
    assert.match(help, /EXIT CODES/);
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test("isolated extracted bundle accepts a UTF-8 no-BOM temporary request file", () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "miku-text-file-ops-transport-"));
  let requestPath;
  let requestDescriptor;
  try {
    execFileSync("unzip", ["-q", zipPath, "-d", temporaryRoot]);
    const launcher = path.resolve(
      temporaryRoot,
      "skills/igapyon-miku-text-file-ops/lib/run-miku-text-file-ops.mjs"
    );
    const workspace = path.resolve(temporaryRoot, "separate-project-root");
    fs.mkdirSync(workspace);
    const controlDirectory = path.resolve(
      workspace,
      "workplace/tmp/miku-text-file-ops"
    );
    fs.mkdirSync(controlDirectory, { recursive: true, mode: 0o700 });
    requestPath = path.resolve(controlDirectory, "request-create-unique.json");
    fs.writeFileSync(path.resolve(workspace, ".gitignore"), "workplace/\n");
    const content = Array.from(
      { length: 200 },
      (_, index) => `日本語の長い入力 ${index + 1}`
    ).join("\n") + "\n";
    fs.writeFileSync(
      requestPath,
      `${JSON.stringify({
        path: "temporary-input.txt",
        content
      }, null, 2)}\n`,
      { encoding: "utf8", mode: 0o600 }
    );
    assert.notDeepEqual(
      [...fs.readFileSync(requestPath).subarray(0, 3)],
      [0xef, 0xbb, 0xbf]
    );

    requestDescriptor = fs.openSync(requestPath, "r");
    const result = spawnSync(
      process.execPath,
      [launcher, "--root", workspace, "--json", "create"],
      {
        encoding: "utf8",
        stdio: [requestDescriptor, "pipe", "pipe"]
      }
    );
    fs.closeSync(requestDescriptor);
    requestDescriptor = undefined;

    assert.equal(result.error, undefined);
    assert.equal(result.status, 0);
    assert.equal(result.stderr, "");
    const response = JSON.parse(result.stdout);
    assert.equal(response.status, "success");
    assert.equal(response.results[0].path, "temporary-input.txt");
    assert.equal(
      fs.readFileSync(path.resolve(workspace, "temporary-input.txt"), "utf8"),
      content
    );

    fs.unlinkSync(requestPath);
    assert.equal(fs.existsSync(requestPath), false);
  } finally {
    if (requestDescriptor !== undefined) {
      fs.closeSync(requestDescriptor);
    }
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test("isolated extracted bundle preserves a Windows-31J mutation workflow", () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "miku-text-file-ops-bundle-"));
  try {
    execFileSync("unzip", ["-q", zipPath, "-d", temporaryRoot]);
    const launcher = path.resolve(
      temporaryRoot,
      "skills/igapyon-miku-text-file-ops/lib/run-miku-text-file-ops.mjs"
    );
    const workspace = path.resolve(temporaryRoot, "workspace");
    fs.mkdirSync(path.resolve(workspace, ".mikusoft"), { recursive: true });
    fs.mkdirSync(path.resolve(workspace, "src"), { recursive: true });
    fs.writeFileSync(
      path.resolve(workspace, ".mikusoft/miku-text-file-ops.json"),
      `${JSON.stringify({
        schemaVersion: 1,
        encodingRules: [
          { glob: "**/*.java", encoding: "windows-31j" },
          { glob: "**/*.jsp", encoding: "windows-31j" }
        ],
        defaults: {
          encoding: "utf-8",
          lineEnding: "crlf",
          bom: false
        }
      })}\n`
    );

    const create = runJson(launcher, workspace, "create", {
      path: "src/Legacy.java",
      content: "旧\n値\n"
    });
    assert.equal(create.status, "success");
    assert.equal(create.results[0].encoding, "windows-31j");
    assert.equal(create.results[0].lineEnding, "crlf");
    assert.equal(create.results[0].bom, false);

    const initialRead = runJson(launcher, workspace, "read", {
      items: [{ path: "src/Legacy.java", full: true }]
    });
    assert.equal(initialRead.status, "success");
    assert.equal(initialRead.results[0].encoding, "windows-31j");
    assert.equal(initialRead.results[0].encodingSource, "repositoryRule");
    assert.equal(initialRead.results[0].lineEnding, "crlf");
    assert.equal(initialRead.results[0].finalNewline, true);

    const update = runJson(launcher, workspace, "update", {
      path: "src/Legacy.java",
      expectedRevision: initialRead.results[0].revision,
      change: {
        type: "context-diff",
        diff: "@@\n-値\n+新\n"
      }
    });
    assert.equal(update.status, "success");
    assert.equal(update.results[0].encoding, "windows-31j");
    assert.equal(update.results[0].lineEnding, "crlf");

    const updatedRead = runJson(launcher, workspace, "read", {
      items: [{ path: "src/Legacy.java", full: true }]
    });
    assert.equal(updatedRead.results[0].text, "旧\n新\n");
    assert.equal(updatedRead.results[0].finalNewline, true);

    const stale = runJsonResult(launcher, workspace, "update", {
      path: "src/Legacy.java",
      expectedRevision: initialRead.results[0].revision,
      change: {
        type: "context-diff",
        diff: "@@\n-新\n+値\n"
      }
    });
    assert.equal(stale.exitCode, 3);
    assert.equal(stale.response.status, "failed");
    const staleDiagnostic = stale.response.diagnostics[0];
    assert.equal(staleDiagnostic.code, "stale_revision");
    assert.equal(staleDiagnostic.path, "src/Legacy.java");
    assert.equal(
      staleDiagnostic.details.expectedRevision,
      initialRead.results[0].revision
    );
    assert.equal(
      staleDiagnostic.details.actualRevision,
      updatedRead.results[0].revision
    );
    assert.equal(
      staleDiagnostic.details.recovery,
      "reread_and_rebuild_request"
    );
    assert.equal(staleDiagnostic.details.retryUnchangedRequest, false);
    const afterStale = runJson(launcher, workspace, "read", {
      items: [{ path: "src/Legacy.java", full: true }]
    });
    assert.equal(afterStale.results[0].text, "旧\n新\n");
    assert.equal(afterStale.results[0].revision, updatedRead.results[0].revision);

    fs.writeFileSync(path.resolve(workspace, "src/Empty.java"), "");
    const emptyRead = runJson(launcher, workspace, "read", {
      items: [{ path: "src/Empty.java", full: true }]
    });
    assert.equal(emptyRead.results[0].encoding, "windows-31j");
    assert.equal(emptyRead.results[0].lineEnding, "none");
    const emptyUpdate = runJson(launcher, workspace, "update", {
      path: "src/Empty.java",
      expectedRevision: emptyRead.results[0].revision,
      change: {
        type: "replace",
        content: "一\n二\n"
      }
    });
    assert.equal(emptyUpdate.results[0].encoding, "windows-31j");
    assert.equal(emptyUpdate.results[0].lineEnding, "crlf");
    const emptyUpdatedRead = runJson(launcher, workspace, "read", {
      items: [{ path: "src/Empty.java", full: true }]
    });
    assert.equal(emptyUpdatedRead.results[0].text, "一\n二\n");
    assert.equal(emptyUpdatedRead.results[0].lineEnding, "crlf");

    const unencodable = runJsonResult(launcher, workspace, "create", {
      path: "emoji.txt",
      content: "🎵",
      writeAs: { encoding: "windows-31j" }
    });
    assert.equal(unencodable.exitCode, 3);
    assert.equal(unencodable.response.diagnostics[0].code, "encode_error");

    fs.writeFileSync(
      path.resolve(workspace, "invalid.txt"),
      Uint8Array.from([0x61, 0xe3, 0x81])
    );
    const undecodable = runJsonResult(launcher, workspace, "read", {
      items: [{ path: "invalid.txt", full: true, encoding: "utf-8" }]
    });
    assert.equal(undecodable.exitCode, 3);
    assert.equal(undecodable.response.status, "failed");
    assert.equal(undecodable.response.diagnostics[0].code, "decode_error");

    const invalidRequest = runJsonResult(launcher, workspace, "search", {
      mode: "paths",
      unknownField: true
    });
    assert.equal(invalidRequest.exitCode, 2);
    assert.equal(invalidRequest.response.status, "failed");
    assert.equal(invalidRequest.response.diagnostics[0].code, "unknown_field");

    const bomCreate = runJson(launcher, workspace, "create", {
      path: "bom.txt",
      content: "A\r\n",
      writeAs: {
        encoding: "utf-16le",
        lineEnding: "crlf",
        bom: true
      }
    });
    assert.equal(bomCreate.results[0].bom, true);
    const bomRead = runJson(launcher, workspace, "read", {
      items: [{ path: "bom.txt", full: true }]
    });
    assert.equal(bomRead.results[0].encoding, "utf-16le");
    assert.equal(bomRead.results[0].bom, true);
    assert.equal(bomRead.results[0].lineEnding, "crlf");
    assert.equal(bomRead.results[0].finalNewline, true);

    const deletion = runJson(launcher, workspace, "delete", {
      path: "src/Legacy.java",
      expectedRevision: updatedRead.results[0].revision
    });
    assert.equal(deletion.status, "success");
    assert.equal(fs.existsSync(path.resolve(workspace, "src/Legacy.java")), false);
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

function runJson(launcher, workspace, command, request) {
  const result = runJsonResult(launcher, workspace, command, request);
  assert.equal(result.exitCode, 0);
  assert.equal(result.stderr, "");
  return result.response;
}

function runJsonResult(launcher, workspace, command, request) {
  const result = spawnSync(
    process.execPath,
    [launcher, "--root", workspace, "--json", command],
    {
      encoding: "utf8",
      input: `${JSON.stringify(request)}\n`
    }
  );
  assert.equal(result.error, undefined);
  return {
    exitCode: result.status,
    stderr: result.stderr,
    response: JSON.parse(result.stdout)
  };
}
