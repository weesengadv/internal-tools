const fs = require("fs");
const path = require("path");
const { app, BrowserWindow, dialog, shell } = require("electron");
const { createWindowOptions, isSmokeTest, shouldOpenExternally } = require("./src/desktop/window-options.cjs");

let mainWindow = null;
let serverRuntime = null;
let quitting = false;
const smokeTest = isSmokeTest(process.argv);

const hasLock = app.requestSingleInstanceLock();
if (!hasLock) {
  app.quit();
}

function externalConfigDir() {
  if (!app.isPackaged) {
    return __dirname;
  }
  return path.resolve(process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(process.execPath));
}

function appendLog(logsDir, message) {
  fs.mkdirSync(logsDir, { recursive: true });
  fs.appendFileSync(path.join(logsDir, "app.log"), `${new Date().toISOString()} ${message}\n`, "utf8");
}

async function createMainWindow() {
  const configDir = externalConfigDir();
  const appRoot = app.getAppPath();
  fs.mkdirSync(path.join(configDir, "data"), { recursive: true });
  fs.mkdirSync(path.join(configDir, "logs"), { recursive: true });
  process.env.WEESENG_APP_ROOT = appRoot;
  process.env.WEESENG_CONFIG_DIR = configDir;
  if (app.isPackaged) {
    process.env.WEESENG_WORD_TOOLS_ROOT = path.join(process.resourcesPath, 'word-tools');
  }

  const { startServer } = require("./server.js");
  serverRuntime = await startServer();
  mainWindow = new BrowserWindow(createWindowOptions());

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (shouldOpenExternally(url, serverRuntime.url)) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (shouldOpenExternally(url, serverRuntime.url)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
  if (!smokeTest) {
    mainWindow.once("ready-to-show", () => mainWindow.show());
  }
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  await mainWindow.loadURL(serverRuntime.url);
  appendLog(path.join(configDir, "logs"), `Started ${serverRuntime.url}`);
  if (smokeTest) {
    app.quit();
  }
}

app.on("second-instance", () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on("window-all-closed", () => app.quit());

app.on("before-quit", (event) => {
  if (!serverRuntime?.server || quitting) {
    return;
  }
  event.preventDefault();
  quitting = true;
  serverRuntime.server.stopWordTools().finally(() => {
    serverRuntime.server.close(() => app.quit());
  });
});

app.whenReady().then(createMainWindow).catch((error) => {
  const configDir = externalConfigDir();
  appendLog(path.join(configDir, "logs"), `Startup failed: ${error.stack || error.message}`);
  dialog.showErrorBox("Weeseng Production Tool", `The app could not start.\n\n${error.message}\n\nConfig folder: ${configDir}`);
  app.quit();
});
