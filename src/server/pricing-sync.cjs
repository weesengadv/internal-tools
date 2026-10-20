const fs = require("fs");
const path = require("path");

const CACHE_SCHEMA_VERSION = 1;

function readCache(cachePath) {
  if (!fs.existsSync(cachePath)) {
    return null;
  }

  const cache = JSON.parse(fs.readFileSync(cachePath, "utf8"));
  if (cache.schemaVersion !== CACHE_SCHEMA_VERSION || !cache.pricing || !cache.syncedAt) {
    throw new Error("The saved Google Sheet pricing cache is invalid.");
  }
  return cache;
}

function writeCacheAtomic(cachePath, value) {
  const directory = path.dirname(cachePath);
  fs.mkdirSync(directory, { recursive: true });
  const temporaryPath = `${cachePath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(temporaryPath, cachePath);
}

function responseFromCache(cache, source = "cache", warning = null) {
  return {
    pricing: cache.pricing,
    sync: {
      source,
      ownerEmail: cache.ownerEmail,
      spreadsheetId: cache.spreadsheetId,
      syncedAt: cache.syncedAt,
      warning
    }
  };
}

function createPricingStore({ cachePath, fetchPricing, now = () => new Date() }) {
  if (!cachePath || typeof fetchPricing !== "function") {
    throw new TypeError("Pricing store requires cachePath and fetchPricing.");
  }

  async function sync(config) {
    const pricing = await fetchPricing(config);
    if (!pricing || typeof pricing !== "object" || Array.isArray(pricing)) {
      throw new Error("Google Sheet returned invalid pricing data.");
    }

    const cache = {
      schemaVersion: CACHE_SCHEMA_VERSION,
      syncedAt: now().toISOString(),
      ownerEmail: config.googleSheetOwnerEmail,
      spreadsheetId: config.googleSheetId,
      pricing
    };
    writeCacheAtomic(cachePath, cache);
    return responseFromCache(cache, "google-sheet");
  }

  async function get(config) {
    const cache = readCache(cachePath);
    if (cache) {
      return responseFromCache(cache);
    }
    return sync(config);
  }

  return { get, read: () => readCache(cachePath), sync };
}

module.exports = {
  CACHE_SCHEMA_VERSION,
  createPricingStore,
  readCache,
  writeCacheAtomic
};
