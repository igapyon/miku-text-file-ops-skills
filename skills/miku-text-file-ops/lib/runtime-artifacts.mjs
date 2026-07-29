import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const libRoot = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_RUNTIME_ROOT = path.resolve(libRoot, "../runtime");
const standalonePattern = /^miku-text-file-ops-(\d+(?:\.\d+)*)\.mjs$/;

export function resolveRuntimeArtifact({
  runtimeRoot = DEFAULT_RUNTIME_ROOT
} = {}) {
  const entries = fs.existsSync(runtimeRoot) ? fs.readdirSync(runtimeRoot) : [];
  const matches = entries
    .map((name) => {
      const match = standalonePattern.exec(name);
      if (!match) {
        return null;
      }
      const artifactPath = path.resolve(runtimeRoot, name);
      if (!fs.statSync(artifactPath).isFile() || fs.statSync(artifactPath).size === 0) {
        return null;
      }
      return { name, path: artifactPath, version: match[1] };
    })
    .filter(Boolean)
    .sort(compareArtifacts);

  if (matches.length === 0) {
    throw new Error(
      `standalone CLI runtime not found; expected miku-text-file-ops-<version>.mjs under ${runtimeRoot}`
    );
  }

  return matches[matches.length - 1];
}

function compareArtifacts(left, right) {
  const leftParts = left.version.split(".").map(Number);
  const rightParts = right.version.split(".").map(Number);
  const length = Math.max(leftParts.length, rightParts.length);
  for (let index = 0; index < length; index += 1) {
    const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (difference !== 0) {
      return difference;
    }
  }
  return compareUtf16(left.name, right.name);
}

function compareUtf16(left, right) {
  if (left < right) {
    return -1;
  }
  if (left > right) {
    return 1;
  }
  return 0;
}
