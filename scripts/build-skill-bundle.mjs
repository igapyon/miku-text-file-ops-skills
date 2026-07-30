#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { resolveRuntimeArtifact } from "../skills/igapyon-miku-text-file-ops/lib/runtime-artifacts.mjs";

const scriptRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptRoot, "..");
const repoName = "miku-text-file-ops-skills";
const skillName = "igapyon-miku-text-file-ops";
const sourceSkillRoot = path.resolve(repoRoot, "skills", skillName);
const bundleRoot = path.resolve(repoRoot, "bundle", repoName);
const bundleSkillRoot = path.resolve(bundleRoot, "skills", skillName);

main();

function main() {
  const runtime = resolveRuntimeArtifact();
  requireFile(path.resolve(sourceSkillRoot, "SKILL.md"));
  requireFile(path.resolve(sourceSkillRoot, "index.json"));

  fs.rmSync(bundleRoot, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(bundleSkillRoot), { recursive: true });
  fs.cpSync(sourceSkillRoot, bundleSkillRoot, {
    recursive: true,
    filter: shouldCopy
  });

  process.stdout.write(
    `[build:bundle] generated bundle/${repoName}/skills/${skillName}\n` +
    `[build:bundle] runtime ${runtime.name}\n`
  );
}

function requireFile(target) {
  if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
    throw new Error(`missing required bundle file: ${path.relative(repoRoot, target)}`);
  }
}

function shouldCopy(source) {
  const name = path.basename(source);
  if (name === ".DS_Store" || name === ".gitkeep") {
    return false;
  }
  if (name === "tmp" || name === "output" || name === "state") {
    return false;
  }
  if (/^miku-text-file-ops-runtime-.*\.mjs$/.test(name)) {
    return false;
  }
  return true;
}
