(function (root) {
  "use strict";
  function createFieldToSvg(options) {
function fieldToSvg(f, aabbX, aabbY, aabbW, aabbH) {
  const rot = options.normalizeRotation(f.rotation);
  // Centre de l'AABB = centre de la boîte locale (transform-origin:center).
  const cx = aabbX + aabbW / 2, cy = aabbY + aabbH / 2;
  let x = aabbX, y = aabbY, w = aabbW, h = aabbH;
  if (rot) {
    const vis = options.getVisualSize(f);
    // Reconstruit les dimensions locales en px SVG à partir du ratio
    // local/AABB calculé sur le modèle (indépendant des unités).
    w = vis.w > 0 ? (f.w / vis.w) * aabbW : aabbW;
    h = vis.h > 0 ? (f.h / vis.h) * aabbH : aabbH;
    x = cx - w / 2;
    y = cy - h / 2;
  }
  const c = f.color || "#0f172a";
  const fs = f.fontSize || 10;
  const content = String(f.content || "")
    .replace(/COMPANY NAME/g, options.labName)
    .replace(/YOUR SLOGAN HERE/g, options.slogan);
  const align = f.align || "left";
  const fw = f.bold ? 800 : 400;
  const fontSpec = `${fw} ${fs}px Arial, Helvetica, sans-serif`;
  const monoSpec = `${fw} ${fs}px "Courier New", monospace`;

  const anchorX = align === "center" ? x + w / 2 : (align === "right" ? x + w - 2 : x + 2);
  const textAnchor = align === "center" ? "middle" : (align === "right" ? "end" : "start");
  const rotAttr = rot ? ` transform="rotate(${rot} ${cx.toFixed(2)} ${cy.toFixed(2)})"` : "";
  let inner = "";

  // Clip par champ — équivalent à overflow:hidden du DOM, empêche
  // tout débordement du contenu hors de la zone du champ.
  const clipId = options.nextClipId();
  options.clipDefs.push(`<clipPath id="${clipId}"><rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}"/></clipPath>`);

  if (f.type === "barcode") {
    inner = options.createCodeSvg(f, x, y, w, h, content, c, fs, fw, options.escapeHtml);
  } else if (f.type === "datamatrix") {
    inner = PackagingExportPrimitives.createCodeSvg(f, x, y, w, h, content, c, fs, fw);
  } else if (f.type === "braille") {
    const bText = options.toBraille(content);
    const bFont = `${fw} ${fs}px "Courier New", monospace`;
    const lines = options.pngTextTools.wrap(bText, w - 4, bFont);
    let t = "";
    lines.forEach((ln, i) => {
      t += `<tspan x="${anchorX.toFixed(2)}" dy="${i === 0 ? fs : fs * 1.2}">${options.escapeHtml(ln)}</tspan>`;
    });
    inner = `<text y="${(y + 2).toFixed(2)}" text-anchor="${textAnchor}" font-family="monospace" font-size="${fs}" fill="${c}">${t}</text>`
      + `<text x="${anchorX.toFixed(2)}" y="${(y + 2 + lines.length * fs * 1.2 + fs * 0.55).toFixed(2)}" text-anchor="${textAnchor}" font-family="monospace" font-size="${(fs * 0.55).toFixed(1)}" fill="#64748b">${options.escapeHtml(content)}</text>`;
  } else if (f.type === "pictogram") {
    const r = Math.min(w, h) / 2 * 0.92;
    const lines = options.pngTextTools.wrap(content, Math.min(w, h) * 0.86, fontSpec);
    const n = lines.length;
    let t = "";
    lines.forEach((ln, i) => {
      t += `<tspan x="${cx.toFixed(2)}" dy="${i === 0 ? (-(n - 1) * fs * 0.5) : fs}">${options.escapeHtml(ln)}</tspan>`;
    });
    inner = `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${r.toFixed(2)}" fill="none" stroke="${c}" stroke-width="3"/>`
      + `<text y="${cy.toFixed(2)}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${fs}" font-weight="${fw}" fill="${c}">${t}</text>`;
  } else if (f.type === "table") {
    const rows = content.split("\n").map(l => l.trim()).filter(Boolean).map(line => {
      const idx = line.indexOf(":");
      return { name: idx >= 0 ? line.slice(0, idx).trim() : line, val: idx >= 0 ? line.slice(idx + 1).trim() : "" };
    });
    let t = "";
    const lh = fs * 1.25;
    const halfW = Math.max(4, (w / 2) - 6);
    rows.forEach((row, i) => {
      const ty = y + fs + i * lh;
      const nm = options.pngTextTools.wrap(row.name, halfW, fontSpec)[0] || "";
      const vl = options.pngTextTools.wrap(row.val, halfW, fontSpec)[0] || "";
      t += `<text x="${(x + 2).toFixed(2)}" y="${ty.toFixed(2)}" font-family="Arial, sans-serif" font-size="${fs}" font-weight="${fw}" fill="${c}">${options.escapeHtml(nm)}</text>`;
      t += `<text x="${(x + w - 2).toFixed(2)}" y="${ty.toFixed(2)}" text-anchor="end" font-family="Arial, sans-serif" font-size="${fs}" font-weight="${fw}" fill="${c}">${options.escapeHtml(vl)}</text>`;
    });
    inner = t;
  } else if (f.type === "shape") {
    inner = options.buildShapeSvg(f, x, y, w, h);
  } else if (f.type === "logo") {
    inner = options.buildLogoSvg(f, x, y, w, h);
  } else if (f.type === "image") {
    if (f.src && f.src.indexOf("data:") === 0) {
      const fit = f.fit || "contain";
      const par = fit === "fill" ? "none" : (fit === "cover" ? "xMidYMid slice" : "xMidYMid meet");
      inner = `<image x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" href="${f.src}" xlink:href="${f.src}" preserveAspectRatio="${par}"/>`;
    } else {
      inner = `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" fill="none" stroke="#94a3b8" stroke-dasharray="3 2"/><text x="${cx.toFixed(2)}" y="${cy.toFixed(2)}" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" fill="#94a3b8">Image</text>`;
    }
  } else {
    const lines = options.pngTextTools.wrap(content, w - 4, fontSpec);
    let t = "";
    lines.forEach((ln, i) => {
      const dy = i === 0 ? fs : fs * 1.2;
      t += `<tspan x="${anchorX.toFixed(2)}" dy="${dy.toFixed(2)}">${options.escapeHtml(ln)}</tspan>`;
    });
    inner = `<text y="${(y + 2).toFixed(2)}" text-anchor="${textAnchor}" font-family="Arial, sans-serif" font-size="${fs}" font-weight="${fw}" fill="${c}">${t}</text>`;
  }
  return `<g clip-path="url(#${clipId})"${rotAttr}>${inner}</g>`;
}

    return fieldToSvg;
  }
  root.PackagingFieldSvg = Object.freeze({ createFieldToSvg });
})(window);
