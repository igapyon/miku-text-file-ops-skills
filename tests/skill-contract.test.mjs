import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const skillRoot = path.resolve(root, "skills/igapyon-miku-text-file-ops");

test("repository exposes one canonical formal Skill identity", () => {
  assert.equal(fs.existsSync(skillRoot), true);
  assert.equal(
    fs.existsSync(path.resolve(root, "skills/miku-text-file-ops")),
    false
  );

  const agentMetadata = fs.readFileSync(
    path.resolve(skillRoot, "agents/openai.yaml"),
    "utf8"
  );
  assert.match(agentMetadata, /\$igapyon-miku-text-file-ops/);
  assert.doesNotMatch(agentMetadata, /\$miku-text-file-ops\b/);
});

test("skill contract is narrow and directly routes bundled references", () => {
  const skill = fs.readFileSync(path.resolve(skillRoot, "SKILL.md"), "utf8");
  assert.match(skill, /^---\nname: igapyon-miku-text-file-ops\n/m);
  assert.match(skill, /Do not activate for ordinary UTF-8/);
  assert.match(skill, /references\/runtime\.md/);
  assert.match(skill, /references\/search-read\.md/);
  assert.match(skill, /references\/mutations\.md/);
  assert.match(skill, /references\/workflow\.md/);
  assert.match(skill, /references\/response-handling\.md/);
  assert.match(skill, /index\.json/);
  assert.ok(skill.split(/\n/).length <= 200);

  const references = fs.readdirSync(path.resolve(skillRoot, "references"))
    .filter((name) => name.endsWith(".md"));
  for (const name of references) {
    assert.match(skill, new RegExp(`references/${escapeRegExp(name)}`), name);
  }
});

