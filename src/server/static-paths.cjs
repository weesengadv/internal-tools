const path = require("path");

const TESSERACT_LANGUAGES = new Set(["eng", "chi_sim", "chi_tra"]);

function safeJoin(base, relativePath) {
  const clean = String(relativePath || "").replace(/^[/\\]+/, "");
  if (clean.split(/[/\\]+/).includes("..")) {
    return null;
  }
  const resolvedBase = path.resolve(base);
  const resolved = path.resolve(resolvedBase, clean);
  return resolved === resolvedBase || resolved.startsWith(`${resolvedBase}${path.sep}`) ? resolved : null;
}

function resolveStaticFile(root, pathname) {
  const normalized = String(pathname || "/").replace(/\\/g, "/");
  if (normalized.split("/").includes("..")) {
    return null;
  }
  if (normalized === "/") {
    return safeJoin(root, "index.html");
  }
  if (normalized.startsWith("/vendor/three/")) {
    return safeJoin(path.join(root, "node_modules", "three"), normalized.slice("/vendor/three/".length));
  }
  if (normalized.startsWith("/vendor/tesseract/")) {
    return safeJoin(path.join(root, "node_modules", "tesseract.js", "dist"), normalized.slice("/vendor/tesseract/".length));
  }
  if (normalized.startsWith("/vendor/tesseract-core/")) {
    return safeJoin(path.join(root, "node_modules", "tesseract.js-core"), normalized.slice("/vendor/tesseract-core/".length));
  }
  if (normalized.startsWith("/vendor/tesseract-data/")) {
    const fileName = normalized.slice("/vendor/tesseract-data/".length);
    const language = fileName.replace(/\.traineddata\.gz$/, "");
    if (!TESSERACT_LANGUAGES.has(language) || fileName !== `${language}.traineddata.gz`) {
      return null;
    }
    return safeJoin(path.join(root, "node_modules", "@tesseract.js-data", language, "4.0.0"), fileName);
  }
  const publicFiles = new Set(['/index.html', '/app.js', '/styles.css', '/SIGNAGE_QUOTATION_MANUAL.html']);
  const frontendAsset = normalized.startsWith('/src/')
    && !/^\/src\/(server|desktop)\//.test(normalized)
    && /\.(js|mjs|css|png|svg|jpg|jpeg|webp|woff2?|ttf)$/i.test(normalized);
  return publicFiles.has(normalized) || frontendAsset ? safeJoin(root, normalized) : null;
}

module.exports = { resolveStaticFile, safeJoin };
