import assert from "node:assert/strict";
import {
  fetchPricingPayload,
  formatPricingSyncStatus,
  normalizePricingPayload
} from "../src/signage/pricing-sync-ui.mjs";

const payload = normalizePricingPayload({
  pricing: { currency: "MYR", backingRateSqft: 33 },
  sync: {
    source: "google-sheet",
    ownerEmail: "weesengadv@gmail.com",
    spreadsheetId: "sheet-123",
    syncedAt: "2026-08-03T04:05:06.000Z",
    warning: null
  }
});

assert.equal(payload.pricing.backingRateSqft, 33);
assert.equal(payload.sync.ownerEmail, "weesengadv@gmail.com");
assert.match(formatPricingSyncStatus(payload.sync, "en-MY", "Asia/Kuala_Lumpur"), /weesengadv@gmail\.com/);
assert.match(formatPricingSyncStatus(payload.sync, "en-MY", "Asia/Kuala_Lumpur"), /12:05/);

const requests = [];
const live = await fetchPricingPayload({
  force: true,
  fetchImpl: async (url, options) => {
    requests.push({ url, options });
    return {
      ok: true,
      json: async () => ({
        pricing: { currency: "MYR" },
        sync: { source: "google-sheet", ownerEmail: "weesengadv@gmail.com", syncedAt: "2026-08-03T04:05:06.000Z" }
      })
    };
  }
});

assert.equal(requests[0].url, "/api/signage/pricing/sync");
assert.equal(requests[0].options.method, "POST");
assert.equal(live.sync.source, "google-sheet");

await assert.rejects(
  () => fetchPricingPayload({
    fetchImpl: async () => ({ ok: false, json: async () => ({ error: "No cached prices" }) })
  }),
  /No cached prices/
);

console.log("signage pricing sync UI tests passed");