test("skill metadata covers positive triggers and negative boundaries", () => {
  const skill = fs.readFileSync(path.resolve(skillRoot, "SKILL.md"), "utf8");
  const description = extractDescription(skill);

  for (const expected of [
    "igapyon-miku-text-file-ops",
    "miku-text-file-ops",
    "miku-text-file-ops-skills",
    "non-UTF-8",
    "mixed encodings",
    "repository encoding rules",
    "Windows-31J",
    "explicit encoding conversion",
    "BOM",
    "newline preservation",
    "mojibake",
    "decode errors",
    "unexpectedly skipped text files"
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
  assert.match(skill, /bounded `read`.*full-file raw-byte revision/s);
  assert.match(skill, /response-handling\.md.*result is partial/s);
});

test("skill routes the v0.5.0 transport and stale-revision contracts", () => {
  const skill = fs.readFileSync(path.resolve(skillRoot, "SKILL.md"), "utf8");
  const runtime = fs.readFileSync(
    path.resolve(skillRoot, "references/runtime.md"),
    "utf8"
  );
  const mutations = fs.readFileSync(
    path.resolve(skillRoot, "references/mutations.md"),
    "utf8"
  );
  const responses = fs.readFileSync(
    path.resolve(skillRoot, "references/response-handling.md"),
    "utf8"
  );
  const workflow = fs.readFileSync(
    path.resolve(skillRoot, "references/workflow.md"),
    "utf8"
  );

  assert.match(skill, /structured diagnostic details/);
  assert.match(skill, /installed Skill root/);
  assert.match(skill, /project or workspace root/);
  assert.match(skill, /<installed-skill-root>\/lib\/run-miku-text-file-ops\.mjs/);
  for (const forbidden of [
    "npx",
    "npm install",
    "PATH",
    "npm registry",
    "network download"
  ]) {
    assert.match(skill, new RegExp(escapeRegExp(forbidden)));
  }
  assert.match(runtime, /UTF-8 no-BOM temporary file/);
  assert.match(runtime, /`--json` selects one canonical JSON response on stdout/);
  assert.match(runtime, /stdout, stderr, and the process exit\s+code separately/);
  assert.match(runtime, /type "%TEMP%/);
  assert.match(runtime, /< "%TEMP%/);
  assert.match(runtime, /<project-root>\/workplace\/tmp\/miku-text-file-ops/);
  assert.match(runtime, /exclude `workplace\/\*\*` from CLI searches/);
  assert.match(runtime, /do\s+not stage the files/);
  assert.match(runtime, /miku-text-file-ops#15/);
  assert.match(runtime, /Target files may use Windows-31J/);
  assert.match(mutations, /stale_revision/);
  assert.match(mutations, /Do not resend the unchanged request/);
  assert.match(mutations, /present the bounded conflict to the user/);
  assert.match(responses, /expectedRevision/);
  assert.match(responses, /actualRevision/);
  assert.match(responses, /reread_and_rebuild_request/);
  assert.match(responses, /retryUnchangedRequest/);
  assert.match(responses, /not the file with\s+Git `HEAD`/);
  assert.match(workflow, /Encoding-Sensitive Work Scope/);
  assert.match(workflow, /Turn and Harness Boundary/);
  assert.match(workflow, /stale_revision \(mutation not applied\)/);
});

test("encoding policy documents the v0.5.0 operation contract", () => {
  const skill = fs.readFileSync(path.resolve(skillRoot, "SKILL.md"), "utf8");
  const policy = fs.readFileSync(
    path.resolve(skillRoot, "references/encoding-policy.md"),
    "utf8"
  );
  const searchRead = fs.readFileSync(
    path.resolve(skillRoot, "references/search-read.md"),
    "utf8"
  );
  const mutations = fs.readFileSync(
    path.resolve(skillRoot, "references/mutations.md"),
    "utf8"
  );

  assert.match(skill, /references\/encoding-policy\.md/);
  assert.match(searchRead, /encoding-policy\.md/);
  assert.match(mutations, /encoding-policy\.md/);
  assert.match(policy, /\.mikusoft\/miku-text-file-ops\.json/);
  assert.match(policy, /\*\*\/\*\.java/);
  assert.match(policy, /\*\*\/\*\.jsp/);
  assert.match(policy, /first match wins/);
  assert.match(policy, /path `search`.*Does not decode/s);
  assert.match(policy, /content `search`.*Uses rule/s);
  assert.match(policy, /explicit `writeAs\.encoding`.*matching `encodingRules`/s);
  assert.match(policy, /zero-byte file/);
  assert.match(policy, /defaultCreate.*deprecated alias/);
  assert.match(policy, /does not parse, merge, or reimplement this policy/);
});

test("all operation examples use the installed launcher and explicit root", () => {
  const searchRead = fs.readFileSync(
    path.resolve(skillRoot, "references/search-read.md"),
    "utf8"
  );
  const mutations = fs.readFileSync(
    path.resolve(skillRoot, "references/mutations.md"),
    "utf8"
  );
  const examples = `${searchRead}\n${mutations}`;
  for (const command of ["search", "read", "create", "update", "delete"]) {
    assert.match(
      examples,
      new RegExp(
        `<installed-skill-root>/lib/run-miku-text-file-ops\\.mjs"[\\s\\S]*?` +
        `--root "<project-root>" --json ${command}`
      ),
      command
    );
  }
  assert.doesNotMatch(examples, /^node lib\/run-miku-text-file-ops/m);
});

test("progressive references separate core routing from operation details", () => {
  const workflow = fs.readFileSync(
    path.resolve(skillRoot, "references/workflow.md"),
    "utf8"
  );
  const searchRead = fs.readFileSync(
    path.resolve(skillRoot, "references/search-read.md"),
    "utf8"
  );
  const mutations = fs.readFileSync(
    path.resolve(skillRoot, "references/mutations.md"),
    "utf8"
  );
  const policy = fs.readFileSync(
    path.resolve(skillRoot, "references/encoding-policy.md"),
    "utf8"
  );

  assert.doesNotMatch(workflow, /81-line window/);
  assert.doesNotMatch(workflow, /`count` for existence/);
  assert.match(searchRead, /## Search/);
  assert.match(searchRead, /## Read/);
  assert.doesNotMatch(searchRead, /--json update/);
  assert.match(mutations, /## Create/);
  assert.match(mutations, /## Update/);
  assert.match(mutations, /## Delete/);
  assert.doesNotMatch(mutations, /--json search/);
  assert.match(policy, /## Operation Matrix/);
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
