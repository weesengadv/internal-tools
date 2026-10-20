function finiteNumber(value, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

export function centeredDialogPosition(dialogSize, viewportSize) {
  return {
    x: Math.max(0, (finiteNumber(viewportSize?.width) - finiteNumber(dialogSize?.width)) / 2),
    y: Math.max(0, (finiteNumber(viewportSize?.height) - finiteNumber(dialogSize?.height)) / 2)
  };
}

export function clampDialogPosition(position, dialogSize, viewportSize, padding = 18) {
  const safePadding = Math.max(0, finiteNumber(padding, 18));
  const dialogWidth = Math.max(1, finiteNumber(dialogSize?.width, 1));
  const dialogHeight = Math.max(1, finiteNumber(dialogSize?.height, 1));
  const viewportWidth = Math.max(1, finiteNumber(viewportSize?.width, 1));
  const viewportHeight = Math.max(1, finiteNumber(viewportSize?.height, 1));
  const fallback = centeredDialogPosition({ width: dialogWidth, height: dialogHeight }, { width: viewportWidth, height: viewportHeight });
  const requestedX = finiteNumber(position?.x, fallback.x);
  const requestedY = finiteNumber(position?.y, fallback.y);
  const maxX = Math.max(safePadding, viewportWidth - dialogWidth - safePadding);
  const maxY = Math.max(safePadding, viewportHeight - dialogHeight - safePadding);

  return {
    x: Math.min(Math.max(requestedX, safePadding), maxX),
    y: Math.min(Math.max(requestedY, safePadding), maxY)
  };
}
