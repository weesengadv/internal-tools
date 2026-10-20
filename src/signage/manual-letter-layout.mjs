import { convertSignageUnitToInches, normalizeSignageMeasureUnit } from "./measurement-units.mjs";

function safePositiveInteger(value, fallback = 1) {
  const numericValue = Math.floor(Number(value));
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : fallback;
}

function safeNonNegativeNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : 0;
}

function boxInsideBounds(box, bounds) {
  return (
    box.x >= bounds.x &&
    box.y >= bounds.y &&
    box.x + box.width <= bounds.x + bounds.width &&
    box.y + box.height <= bounds.y + bounds.height
  );
}

export function buildManualLetterLayout({
  baseBox,
  bounds,
  text = "",
  countX = 1,
  countY = 1,
  spacingX = 0,
  spacingY = 0,
  unit = "inch",
  pixelsPerInch = { x: 0, y: 0 },
  useTextAsHorizontalCount = false
}) {
  const textChars = Array.from(String(text).trim());
  const shouldUseTextCount = Boolean(useTextAsHorizontalCount && textChars.length);
  const resolvedCountX = shouldUseTextCount ? textChars.length : safePositiveInteger(countX);
  const resolvedCountY = safePositiveInteger(countY);
  const safeUnit = normalizeSignageMeasureUnit(unit);
  const spacingXIn = convertSignageUnitToInches(safeNonNegativeNumber(spacingX), safeUnit);
  const spacingYIn = convertSignageUnitToInches(safeNonNegativeNumber(spacingY), safeUnit);
  const spacingXPx = spacingXIn * (Number(pixelsPerInch?.x) || 0);
  const spacingYPx = spacingYIn * (Number(pixelsPerInch?.y) || 0);
  const totalBoxes = resolvedCountX * resolvedCountY;
  const splitText = shouldUseTextCount || textChars.length === totalBoxes;
  const fallbackText = textChars.length ? String(text).trim() : "?";
  const boxes = [];
  const spacingGuides = [];

  for (let yIndex = 0; yIndex < resolvedCountY; yIndex += 1) {
    for (let xIndex = 0; xIndex < resolvedCountX; xIndex += 1) {
      const index = yIndex * resolvedCountX + xIndex;
      const box = {
        x: baseBox.x + xIndex * (baseBox.width + spacingXPx),
        y: baseBox.y + yIndex * (baseBox.height + spacingYPx),
        width: baseBox.width,
        height: baseBox.height
      };
      boxes.push({
        box,
        xIndex,
        yIndex,
        text: splitText ? (textChars[index % textChars.length] || fallbackText) : fallbackText,
        insideBounds: boxInsideBounds(box, bounds)
      });
    }
  }

  if (spacingXPx > 0 && resolvedCountX > 1) {
    for (let yIndex = 0; yIndex < resolvedCountY; yIndex += 1) {
      for (let xIndex = 0; xIndex < resolvedCountX - 1; xIndex += 1) {
        const leftBox = boxes[yIndex * resolvedCountX + xIndex].box;
        spacingGuides.push({
          orientation: "horizontal",
          x1: leftBox.x + leftBox.width,
          y1: leftBox.y + leftBox.height / 2,
          x2: leftBox.x + leftBox.width + spacingXPx,
          y2: leftBox.y + leftBox.height / 2
        });
      }
    }
  }

  if (spacingYPx > 0 && resolvedCountY > 1) {
    for (let yIndex = 0; yIndex < resolvedCountY - 1; yIndex += 1) {
      for (let xIndex = 0; xIndex < resolvedCountX; xIndex += 1) {
        const topBox = boxes[yIndex * resolvedCountX + xIndex].box;
        spacingGuides.push({
          orientation: "vertical",
          x1: topBox.x + topBox.width / 2,
          y1: topBox.y + topBox.height,
          x2: topBox.x + topBox.width / 2,
          y2: topBox.y + topBox.height + spacingYPx
        });
      }
    }
  }

  return {
    unit: safeUnit,
    countX: resolvedCountX,
    countY: resolvedCountY,
    spacingXIn,
    spacingYIn,
    spacingXPx,
    spacingYPx,
    boxes,
    spacingGuides
  };
}
