const assert = require("assert");
const path = require("path");

const {
  DEFAULT_GOOGLE_SHEET_OWNER,
  loadRuntimeConfig,
  resolveRuntimePaths
} = require("../src/server/runtime-config.cjs");

const development = resolveRuntimePaths({
  appRoot: "C:\\work\\production-tool",
  isPackaged: false
});

assert.equal(development.configDir, path.resolve("C:\\work\\production-tool"));
assert.equal(development.configPath, path.resolve("C:\\work\\production-tool", "signage-config.json"));
assert.equal(development.cachePath, path.resolve("C:\\work\\production-tool", "data", "pricing-cache.json"));

const packaged = resolveRuntimePaths({
  appRoot: "C:\\temp\\app.asar",
  isPackaged: true,
  portableExecutableDir: "C:\\Office Tools\\Weeseng"
});

assert.equal(packaged.configDir, path.resolve("C:\\Office Tools\\Weeseng"));
assert.equal(packaged.configPath, path.resolve("C:\\Office Tools\\Weeseng", "signage-config.json"));
assert.equal(packaged.cachePath, path.resolve("C:\\Office Tools\\Weeseng", "data", "pricing-cache.json"));

const config = loadRuntimeConfig({
  exampleConfig: { currency: "MYR", googleSheetTabs: [] },
  userConfig: { googleSheetId: "sheet-123" }
});

assert.equal(config.googleSheetOwnerEmail, DEFAULT_GOOGLE_SHEET_OWNER);
assert.equal(config.googleSheetSyncOnStartup, true);
assert.equal(config.serverHost, "127.0.0.1");
assert.equal(config.serverPort, 4173);
assert.equal(config.googleSheetId, "sheet-123");

assert.throws(
  () => loadRuntimeConfig({ exampleConfig: {}, userConfig: [] }),
  /configuration must be a JSON object/i
);

console.log("runtime config tests passed");
