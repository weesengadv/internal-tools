export const SIGNAGE_MEASURE_UNITS = Object.freeze({
  mm: { label: "mm", inchesPerUnit: 1 / 25.4 },
  cm: { label: "cm", inchesPerUnit: 1 / 2.54 },
  m: { label: "m", inchesPerUnit: 39.3700787 },
  inch: { label: "inch", inchesPerUnit: 1 },
  feet: { label: "feet", inchesPerUnit: 12 }
});

export const DEFAULT_SIGNAGE_MEASURE_UNIT = "inch";

export function normalizeSignageMeasureUnit(unit) {
  return Object.hasOwn(SIGNAGE_MEASURE_UNITS, unit) ? unit : DEFAULT_SIGNAGE_MEASURE_UNIT;
}

export function signageMeasureUnitLabel(unit) {
  return SIGNAGE_MEASURE_UNITS[normalizeSignageMeasureUnit(unit)].label;
}

export function convertSignageUnitToInches(value, unit) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return 0;
  }
  return numericValue * SIGNAGE_MEASURE_UNITS[normalizeSignageMeasureUnit(unit)].inchesPerUnit;
}

export function convertSignageInchesToUnit(value, unit) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return 0;
  }
  return numericValue / SIGNAGE_MEASURE_UNITS[normalizeSignageMeasureUnit(unit)].inchesPerUnit;
}
