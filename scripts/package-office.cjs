const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { archiveHasEntries, electronBuilderInvocation } = require("../src/desktop/package-paths.cjs");

const root = path.resolve(__dirname, "..");
const version = require(path.join(root, "package.json")).version;
const artifactName = "Weeseng Production Tool.exe";
const releaseDirName = `release-v${version}`;
const releaseExe = path.join(root, releaseDirName, artifactName);
const stageName = `Weeseng-Production-Tool-v${version}-win-x64`;
const stageDir = path.join(root, "dist", stageName);
const zipPath = path.join(root, "dist", `${stageName}.zip`);
const builder = electronBuilderInvocation(root, process.execPath, releaseDirName);

function renameWithRetry(source, destination, attempts = 10) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      fs.renameSync(source, destination);
      return;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 500);
      }
    }
  }
  throw lastError;
}

if (process.env.WEESENG_SKIP_BUILD !== "1") {
  try {
    execFileSync(builder.command, builder.args, { cwd: root, stdio: "inherit" });
  } catch (error) {
    const temporaryRuntime = path.join(root, releaseDirName, "win-unpacked.tmp");
    const preservedRuntime = path.join(root, releaseDirName, "electron-runtime");
    if (!fs.existsSync(temporaryRuntime)) {
      throw error;
    }

    fs.rmSync(preservedRuntime, { recursive: true, force: true });
    renameWithRetry(temporaryRuntime, preservedRuntime);
    console.warn("Retrying the Windows build with the locally extracted Electron runtime.");
    execFileSync(builder.command, [
      ...builder.args,
      `--config.electronDist=${preservedRuntime}`
    ], { cwd: root, stdio: "inherit" });
  }
}

fs.rmSync(stageDir, { recursive: true, force: true });
fs.rmSync(zipPath, { force: true });
fs.mkdirSync(path.join(stageDir, "data"), { recursive: true });
fs.mkdirSync(path.join(stageDir, "logs"), { recursive: true });

for (const fileName of [artifactName, "signage-config.json", "signage-config.example.json", "README_OFFICE.md"]) {
  const source = fileName === artifactName ? releaseExe : path.join(root, fileName);
  if (!fs.existsSync(source)) {
    throw new Error(`Required office package file is missing: ${source}`);
  }
  fs.copyFileSync(source, path.join(stageDir, fileName));
}

fs.writeFileSync(path.join(stageDir, "data", "README.txt"), "The last successful Google Sheet pricing cache is stored here.\n", "utf8");
fs.writeFileSync(path.join(stageDir, "logs", "README.txt"), "Desktop startup logs are stored here.\n", "utf8");

execFileSync("powershell", [
  "-NoProfile",
  "-Command",
  "$ErrorActionPreference = 'Stop'; for ($attempt = 1; $attempt -le 10; $attempt += 1) { try { Compress-Archive -Path (Join-Path $env:WEESENG_STAGE_DIR '*') -DestinationPath $env:WEESENG_ZIP_PATH -Force; exit 0 } catch { if ($attempt -eq 10) { throw }; Start-Sleep -Seconds 2 } }"
], {
  cwd: root,
  env: {
    ...process.env,
    WEESENG_STAGE_DIR: stageDir,
    WEESENG_ZIP_PATH: zipPath
  },
  stdio: "inherit"
});

const archiveListing = execFileSync("tar", ["-tf", zipPath], { cwd: root, encoding: "utf8" });
const requiredEntries = [artifactName, "signage-config.json", "signage-config.example.json", "README_OFFICE.md"];
if (!archiveHasEntries(archiveListing, requiredEntries)) {
  throw new Error("Office zip verification failed: one or more required files are missing.");
}

console.log(`Office package created: ${zipPath}`);
