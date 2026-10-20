const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const { createPricingStore } = require("../src/server/pricing-sync.cjs");

(async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "weeseng-pricing-"));
  const cachePath = path.join(root, "data", "pricing-cache.json");
  const config = {
    googleSheetOwnerEmail: "weesengadv@gmail.com",
    googleSheetId: "sheet-123"
  };

  const firstPricing = { currency: "MYR", backingRateSqft: 42, workbookTabs: [{ name: "Emboss word" }] };
  const store = createPricingStore({
    cachePath,
    now: () => new Date("2026-08-03T04:05:06.000Z"),
    fetchPricing: async () => firstPricing
  });

  const live = await store.sync(config);
  assert.deepEqual(live.pricing, firstPricing);
  assert.equal(live.sync.source, "google-sheet");
  assert.equal(live.sync.ownerEmail, "weesengadv@gmail.com");
  assert.equal(live.sync.spreadsheetId, "sheet-123");
  assert.equal(live.sync.syncedAt, "2026-08-03T04:05:06.000Z");
  assert.equal(live.sync.warning, null);

  const diskCache = JSON.parse(fs.readFileSync(cachePath, "utf8"));
  assert.deepEqual(diskCache.pricing, firstPricing);
  assert.equal(diskCache.schemaVersion, 1);

  const cachedStore = createPricingStore({
    cachePath,
    fetchPricing: async () => {
      throw new Error("Google is unavailable");
    }
  });
  const cached = await cachedStore.get(config);
  assert.equal(cached.sync.source, "cache");
  assert.equal(cached.pricing.backingRateSqft, 42);

  await assert.rejects(() => cachedStore.sync(config), /Google is unavailable/);
  const cacheAfterFailure = JSON.parse(fs.readFileSync(cachePath, "utf8"));
  assert.deepEqual(cacheAfterFailure.pricing, firstPricing);

  fs.rmSync(cachePath, { force: true });
  await assert.rejects(() => cachedStore.get(config), /Google is unavailable/);

  fs.rmSync(root, { recursive: true, force: true });
  console.log("pricing sync tests passed");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
