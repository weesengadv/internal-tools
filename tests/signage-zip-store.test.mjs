import assert from "node:assert/strict";
import { crc32, createStoreZip } from "../src/signage/zip-store.mjs";

const encoder = new TextEncoder();
assert.equal(crc32(encoder.encode("123456789")), 0xcbf43926);

const zipBlob = await createStoreZip([
  { name: "manifest.json", data: "{\"ok\":true}", type: "application/json" },
  { name: "attachments/note.txt", data: encoder.encode("hello") }
]);

assert.equal(zipBlob.type, "application/zip");
const bytes = new Uint8Array(await zipBlob.arrayBuffer());
const decoded = new TextDecoder().decode(bytes);

assert.deepEqual([...bytes.slice(0, 4)], [0x50, 0x4b, 0x03, 0x04]);
assert.match(decoded, /manifest\.json/);
assert.match(decoded, /attachments\/note\.txt/);
assert.match(decoded, /\{"ok":true\}/);
assert.match(decoded, /hello/);
assert.deepEqual([...bytes.slice(-22, -18)], [0x50, 0x4b, 0x05, 0x06]);

await assert.rejects(
  createStoreZip([{ name: "../secret.txt", data: "no" }]),
  /unsafe/i
);
await assert.rejects(
  createStoreZip([
    { name: "same.txt", data: "a" },
    { name: "same.txt", data: "b" }
  ]),
  /duplicate/i
);

console.log("signage ZIP store tests passed");
