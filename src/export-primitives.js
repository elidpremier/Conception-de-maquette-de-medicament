(function (root) {
  "use strict";

  function buildLogoSvg(field, x, y, w, h, options = {}) {
    const color = field.color || "#1e3a8a";
    const accent = field.color2 || "#f97316";
    const showText = field.content !== "logo-only" && field.content !== "icon-only";
    const size = Math.min(h * 0.8, w * 0.5, 40);
    const ix = x + 2;
    const iy = y + (h - size) / 2;
    const escape = options.escapeHtml || ((value) => String(value));
    let inner = options.customLogoUrl
      ? `<image x="${ix.toFixed(2)}" y="${iy.toFixed(2)}" width="${size.toFixed(2)}" height="${size.toFixed(2)}" href="${options.customLogoUrl}" xlink:href="${options.customLogoUrl}" preserveAspectRatio="xMidYMid meet"/>`
      : `<svg x="${ix.toFixed(2)}" y="${iy.toFixed(2)}" width="${size.toFixed(2)}" height="${size.toFixed(2)}" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="${color}"/><path d="M30 50H70M50 30V70" stroke="${accent}" stroke-width="8" stroke-linecap="round"/><circle cx="50" cy="50" r="10" fill="#ffffff"/></svg>`;
    if (showText) {
      const tx = ix + size + 4;
      const name = field.content || options.labName || "";
      const slogan = options.slogan || "";
      const fontSize = Math.max(6, field.fontSize || 10);
      inner += `<text x="${tx.toFixed(2)}" y="${(y + h / 2 - fontSize * 0.3).toFixed(2)}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="800" fill="${color}">${escape(name)}</text>`;
      inner += `<text x="${tx.toFixed(2)}" y="${(y + h / 2 + fontSize * 0.9).toFixed(2)}" font-family="Arial, sans-serif" font-size="${(fontSize * 0.7).toFixed(1)}" font-weight="700" fill="${accent}">${escape(slogan)}</text>`;
    }
    return inner;
  }

  function createCodeSvg(field, x, y, w, h, content, color, fontSize, fontWeight, escapeHtml = (value) => String(value)) {
    const value = String(content || "");
    if (field.type === "barcode") {
      let bars = "";
      let cursor = x + 2;
      let seed = 0;
      const source = value || "1234567890123";
      for (let i = 0; i < source.length; i += 1) seed = (seed * 31 + source.charCodeAt(i)) >>> 0;
      const count = 38;
      const barWidth = (w - 4) / count;
      for (let i = 0; i < count; i += 1) {
        seed = (Math.imul(seed, 1103515245) + 12345) >>> 0;
        const enabled = (seed >>> 16) % 2 === 0;
        const width = enabled ? barWidth * (0.5 + ((seed >>> 8) % 3) / 4) : barWidth * 0.3;
        if (enabled) bars += `<rect x="${cursor.toFixed(2)}" y="${(y + 2).toFixed(2)}" width="${width.toFixed(2)}" height="${(h * 0.6).toFixed(2)}" fill="#000000"/>`;
        cursor += barWidth;
      }
      const baseline = y + h * 0.62 + fontSize * 0.9;
      return bars + `<text x="${(x + w / 2).toFixed(2)}" y="${baseline.toFixed(2)}" text-anchor="middle" font-family="monospace" font-size="${(fontSize * 0.7).toFixed(1)}" font-weight="${fontWeight}" fill="${color}">${escapeHtml(value)}</text>`;
    }
    const size = 12;
    const cellW = w / size;
    const cellH = h / size;
    let cells = "";
    let seed = 0;
    for (let i = 0; i < value.length; i += 1) seed = (seed * 31 + value.charCodeAt(i)) >>> 0;
    for (let i = 0; i < size * size; i += 1) {
      seed = (Math.imul(seed, 1103515245) + 12345) >>> 0;
      if ((seed >>> 16) % 2 === 0) {
        const gx = i % size;
        const gy = Math.floor(i / size);
        cells += `<rect x="${(x + gx * cellW).toFixed(2)}" y="${(y + gy * cellH).toFixed(2)}" width="${cellW.toFixed(2)}" height="${cellH.toFixed(2)}" fill="${color}"/>`;
      }
    }
    return cells;
  }

  root.PackagingExportPrimitives = Object.freeze({ buildLogoSvg, createCodeSvg });
})(window);
