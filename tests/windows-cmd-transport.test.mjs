import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const root = process.cwd();
const launcher = path.resolve(
  root,
  "skills/igapyon-miku-text-file-ops/lib/run-miku-text-file-ops.mjs"
);

test(
  "cmd.exe transports UTF-8 request files by type and input redirection",
  { skip: process.platform !== "win32" },
  () => {
    const temporaryRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), "miku-text-file-ops-cmd-")
    );
    try {
      const workspace = path.resolve(temporaryRoot, "project");
      fs.mkdirSync(workspace);

      const createRequest = path.resolve(temporaryRoot, "create-request.json");
      const createResponse = path.resolve(temporaryRoot, "create-response.json");
      const createStderr = path.resolve(temporaryRoot, "create-stderr.txt");
      const createdContent = Array.from(
        { length: 200 },
        (_, index) => `日本語 ${index + 1}`
      ).join("\n") + "\n";
      writeUtf8NoBom(createRequest, {
        path: "windows.txt",
        content: createdContent
      });

      const typeScript = path.resolve(temporaryRoot, "type-pipeline.cmd");
      fs.writeFileSync(
        typeScript,
        [
          "@echo off",
          `type "${createRequest}" ^`,
          `  | node "${launcher}" --root "${workspace}" --json create ^`,
          `  > "${createResponse}" 2> "${createStderr}"`,
          "exit /b %ERRORLEVEL%",
          ""
        ].join("\r\n"),
        "utf8"
      );
      const typeResult = spawnSync(
        "cmd.exe",
        ["/d", "/c", path.basename(typeScript)],
        { cwd: temporaryRoot, encoding: "utf8" }
      );
      assertCmdSuccess(typeResult, typeScript, createStderr);
      assert.equal(fs.readFileSync(createStderr, "utf8"), "");
      assert.equal(JSON.parse(fs.readFileSync(createResponse, "utf8")).status, "success");
      assert.equal(
        fs.readFileSync(path.resolve(workspace, "windows.txt"), "utf8"),
        createdContent
      );

      const readRequest = path.resolve(temporaryRoot, "read-request.json");
      const readResponse = path.resolve(temporaryRoot, "read-response.json");
      const readStderr = path.resolve(temporaryRoot, "read-stderr.txt");
      writeUtf8NoBom(readRequest, {
        items: [{ path: "windows.txt", firstLines: 1 }]
      });

      const redirectScript = path.resolve(temporaryRoot, "input-redirect.cmd");
      fs.writeFileSync(
        redirectScript,
        [
          "@echo off",
          `node "${launcher}" --root "${workspace}" --json read ^`,
          `  < "${readRequest}" > "${readResponse}" 2> "${readStderr}"`,
          "set \"MIKU_TEXT_FILE_OPS_EXIT=%ERRORLEVEL%\"",
          "exit /b %MIKU_TEXT_FILE_OPS_EXIT%",
          ""
        ].join("\r\n"),
        "utf8"
      );
      const redirectResult = spawnSync(
        "cmd.exe",
        ["/d", "/c", path.basename(redirectScript)],
        { cwd: temporaryRoot, encoding: "utf8" }
      );
      assertCmdSuccess(redirectResult, redirectScript, readStderr);
      assert.equal(fs.readFileSync(readStderr, "utf8"), "");
      const read = JSON.parse(fs.readFileSync(readResponse, "utf8"));
      assert.equal(read.status, "success");
      assert.equal(read.results[0].text, "日本語 1\n");
    } finally {
      fs.rmSync(temporaryRoot, { recursive: true, force: true });
    }
  }
);

function writeUtf8NoBom(target, value) {
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  assert.notDeepEqual(
    [...fs.readFileSync(target).subarray(0, 3)],
    [0xef, 0xbb, 0xbf]
  );
}

function assertCmdSuccess(result, scriptPath, cliStderrPath) {
  assert.equal(result.error, undefined);
  const cliStderr = fs.existsSync(cliStderrPath)
    ? fs.readFileSync(cliStderrPath, "utf8")
    : "<missing>";
  const diagnostic = [
    `cmd.exe status: ${result.status}`,
    `cmd.exe stdout:\n${result.stdout ?? ""}`,
    `cmd.exe stderr:\n${result.stderr ?? ""}`,
    `CLI stderr:\n${cliStderr}`,
    `batch script:\n${fs.readFileSync(scriptPath, "utf8")}`
  ].join("\n\n");
  assert.equal(result.status, 0, diagnostic);
}
