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

console.log("Unit checks passed (utility sanitation and rotation).");
