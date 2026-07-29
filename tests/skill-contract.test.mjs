import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const skillRoot = path.resolve(root, "skills/miku-text-file-ops");

test("skill contract is narrow and directly routes bundled references", () => {
  const skill = fs.readFileSync(path.resolve(skillRoot, "SKILL.md"), "utf8");
  assert.match(skill, /^---\nname: miku-text-file-ops\n/m);
  assert.match(skill, /Do not activate for ordinary UTF-8/);
  assert.match(skill, /references\/runtime\.md/);
  assert.match(skill, /references\/workflow\.md/);
  assert.match(skill, /references\/response-handling\.md/);
  assert.match(skill, /index\.json/);
  assert.ok(skill.split(/\n/).length <= 200);
});

test("skill metadata covers positive triggers and negative boundaries", () => {
  const skill = fs.readFileSync(path.resolve(skillRoot, "SKILL.md"), "utf8");
  const description = extractDescription(skill);

  for (const expected of [
    "miku-text-file-ops",
    "miku-text-file-ops-skills",
    "non-UTF-8",
    "Windows-31J",
    "BOM",
    "newline preservation",
    "mojibake",
    "decode errors"
  ]) {
    assert.match(description, new RegExp(escapeRegExp(expected)));
  }

  for (const excluded of [
    "ordinary UTF-8 reading",
    "generic source search",
    "routine patching",
    "binary files",
    "code review"
  ]) {
    assert.match(description, new RegExp(escapeRegExp(excluded)));
  }
});

test("skill routes projections, bounded reads, and partial responses", () => {
  const skill = fs.readFileSync(path.resolve(skillRoot, "SKILL.md"), "utf8");
  assert.match(skill, /projection: `count`, `summary`, `files`, then `matches`/);
  assert.match(skill, /`max\(1, L - 40\)` through `L \+ 40`/);
  assert.match(skill, /`firstLines: 120`/);
  assert.match(skill, /Refine a query before raising output limits/);
  assert.match(skill, /response-handling\.md.*result is partial/s);
});

test("skill description and body stay within context-budget targets", (context) => {
  const skill = fs.readFileSync(path.resolve(skillRoot, "SKILL.md"), "utf8");
  const description = extractDescription(skill);
  const metrics = {
    descriptionWords: countWords(description),
    skillLines: countLines(skill),
    skillWords: countWords(skill),
    skillUtf8Bytes: Buffer.byteLength(skill, "utf8")
  };

  context.diagnostic(JSON.stringify(metrics));
  assert.ok(metrics.descriptionWords <= 100);
  assert.ok(metrics.skillLines <= 200);
  assert.ok(metrics.skillLines <= 500);
});

test("generated discovery index matches indexed files and sizes", () => {
  const indexPath = path.resolve(skillRoot, "index.json");
  assert.equal(fs.existsSync(indexPath), true);
  const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  const indexed = new Map(index.files.map((entry) => [entry.path, entry.size]));
  const expected = collectIndexedFiles(skillRoot);
  assert.deepEqual([...indexed.keys()], [...expected.keys()]);
  assert.deepEqual([...indexed.values()], [...expected.values()]);
});

function collectIndexedFiles(directory, relativeRoot = "") {
  const result = new Map();
  const entries = fs.readdirSync(directory, { withFileTypes: true })
    .filter((entry) => !entry.name.startsWith("."))
    .sort((left, right) => left.name < right.name ? -1 : left.name > right.name ? 1 : 0);

  for (const entry of entries) {
    const relative = relativeRoot ? `${relativeRoot}/${entry.name}` : entry.name;
    const absolute = path.resolve(directory, entry.name);
    if (entry.isDirectory()) {
      for (const [nestedPath, size] of collectIndexedFiles(absolute, relative)) {
        result.set(nestedPath, size);
      }
      continue;
    }
    if (relative === "index.json" || !/\.(?:md|json|mjs|yaml|txt)$/.test(entry.name)) {
      continue;
    }
    result.set(relative, fs.statSync(absolute).size);
  }
  return result;
}

function extractDescription(skill) {
  const match = skill.match(/^description:\s*(.+)$/m);
  assert.ok(match, "frontmatter description is required");
  return match[1];
}

function countWords(value) {
  const trimmed = value.trim();
  return trimmed === "" ? 0 : trimmed.split(/\s+/u).length;
}

function countLines(value) {
  return value.endsWith("\n")
    ? value.split("\n").length - 1
    : value.split("\n").length;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
