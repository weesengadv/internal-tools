const assert = require("assert");

const { handlePricingApi } = require("../src/server/pricing-api.cjs");

(async () => {
  const config = {
    googleSheetOwnerEmail: "weesengadv@gmail.com",
    googleSheetId: "sheet-123",
    googleSheetSyncOnStartup: true
  };
  const calls = [];
  const payload = {
    pricing: { currency: "MYR", source: "google-workbook" },
    sync: { source: "cache", syncedAt: "2026-08-03T04:05:06.000Z" }
  };
  const store = {
    get: async () => {
      calls.push("get");
      return payload;
    },
    sync: async () => {
      calls.push("sync");
      return { ...payload, sync: { ...payload.sync, source: "google-sheet" } };
    }
  };

  const cached = await handlePricingApi({ method: "GET", config, store });
  assert.equal(cached.status, 200);
  assert.equal(cached.body.sync.source, "cache");
  assert.equal(cached.body.sync.syncOnStartup, true);

  const live = await handlePricingApi({ method: "POST", config, store });
  assert.equal(live.status, 200);
  assert.equal(live.body.sync.source, "google-sheet");
  assert.deepEqual(calls, ["get", "sync"]);

  const failed = await handlePricingApi({
    method: "POST",
    config,
    store: { sync: async () => { throw new Error("Tab LED failed: 500"); } }
  });
  assert.equal(failed.status, 503);
  assert.equal(failed.body.error, "Tab LED failed: 500");
  assert.equal(failed.body.sync.ownerEmail, "weesengadv@gmail.com");
  assert.equal(failed.body.sync.spreadsheetId, "sheet-123");

  console.log("pricing API tests passed");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
