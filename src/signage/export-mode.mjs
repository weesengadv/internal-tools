export const SIGNAGE_EXPORT_MODES = Object.freeze({
  FULL: "full",
  TOTAL: "total"
});

export function normalizeSignageExportMode(value) {
  return value === SIGNAGE_EXPORT_MODES.TOTAL ? SIGNAGE_EXPORT_MODES.TOTAL : SIGNAGE_EXPORT_MODES.FULL;
}

export function shouldShowSignageQuoteDetails(value) {
  return normalizeSignageExportMode(value) === SIGNAGE_EXPORT_MODES.FULL;
}

export function shouldShowSignageRateDetails(hideRateDetails) {
  return hideRateDetails !== true;
}
