import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const skillRoot = path.resolve(root, "skills/igapyon-miku-text-file-ops");
const corpus = JSON.parse(fs.readFileSync(
  path.resolve(root, "tests/fixtures/agent-routing-v1.json"),
  "utf8"
));

test("golden routing prompts cover every accepted category", () => {
  assert.equal(corpus.formatVersion, 1);
  const categories = new Set(
    corpus.routingPrompts.map((entry) => entry.category)
  );
  assert.deepEqual(categories, new Set([
    "must-trigger",
    "recovery-trigger",
    "must-not-trigger",
    "explicit",
    "ambiguous"
  ]));
});

test("every positive routing prompt requires Skill selection and CLI execution", () => {
  const positive = corpus.routingPrompts.filter((entry) => entry.expectSkill);
  assert.ok(positive.length > 0);
  for (const entry of positive) {
    assert.equal(entry.expectBundledCli, true, entry.id);
    assert.ok(entry.expectedOperations.length > 0, entry.id);
  }
});

test("negative and ambiguous prompts remain with native tools", () => {
  const negative = corpus.routingPrompts.filter((entry) => !entry.expectSkill);
  assert.ok(negative.length > 0);
  for (const entry of negative) {
    assert.equal(entry.expectBundledCli, false, entry.id);
  }
});

test("context scenarios cover the accepted routing decisions", () => {
  const scenarios = new Map(
    corpus.contextScenarios.map((entry) => [entry.id, entry])
  );
  for (const id of [
    "broad-path-inventory",
    "broad-mixed-encoding-query",
    "exact-count",
    "candidate-selection",
    "selective-match-read",
    "overlapping-ranges",
    "small-full-read",
    "large-section-read",
    "partial-search",
    "partial-multi-item-read"
  ]) {
    assert.ok(scenarios.has(id), id);
  }
  assert.equal(scenarios.get("broad-path-inventory").expectedInitialProjection, "count");
  assert.equal(scenarios.get("broad-mixed-encoding-query").expectedInitialProjection, "summary");
  assert.equal(scenarios.get("exact-count").rejectFalseExactCount, true);
  assert.equal(scenarios.get("candidate-selection").expectedInitialProjection, "files");
  assert.deepEqual(
    scenarios.get("selective-match-read").expectedReadWindow,
    { before: 40, after: 40 }
  );
  assert.equal(scenarios.get("overlapping-ranges").mergeOverlappingRanges, true);
  assert.ok(scenarios.get("small-full-read").knownRawBytes <= 16 * 1024);
  assert.ok(scenarios.get("large-section-read").knownRawBytes > 16 * 1024);
  assert.equal(scenarios.get("partial-search").rejectFalseCompleteness, true);
  assert.equal(scenarios.get("partial-multi-item-read").resubmitFromNextItemIndex, true);
});

test("Skill references encode every context-efficiency guard", () => {
  const skill = fs.readFileSync(path.resolve(skillRoot, "SKILL.md"), "utf8");
  const workflow = fs.readFileSync(
    path.resolve(skillRoot, "references/workflow.md"),
    "utf8"
  );
  const response = fs.readFileSync(
    path.resolve(skillRoot, "references/response-handling.md"),
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

  assert.match(skill, /Split a merged window into adjacent ranges/);
  assert.match(skill, /bounded `read`.*required patch/s);
  assert.doesNotMatch(skill, /full-file raw-byte revision with\s+`read`/);
  assert.match(workflow, /usage\.nextItemIndex/);
  assert.match(response, /at least N/);
  assert.match(response, /one unbounded model response/);
  assert.match(response, /concrete exhaustive requirement/);
  assert.match(searchRead, /--json search/);
  assert.match(searchRead, /--json read/);
  assert.match(mutations, /--json create/);
  assert.match(mutations, /--json update/);
  assert.match(mutations, /--json delete/);
  assert.match(searchRead, /repository\s+encoding policy/i);
  assert.match(policy, /explicit read-item encoding/);
  assert.match(policy, /first matching repository encoding rule/);
});
