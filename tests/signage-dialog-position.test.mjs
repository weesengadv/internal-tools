import assert from "node:assert/strict";
import { clampDialogPosition } from "../src/signage/dialog-position.mjs";

function testClampsInsideViewport() {
  assert.deepEqual(
    clampDialogPosition({ x: -40, y: -20 }, { width: 300, height: 200 }, { width: 1000, height: 700 }, 18),
    { x: 18, y: 18 }
  );

  assert.deepEqual(
    clampDialogPosition({ x: 950, y: 680 }, { width: 300, height: 200 }, { width: 1000, height: 700 }, 18),
    { x: 682, y: 482 }
  );
}

function testCentersWhenPositionMissing() {
  assert.deepEqual(
    clampDialogPosition(null, { width: 300, height: 200 }, { width: 1000, height: 700 }, 18),
    { x: 350, y: 250 }
  );
}

function testHandlesTinyViewport() {
  assert.deepEqual(
    clampDialogPosition({ x: 100, y: 100 }, { width: 500, height: 400 }, { width: 320, height: 260 }, 18),
    { x: 18, y: 18 }
  );
}

testClampsInsideViewport();
testCentersWhenPositionMissing();
testHandlesTinyViewport();

console.log("signage dialog position tests passed");
