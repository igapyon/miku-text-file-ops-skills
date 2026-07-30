import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const corpus = JSON.parse(fs.readFileSync(
  path.resolve(root, "tests/fixtures/agent-workflow-v1.json"),
  "utf8"
));

test("post-selection execution contract stays closed over the bundled runtime", () => {
  assert.equal(corpus.formatVersion, 1);
  const scenario = byId(corpus.executionScenarios, "closed-bundled-runtime");
  assert.notEqual(scenario.installedSkillRoot, scenario.projectRoot);
  assert.ok(scenario.expectedLauncher.startsWith(scenario.installedSkillRoot));
  assert.equal(scenario.expectedInput, "utf8-no-bom-temporary-file-stdin");
  assert.equal(scenario.expectedOutput, "canonical-json-stdout");
  assert.deepEqual(scenario.temporaryLocations, [
    "project-local-when-workspace-only",
    "host-secure-temp-when-preauthorized"
  ]);
  assert.equal(
    scenario.projectLocalPath,
    "project-root/workplace/tmp/miku-text-file-ops"
  );
  assert.deepEqual(scenario.projectLocalRequirements, [
    "ignored-or-search-excluded",
    "not-staged",
    "collision-resistant-name",
    "exact-path-cleanup"
  ]);
  assert.deepEqual(scenario.forbiddenDiscovery, [
    "npx",
    "npm-install",
    "bare-path-cli",
    "registry-search",
    "network-download"
  ]);
  assert.equal(scenario.missingRuntimeAction, "hard-error");

  const boundary = byId(
    corpus.executionScenarios,
    "control-json-target-encoding-boundary"
  );
  assert.equal(boundary.requestEncoding, "utf-8-no-bom");
  assert.equal(boundary.targetEncoding, "windows-31j");
  assert.equal(boundary.harnessConvertsTarget, false);
  assert.equal(boundary.expectedBundledCli, true);
});

test("encoding-sensitive scope continues only for the current task and paths", () => {
  const scenarios = new Map(
    corpus.continuityScenarios.map((entry) => [entry.id, entry])
  );
  for (const id of [
    "windows31j-java-read-update",
    "test-failure-follow-up",
    "same-rule-second-file",
    "ordinary-utf8-outside-scope",
    "stale-safe-rebuild",
    "stale-overlap-user-decision",
    "policy-change",
    "fresh-thread-no-invisible-state",
    "fresh-thread-durable-instruction"
  ]) {
    assert.ok(scenarios.has(id), id);
  }

  for (const id of [
    "windows31j-java-read-update",
    "test-failure-follow-up",
    "same-rule-second-file",
    "stale-safe-rebuild"
  ]) {
    assert.equal(scenarios.get(id).expectedScope, "continue", id);
    assert.equal(scenarios.get(id).expectedBundledCli, true, id);
  }

  const ordinary = scenarios.get("ordinary-utf8-outside-scope");
  assert.equal(ordinary.expectedScope, "outside");
  assert.equal(ordinary.expectedBundledCli, false);
  assert.equal(ordinary.expectedNativeTools, true);

  const safe = scenarios.get("stale-safe-rebuild");
  assert.equal(safe.retryUnchangedRequest, false);

  const conflict = scenarios.get("stale-overlap-user-decision");
  assert.equal(conflict.expectedAction, "ask-user");
  assert.equal(conflict.mutationAfterConflict, false);

  const policy = scenarios.get("policy-change");
  assert.equal(policy.expectedScope, "re-evaluate");
  assert.equal(policy.expectedAction, "confirm-policy");

  const fresh = scenarios.get("fresh-thread-no-invisible-state");
  assert.equal(fresh.expectedScope, "unknown");
  assert.equal(fresh.assumePriorActivation, false);

  const durable = scenarios.get("fresh-thread-durable-instruction");
  assert.equal(durable.expectedScope, "re-establish");
  assert.equal(durable.expectedBundledCli, true);
});

function byId(entries, id) {
  const entry = entries.find((candidate) => candidate.id === id);
  assert.ok(entry, id);
  return entry;
}
