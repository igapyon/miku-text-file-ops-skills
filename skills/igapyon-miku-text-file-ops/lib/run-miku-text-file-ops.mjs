#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { resolveRuntimeArtifact } from "./runtime-artifacts.mjs";

export function runMikuTextFileOps({
  args = [],
  input,
  cwd = process.cwd(),
  runtimeRoot,
  stdio
} = {}) {
  const runtime = resolveRuntimeArtifact({ runtimeRoot });
  const result = spawnSync(process.execPath, [runtime.path, ...args], {
    cwd,
    input,
    encoding: stdio ? undefined : "utf8",
    maxBuffer: 64 * 1024 * 1024,
    stdio
  });

  if (result.error) {
    throw result.error;
  }

  return {
    runtime,
    status: result.status,
    signal: result.signal,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? ""
  };
}

if (isMainModule()) {
  try {
    const result = runMikuTextFileOps({
      args: process.argv.slice(2),
      stdio: "inherit"
    });
    process.exitCode = result.status ?? 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`[miku-text-file-ops] ${message}\n`);
    process.exitCode = 1;
  }
}

function isMainModule() {
  if (!process.argv[1]) {
    return false;
  }
  return fs.realpathSync(fileURLToPath(import.meta.url)) ===
    fs.realpathSync(path.resolve(process.argv[1]));
}
