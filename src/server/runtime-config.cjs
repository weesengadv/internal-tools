const fs = require("fs");
const path = require("path");

const DEFAULT_GOOGLE_SHEET_OWNER = "weesengadv@gmail.com";

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readJsonIfExists(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function resolveRuntimePaths({
  appRoot,
  isPackaged = false,
  portableExecutableDir = "",
  executablePath = "",
  configDir = ""
}) {
  const resolvedAppRoot = path.resolve(appRoot || process.cwd());
  const externalRoot = configDir
    || (isPackaged && portableExecutableDir)
    || (isPackaged && executablePath ? path.dirname(executablePath) : "")
    || resolvedAppRoot;
  const resolvedConfigDir = path.resolve(externalRoot);

  return {
    appRoot: resolvedAppRoot,
    configDir: resolvedConfigDir,
    configPath: path.join(resolvedConfigDir, "signage-config.json"),
    configExamplePath: path.join(resolvedAppRoot, "signage-config.example.json"),
    dataDir: path.join(resolvedConfigDir, "data"),
    cachePath: path.join(resolvedConfigDir, "data", "pricing-cache.json"),
    logsDir: path.join(resolvedConfigDir, "logs")
  };
}

function loadRuntimeConfig({ exampleConfig = {}, userConfig = {} } = {}) {
  if (!isPlainObject(exampleConfig) || !isPlainObject(userConfig)) {
    throw new TypeError("Signage configuration must be a JSON object.");
  }

  return {
    googleSheetOwnerEmail: DEFAULT_GOOGLE_SHEET_OWNER,
    googleSheetSyncOnStartup: true,
    serverHost: "127.0.0.1",
    serverPort: 4173,
    ...exampleConfig,
    ...userConfig
  };
}

function loadRuntimeConfigFromPaths(paths) {
  return loadRuntimeConfig({
    exampleConfig: readJsonIfExists(paths.configExamplePath) || {},
    userConfig: readJsonIfExists(paths.configPath) || {}
  });
}

module.exports = {
  DEFAULT_GOOGLE_SHEET_OWNER,
  loadRuntimeConfig,
  loadRuntimeConfigFromPaths,
  readJsonIfExists,
  resolveRuntimePaths
};
