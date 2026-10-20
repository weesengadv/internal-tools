const assert = require("assert");
const path = require("path");

const { resolveStaticFile } = require("../src/server/static-paths.cjs");

const root = path.resolve("C:\\app");
assert.equal(resolveStaticFile(root, "/"), path.join(root, "index.html"));
assert.equal(
  resolveStaticFile(root, "/vendor/three/build/three.module.js"),
  path.join(root, "node_modules", "three", "build", "three.module.js")
);
assert.equal(
  resolveStaticFile(root, "/vendor/tesseract-data/chi_sim.traineddata.gz"),
  path.join(root, "node_modules", "@tesseract.js-data", "chi_sim", "4.0.0", "chi_sim.traineddata.gz")
);
assert.equal(resolveStaticFile(root, "/../signage-config.json"), null);
assert.equal(resolveStaticFile(root, "/vendor/three/../../package.json"), null);
for (const privatePath of ['/signage-config.json', '/signage-config.example.json', '/.git/config', '/server.js', '/logs/app.log', '/tools/word-tools/.venv/pyvenv.cfg', '/LetterForm_Transfer_2026-10-17/MANIFEST.json', '/src/server/runtime-config.cjs']) {
  assert.equal(resolveStaticFile(root, privatePath), null, privatePath + ' must not be web-accessible');
}
assert.equal(resolveStaticFile(root, '/src/appearance.mjs'), path.join(root, 'src', 'appearance.mjs'));

console.log("static path tests passed");
