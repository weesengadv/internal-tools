export function normalizePricingPayload(value) {
  if (!value || typeof value !== "object" || !value.pricing || !value.sync) {
    throw new Error("The pricing service returned an invalid response.");
  }
  return value;
}

export async function fetchPricingPayload({ force = false, fetchImpl = fetch } = {}) {
  const response = await fetchImpl(force ? "/api/signage/pricing/sync" : "/api/signage/pricing", {
    method: force ? "POST" : "GET",
    headers: { Accept: "application/json" }
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.error || "Google Sheet pricing is unavailable.");
  }
  return normalizePricingPayload(body);
}

export function formatPricingSyncStatus(sync, locale = undefined, timeZone = undefined) {
  const owner = sync?.ownerEmail || "Google Sheet";
  if (!sync?.syncedAt) {
    return `${owner} - not synced yet`;
  }
  const formatted = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    ...(timeZone ? { timeZone } : {})
  }).format(new Date(sync.syncedAt));
  const source = sync.source === "cache" ? "cached" : "live";
  return `${owner} - ${source} prices synced ${formatted}`;
}
