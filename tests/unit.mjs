import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";

const source = await readFile(new URL("../src/packaging-utils.js", import.meta.url), "utf8");
const context = { window: {} };
runInNewContext(source, context);
const utils = context.window.PackagingUtils;

const fields = utils.sanitizeImportedFields(
  [{
    id: "x".repeat(121),
    type: "unknown",
    face: "invalid",
    x: 999,
    fontSize: 1,
    rotation: 45,
    color: "red",
    content: "x".repeat(20001),
    src: "data:image/svg+xml;base64,unsafe",
  }],
  ["p5"],
  ["text"],
  { idFactory: (index) => `test-${index}` },
);

if (utils.normalizeRotation(-90) !== 270) throw new Error("Rotation normalization failed.");
const visual = utils.getVisualSize({ w: 20, h: 40, rotation: 90 }, 2);
if (Math.abs(visual.w - 20) > 0.001 || Math.abs(visual.h - 40) > 0.001) {
  throw new Error("Visual size calculation failed.");
}
const placement = utils.getFieldPlacement({ x: 10, y: 20, w: 30, h: 20, rotation: 90 }, 200, 100);
if (!placement.transform.includes("rotate(90deg)") || !placement.transform.includes("translate(-20.000px, 20.000px)")) {
  throw new Error("Field placement calculation failed.");
}
const fitted = utils.fitFieldIntoFace({ x: 95, y: 95, w: 80, h: 80, rotation: 90 }, (field) =>
  utils.getVisualSize(field, 1),
);
if (fitted.x !== 20 || fitted.y !== 20 || fitted.w !== 80 || fitted.h !== 80) {
  throw new Error("Field fitting calculation failed.");
}
const migrated = utils.migrateFieldsV1toV2(
  [{ id: "rotated", face: "p5", x: 10, y: 20, w: 30, h: 20, rotation: 90 }],
  () => 2,
);
if (migrated[0].x !== 7.5 || migrated[0].y !== 19) {
  throw new Error("Field schema migration failed.");
}
const exported = utils.createTemplate([{ id: "field" }], { boxType: "tablet" }, 2);
if (exported.version !== 2 || exported.fields.length !== 1 || exported.settings.boxType !== "tablet") {
  throw new Error("Template serialization failed.");
}
const roundTrip = utils.parseTemplate(JSON.parse(JSON.stringify(exported)), 2);
const roundTripFields = utils.sanitizeImportedFields(roundTrip.fields, ["p5"], ["text"]);
const roundTripSettings = utils.sanitizeImportedSettings(roundTrip.settings);
if (roundTripFields[0].id !== "field" || roundTripSettings.boxType !== "tablet") {
  throw new Error("Template round-trip changed valid data.");
}
const oldTemplate = utils.parseTemplate([{ id: "legacy" }], 2);
const newTemplate = utils.parseTemplate(exported, 2);
if (!oldTemplate?.needsMigration || oldTemplate.format !== "v1" || newTemplate?.needsMigration || newTemplate.format !== "v2") {
  throw new Error("Template parsing or version detection failed.");
}
if (utils.parseTemplate({ invalid: true }, 2) !== null) {
  throw new Error("Malformed template parsing failed.");
}
const memory = new Map();
const storage = {
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => memory.set(key, value),
  clear: () => memory.clear(),
};
const uniqueIds = utils.sanitizeImportedFields(
  [
    { id: "same", type: "text", face: "p5" },
    { id: "same", type: "text", face: "p5" },
    { id: "unsafe id", type: "text", face: "p5" },
  ],
  ["p5"],
  ["text"],
  { idFactory: (index) => `imported-${index}` },
);
if (new Set(uniqueIds.map((field) => field.id)).size !== 3 ||
    uniqueIds[0].id !== "same" || !/^same_/.test(uniqueIds[1].id) ||
    !/^imported-2$/.test(uniqueIds[2].id)) {
  throw new Error("Field identifier uniqueness failed.");
}
if (utils.createUniqueFieldId(["text", "text_1"], "text", () => "copy") !== "text_copy_1") {
  throw new Error("Field identifier generation failed.");
}
if (utils.parseStoredJson('{"ok":true}')?.ok !== true ||
    utils.parseStoredJson("{broken}", "fallback") !== "fallback" ||
    utils.parseStoredJson(null, "fallback") !== "fallback") {
  throw new Error("Stored JSON parsing failed.");
}
const adapter = utils.createStorageAdapter(storage);
if (!adapter.write("settings", '{"ok":true}') || adapter.read("settings") !== '{"ok":true}') {
  throw new Error("Storage adapter read/write failed.");
}
adapter.clear();
if (adapter.read("settings") !== null) throw new Error("Storage adapter clear failed.");
let writeErrors = 0;
const failingAdapter = utils.createStorageAdapter({
  setItem: () => { throw new Error("quota"); },
}, { onWriteError: () => { writeErrors++; } });
if (failingAdapter.write("settings", "x") || writeErrors !== 1) {
  throw new Error("Storage adapter failure handling failed.");
}
if (fields.length !== 1 || fields[0].id !== "test-0" || fields[0].type !== "text") {
  throw new Error("Field type or identifier sanitation failed.");
}
if (fields[0].x !== 200 || fields[0].fontSize !== 4 || fields[0].rotation !== 0) {
  throw new Error("Field bounds sanitation failed.");
}
if (fields[0].content.length !== 20000 || fields[0].src !== null) {
  throw new Error("Field content or image sanitation failed.");
}
if (JSON.stringify(utils.sanitizeImportedFaceColors({ p5: "#123456", p6: "red" })) !== '{"p5":"#123456"}') {
  throw new Error("Face color sanitation failed.");
}
const settings = utils.sanitizeImportedSettings({
  boxType: "liquid",
  dimW: 999,
  dimH: "bad",
  flapLength: 1,
  colPrimary: "red",
  txtLabName: "x".repeat(300),
  showLabName: false,
  logoSize: 999,
  customLogoUrl: "data:image/svg+xml;base64,bad",
});
if (settings.boxType !== "liquid" || settings.dimW !== 300 || settings.dimH !== undefined ||
    settings.flapLength !== 8 || settings.colPrimary !== undefined || settings.txtLabName.length !== 200 ||
    settings.showLabName !== false || settings.logoSize !== 80 || settings.customLogoUrl !== null) {
  throw new Error("Imported settings sanitation failed.");
}

console.log("Unit checks passed (utility sanitation and rotation).");
