import assert from "node:assert/strict";
import {
  SIGNAGE_EXPORT_MODES,
  normalizeSignageExportMode,
  shouldShowSignageRateDetails,
  shouldShowSignageQuoteDetails
} from "../src/signage/export-mode.mjs";

assert.equal(SIGNAGE_EXPORT_MODES.FULL, "full");
assert.equal(SIGNAGE_EXPORT_MODES.TOTAL, "total");

assert.equal(normalizeSignageExportMode("full"), "full");
assert.equal(normalizeSignageExportMode("total"), "total");
assert.equal(normalizeSignageExportMode("unknown"), "full");
assert.equal(normalizeSignageExportMode(""), "full");

assert.equal(shouldShowSignageQuoteDetails("full"), true);
assert.equal(shouldShowSignageQuoteDetails("total"), false);
assert.equal(shouldShowSignageQuoteDetails("unknown"), true);

assert.equal(shouldShowSignageRateDetails(false), true);
assert.equal(shouldShowSignageRateDetails(true), false);
