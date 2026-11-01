(function (root) {
  "use strict";

  const SAFE_IMAGE_DATA_URL = /^data:image\/(?:png|jpeg|gif|webp);base64,[a-z0-9+/=\s]+$/i;
  const SAFE_COLOR = /^#[0-9a-f]{6}$/i;

  function isSafeImageDataUrl(value) {
    return typeof value === "string" && SAFE_IMAGE_DATA_URL.test(value);
  }

  function normalizeRotation(rot) {
    return (((Number(rot) || 0) % 360) + 360) % 360;
  }

  function sanitizeImportedFields(fields, validFaces, validTypes, options = {}) {
    if (!Array.isArray(fields)) return [];
    const maxFields = options.maxFields ?? 250;
    const faceSet = new Set(validFaces);
    const typeSet = new Set(validTypes);
    const idFactory = options.idFactory || ((index) => `imported-field-${Date.now()}-${index}`);
    const number = (value, fallback, min, max) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? Math.max(min, Math.min(max, parsed)) : fallback;
    };

    return fields
      .slice(0, maxFields)
      .filter((field) => field && typeof field === "object")
      .map((field, index) => ({
        ...field,
        id: typeof field.id === "string" && field.id.length <= 120 ? field.id : idFactory(index),
        type: typeSet.has(field.type) ? field.type : "text",
        face: faceSet.has(field.face) ? field.face : "p5",
        x: number(field.x, 10, -50, 200),
        y: number(field.y, 10, -50, 200),
        w: number(field.w, 30, 1, 200),
        h: number(field.h, 15, 1, 200),
        fontSize: number(field.fontSize, 10, 4, 60),
        rotation: [0, 90, 180, 270].includes(Number(field.rotation)) ? Number(field.rotation) : 0,
        align: ["left", "center", "right"].includes(field.align) ? field.align : "left",
        color: SAFE_COLOR.test(field.color) ? field.color : "#1e3a8a",
        color2: SAFE_COLOR.test(field.color2) ? field.color2 : "#f97316",
        content: typeof field.content === "string" ? field.content.slice(0, 20000) : "",
        label: typeof field.label === "string" ? field.label.slice(0, 200) : "Champ",
        src: isSafeImageDataUrl(field.src) ? field.src : null,
      }));
  }

  function sanitizeImportedFaceColors(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value).filter(([face, color]) => typeof face === "string" && SAFE_COLOR.test(color)),
    );
  }

  root.PackagingUtils = Object.freeze({
    isSafeImageDataUrl,
    normalizeRotation,
    sanitizeImportedFields,
    sanitizeImportedFaceColors,
  });
})(window);
