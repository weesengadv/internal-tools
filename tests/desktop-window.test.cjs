const assert = require("assert");

const {
  createWindowOptions,
  isSmokeTest,
  shouldOpenExternally
} = require("../src/desktop/window-options.cjs");
const { archiveHasEntries, electronBuilderInvocation } = require("../src/desktop/package-paths.cjs");

const options = createWindowOptions();
assert.equal(options.width, 1440);
assert.equal(options.minWidth, 1024);
assert.equal(options.webPreferences.nodeIntegration, false);
assert.equal(options.webPreferences.contextIsolation, true);
assert.equal(options.webPreferences.sandbox, true);

assert.equal(shouldOpenExternally("https://example.com", "http://127.0.0.1:4173/"), true);
assert.equal(shouldOpenExternally("codex://new?path=test", "http://127.0.0.1:4173/"), true);
assert.equal(shouldOpenExternally("http://127.0.0.1:4173/#signage", "http://127.0.0.1:4173/"), false);
assert.equal(isSmokeTest(["electron.exe", ".", "--smoke-test"]), true);
assert.equal(isSmokeTest(["Weeseng Production Tool.exe"]), false);

const invocation = electronBuilderInvocation("C:\\Office Tools\\Production Tool", "C:\\Program Files\\nodejs\\node.exe");
assert.equal(invocation.command, "C:\\Program Files\\nodejs\\node.exe");
assert.equal(invocation.args[0], "C:\\Office Tools\\Production Tool\\node_modules\\electron-builder\\cli.js");
assert.equal(invocation.args[3], "--config.directories.output=release-build");
assert.equal(archiveHasEntries("README_OFFICE.md\nsignage-config.json\nWeeseng Production Tool.exe\n", [
  "README_OFFICE.md",
  "signage-config.json",
  "Weeseng Production Tool.exe"
]), true);
assert.equal(archiveHasEntries("README_OFFICE.md\nsignage-config.json\n", ["Weeseng Production Tool.exe"]), false);

console.log("desktop window tests passed");
