import assert from "node:assert/strict";
import { buildManualLetterLayout } from "../src/signage/manual-letter-layout.mjs";
import {
  convertSignageUnitToInches,
  convertSignageInchesToUnit,
  normalizeSignageMeasureUnit
} from "../src/signage/measurement-units.mjs";

function assertClose(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 0.0000001, `${actual} should be close to ${expected}`);
}

function testMeasurementUnits() {
  assert.equal(normalizeSignageMeasureUnit("mm"), "mm");
  assert.equal(normalizeSignageMeasureUnit("bad-unit"), "inch");
  assertClose(convertSignageUnitToInches(1000, "mm"), 1000 / 25.4);
  assertClose(convertSignageUnitToInches(100, "cm"), 100 / 2.54);
  assertClose(convertSignageUnitToInches(2, "m"), 2 * 39.3700787);
  assert.equal(convertSignageUnitToInches(3, "feet"), 36);
  assertClose(convertSignageInchesToUnit(39.3700787, "m"), 1);
}

function testTextDrivenHorizontalCount() {
  const layout = buildManualLetterLayout({
    baseBox: { x: 10, y: 20, width: 30, height: 40 },
    bounds: { x: 0, y: 0, width: 300, height: 200 },
    text: "ABC",
    countX: 1,
    countY: 1,
    spacingX: 50,
    spacingY: 0,
    unit: "mm",
    pixelsPerInch: { x: 2, y: 2 },
    useTextAsHorizontalCount: true
  });

  assert.equal(layout.countX, 3);
  assert.equal(layout.boxes.length, 3);
  assert.deepEqual(layout.boxes.map((item) => item.text), ["A", "B", "C"]);
  assertClose(layout.spacingXPx, (50 / 25.4) * 2);
  assert.equal(layout.boxes[1].box.x, 10 + 30 + layout.spacingXPx);
}

function testManualCountFallbackAndBounds() {
  const layout = buildManualLetterLayout({
    baseBox: { x: 10, y: 20, width: 30, height: 40 },
    bounds: { x: 0, y: 0, width: 79, height: 80 },
    text: "SHOP",
    countX: 3,
    countY: 1,
    spacingX: 1,
    spacingY: 0,
    unit: "inch",
    pixelsPerInch: { x: 10, y: 10 },
    useTextAsHorizontalCount: false
  });

  assert.equal(layout.countX, 3);
  assert.deepEqual(layout.boxes.map((item) => item.text), ["SHOP", "SHOP", "SHOP"]);
  assert.deepEqual(layout.boxes.map((item) => item.insideBounds), [true, false, false]);
}

testMeasurementUnits();
testTextDrivenHorizontalCount();
testManualCountFallbackAndBounds();

console.log("signage measurement and manual letter layout tests passed");
