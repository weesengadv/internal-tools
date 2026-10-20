const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const packageJson = require(path.join(root, "package.json"));
const versionFile = fs.readFileSync(path.join(root, "VERSION"), "utf8").trim();
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

assert.equal(versionFile, packageJson.version);
assert.match(html, new RegExp(`data-app-version="${packageJson.version.replace(/\./g, "\\.")}"`));
assert.doesNotMatch(html, /Google Sheet or sample fallback/);

const threeAddonFileSet = packageJson.build.files.find((entry) => (
  typeof entry === "object"
  && entry.from === "node_modules/three/examples/jsm"
  && entry.to === "node_modules/three/examples/jsm"
));
assert.ok(threeAddonFileSet, "Electron packaging must explicitly include Three.js JSM add-ons.");
for (const relativePath of [
  "controls/OrbitControls.js",
  "exporters/STLExporter.js",
  "loaders/STLLoader.js"
]) {
  assert.equal(fs.existsSync(path.join(root, "node_modules", "three", "examples", "jsm", relativePath)), true);
}

console.log("release consistency tests passed");
