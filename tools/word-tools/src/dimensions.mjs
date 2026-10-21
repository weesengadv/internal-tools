export function dimensionLabel(bounds, unit = 'mm') {
  if (unit === 'hidden') return '';
  const divisor = unit === 'inch' ? 25.4 : 1;
  const digits = unit === 'inch' ? 2 : 1;
  return `${((bounds[2] - bounds[0]) / divisor).toFixed(digits)} × ${((bounds[3] - bounds[1]) / divisor).toFixed(digits)} ${unit === 'inch' ? 'in' : 'mm'}`;
}
