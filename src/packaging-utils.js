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

  function getVisualSize(field, aspect = 1) {
    const rot = normalizeRotation(field.rotation);
    if (!rot) return { w: field.w, h: field.h };
    const rad = (rot * Math.PI) / 180;
    const c = Math.abs(Math.cos(rad));
    const s = Math.abs(Math.sin(rad));
    const ratio = Number.isFinite(aspect) && aspect > 0 ? aspect : 1;
    return {
      w: field.w * c + (field.h * s) / ratio,
      h: field.w * s * ratio + field.h * c,
    };
  }

  function fitFieldIntoFace(field, getSize = (value) => getVisualSize(value)) {
    const fitted = { ...field };
    let visual = getSize(fitted);
    if (visual.w > 100 || visual.h > 100) {
      const scale = Math.min(100 / visual.w, 100 / visual.h);
      fitted.w = Math.round(fitted.w * scale * 10) / 10;
      fitted.h = Math.round(fitted.h * scale * 10) / 10;
      visual = getSize(fitted);
    }
    fitted.x = Math.round(Math.max(0, Math.min(100 - visual.w, fitted.x)) * 10) / 10;
    fitted.y = Math.round(Math.max(0, Math.min(100 - visual.h, fitted.y)) * 10) / 10;
    return fitted;
  }

  function migrateFieldsV1toV2(fields, getAspect = () => 1) {
    if (!Array.isArray(fields)) return [];
    return fields.map((field) => {
      const rot = normalizeRotation(field.rotation);
      if (!rot) return field;
      const w = Number(field.w) || 0;
      const h = Number(field.h) || 0;
      const x = Number(field.x) || 0;
      const y = Number(field.y) || 0;
      const aspectValue = Number(getAspect(field.face));
      const aspect = Number.isFinite(aspectValue) && aspectValue > 0 ? aspectValue : 1;
      const wPx = (w / 100) * aspect;
      const hPx = h / 100;
      const xPx = (x / 100) * aspect;
      const yPx = y / 100;
      const rad = (rot * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const dxOldPct = w / 2 - ((cos * w) / 2 - (sin * h) / 2);
      const dyOldPct = h / 2 - ((sin * w) / 2 + (cos * h) / 2);
      const txPx = (dxOldPct / 100) * wPx;
      const tyPx = (dyOldPct / 100) * hPx;
      const originX = xPx + txPx;
      const originY = yPx + tyPx;
      let minX = Infinity;
      let minY = Infinity;
      for (const [offsetX, offsetY] of [[0, 0], [wPx, 0], [wPx, hPx], [0, hPx]]) {
        minX = Math.min(minX, originX + offsetX * cos - offsetY * sin);
        minY = Math.min(minY, originY + offsetX * sin + offsetY * cos);
      }
      return {
        ...field,
        x: Math.round((minX / aspect) * 1000) / 10,
        y: Math.round(minY * 1000) / 10,
      };
    });
  }

  function createTemplate(fields, settings, schemaVersion = 2) {
    return {
      version: 2,
      schemaVersion,
      fields: Array.isArray(fields) ? fields : [],
      settings: settings && typeof settings === "object" && !Array.isArray(settings)
        ? settings
        : {},
    };
  }

  function parseTemplate(value, schemaVersion = 2) {
    if (Array.isArray(value)) {
      return {
        fields: value,
        settings: null,
        needsMigration: true,
        format: "v1",
      };
    }
    if (!value || typeof value !== "object" || Array.isArray(value) || !Array.isArray(value.fields)) {
      return null;
    }
    return {
      fields: value.fields,
      settings: value.settings && typeof value.settings === "object" && !Array.isArray(value.settings)
        ? value.settings
        : null,
      needsMigration: Number(value.schemaVersion) < schemaVersion || !value.schemaVersion,
      format: "v2",
    };
  }

  function createStorageAdapter(storage, handlers = {}) {
    const reportReadError = handlers.onReadError || (() => {});
    const reportWriteError = handlers.onWriteError || (() => {});
    const reportClearError = handlers.onClearError || reportWriteError;

    return {
      read(key) {
        try {
          return storage ? storage.getItem(key) : null;
        } catch (error) {
          reportReadError(key, error);
          return null;
        }
      },
      write(key, value) {
        try {
          if (!storage) throw new Error("Storage unavailable");
          storage.setItem(key, value);
          return true;
        } catch (error) {
          reportWriteError(key, error);
          return false;
        }
      },
      clear() {
        try {
          if (!storage) throw new Error("Storage unavailable");
          storage.clear();
          return true;
        } catch (error) {
          reportClearError(error);
          return false;
        }
      },
    };
  }

  function parseStoredJson(value, fallback = null) {
    if (typeof value !== "string") return fallback;
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  function createUniqueFieldId(existingIds, preferredId = "field", suffixFactory = () => Date.now().toString(36)) {
    const used = new Set(existingIds);
    const base = String(preferredId || "field").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 100) || "field";
    let candidate = base;
    let attempt = 0;
    while (used.has(candidate)) {
      attempt += 1;
      candidate = `${base}_${suffixFactory()}_${attempt}`;
    }
    return candidate.slice(0, 120);
  }

  function getFieldPlacement(field, zoneW, zoneH) {
    const rot = normalizeRotation(field.rotation);
    const placement = {
      left: field.x,
      top: field.y,
      width: field.w,
      height: field.h,
      transformOrigin: "center center",
      transform: "",
    };
    if (!rot) return placement;
    const wPx = (field.w / 100) * zoneW;
    const hPx = (field.h / 100) * zoneH;
    const rad = (rot * Math.PI) / 180;
    const c = Math.abs(Math.cos(rad));
    const s = Math.abs(Math.sin(rad));
    const visWpx = wPx * c + hPx * s;
    const visHpx = wPx * s + hPx * c;
    const dx = (visWpx - wPx) / 2;
    const dy = (visHpx - hPx) / 2;
    placement.transform = `translate(${dx.toFixed(3)}px, ${dy.toFixed(3)}px) rotate(${rot}deg)`;
    return placement;
  }

  function sanitizeImportedFields(fields, validFaces, validTypes, options = {}) {
    if (!Array.isArray(fields)) return [];
    const maxFields = options.maxFields ?? 250;
    const faceSet = new Set(validFaces);
    const typeSet = new Set(validTypes);
    const idFactory = options.idFactory || ((index) => `imported-field-${Date.now()}-${index}`);
    const usedIds = new Set();
    const number = (value, fallback, min, max) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? Math.max(min, Math.min(max, parsed)) : fallback;
    };

    return fields
      .slice(0, maxFields)
      .filter((field) => field && typeof field === "object")
      .map((field, index) => {
        const preferredId = typeof field.id === "string" && /^[a-zA-Z0-9_-]{1,120}$/.test(field.id)
          ? field.id
          : idFactory(index);
        const id = createUniqueFieldId(usedIds, preferredId, () => `${index}`);
        usedIds.add(id);
        return {
        ...field,
        id,
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
        };
      });
  }

  function sanitizeImportedFaceColors(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value).filter(([face, color]) => typeof face === "string" && SAFE_COLOR.test(color)),
    );
  }

  function sanitizeImportedSettings(settings) {
    if (!settings || typeof settings !== "object" || Array.isArray(settings)) return {};
    const number = (value, min, max) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? Math.max(min, Math.min(max, parsed)) : null;
    };
    const text = (value, maxLength) =>
      typeof value === "string" ? value.slice(0, maxLength) : null;
    const sanitized = {};
    if (settings.boxType === "tablet" || settings.boxType === "liquid") {
      sanitized.boxType = settings.boxType;
    }
    for (const [key, min, max] of [
      ["dimW", 10, 300],
      ["dimH", 10, 300],
      ["dimD", 5, 150],
      ["flapLength", 8, 50],
    ]) {
      const value = number(settings[key], min, max);
      if (value !== null) sanitized[key] = value;
    }
    if (typeof settings.dustFlapsEnabled === "boolean") {
      sanitized.dustFlapsEnabled = settings.dustFlapsEnabled;
    }
    if (SAFE_COLOR.test(settings.colPrimary)) sanitized.colPrimary = settings.colPrimary;
    if (SAFE_COLOR.test(settings.colAccent)) sanitized.colAccent = settings.colAccent;
    for (const [key, maxLength] of [["txtLabName", 200], ["txtSlogan", 500]]) {
      const value = text(settings[key], maxLength);
      if (value !== null) sanitized[key] = value;
    }
    if (typeof settings.showLabName === "boolean") sanitized.showLabName = settings.showLabName;
    const logoSize = number(settings.logoSize, 10, 80);
    if (logoSize !== null) sanitized.logoSize = logoSize;
    sanitized.customLogoUrl = isSafeImageDataUrl(settings.customLogoUrl)
      ? settings.customLogoUrl
      : null;
    sanitized.customFacesBg = sanitizeImportedFaceColors(settings.customFacesBg);
    return sanitized;
  }

  root.PackagingUtils = Object.freeze({
    isSafeImageDataUrl,
    normalizeRotation,
    getVisualSize,
    fitFieldIntoFace,
    migrateFieldsV1toV2,
    createTemplate,
    parseTemplate,
    createStorageAdapter,
    createUniqueFieldId,
    parseStoredJson,
    getFieldPlacement,
    sanitizeImportedFields,
    sanitizeImportedFaceColors,
    sanitizeImportedSettings,
  });
})(window);
