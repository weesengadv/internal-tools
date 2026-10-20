const path = require("path");

function electronBuilderInvocation(root, nodeExecutable = process.execPath, outputDir = "release-build") {
  return {
    command: nodeExecutable,
    args: [
      path.join(root, "node_modules", "electron-builder", "cli.js"),
      "--win",
      "portable",
      `--config.directories.output=${outputDir}`
    ]
  };
}

function archiveHasEntries(listing, requiredEntries) {
  const entries = new Set(String(listing || "").split(/\r?\n/).map((entry) => entry.trim()).filter(Boolean));
  return requiredEntries.every((entry) => entries.has(entry));
}

module.exports = { archiveHasEntries, electronBuilderInvocation };
