function createWindowOptions() {
  return {
    width: 1440,
    height: 960,
    minWidth: 1024,
    minHeight: 720,
    show: false,
    backgroundColor: "#f5f7f8",
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  };
}

function shouldOpenExternally(targetUrl, appUrl) {
  try {
    const target = new URL(targetUrl);
    const app = new URL(appUrl);
    return target.protocol !== "http:" || target.origin !== app.origin;
  } catch {
    return true;
  }
}

function isSmokeTest(argv = []) {
  return argv.includes("--smoke-test");
}

module.exports = { createWindowOptions, isSmokeTest, shouldOpenExternally };
