import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import test from "node:test";

const root = process.cwd();
const packageJson = JSON.parse(fs.readFileSync(path.resolve(root, "package.json"), "utf8"));
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
    "skills/miku-text-file-ops/SKILL.md",
    "skills/miku-text-file-ops/index.json",
    "skills/miku-text-file-ops/lib/runtime-artifacts.mjs",
    "skills/miku-text-file-ops/lib/run-miku-text-file-ops.mjs",
    "skills/miku-text-file-ops/runtime/miku-text-file-ops-0.3.1.mjs",
    "skills/miku-text-file-ops/licenses/LICENSE",
    "skills/miku-text-file-ops/licenses/UNICODE-LICENSE.txt"
  ]) {
    assert.ok(entries.includes(required), `missing zip entry: ${required}`);
  }
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
      "skills/miku-text-file-ops/lib/run-miku-text-file-ops.mjs"
    );
    assert.equal(
      execFileSync(process.execPath, [launcher, "--version"], { encoding: "utf8" }),
      "0.3.1\n"
    );
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});
