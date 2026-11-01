(function (root) {
  "use strict";
function buildShapeSvg(f, x, y, w, h) {
  const st = f.shapeType || "rectangle";
  const c = f.color || "#1e3a8a";
  const c2 = f.color2 || "#f97316";
  const fillMode = f.fillMode || "fill";
  const sw = f.strokeWidth || 4;
  const fill = fillMode === "outline" ? "none" : c;
  const stroke = fillMode === "outline" ? c : "none";

  const geometry = root.PackagingShapeGeometry.getShapeGeometry(st);
  function polyPts(pts) { return pts.map(p => `${p[0]},${p[1]}`).join(" "); }

  let inner = "";
  if (st === "circle" || st === "pill") {
    inner = `<ellipse cx="50" cy="50" rx="48" ry="48" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  } else if (st === "rounded-rectangle") {
    inner = `<rect x="3" y="3" width="94" height="94" rx="14" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  } else if (st === "rectangle") {
    inner = `<rect x="2" y="2" width="96" height="96" fill="${fill}"/>`;
  } else if (geometry.kind === "polygon" && geometry.points) {
    inner = `<polygon points="${polyPts(geometry.points)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`;
  } else if (geometry.kind === "line") {
    const L = geometry.points;
    inner = `<line x1="${L[0]}" y1="${L[1]}" x2="${L[2]}" y2="${L[3]}" stroke="${c}" stroke-width="${sw}" stroke-linecap="round"/>`;
  } else if (st === "ring") {
    inner = `<ellipse cx="50" cy="50" rx="44" ry="44" fill="none" stroke="${c}" stroke-width="${sw}"/>`;
  } else if (st === "outline-frame" || st === "outline-frame-rounded") {
    const rx = st === "outline-frame-rounded" ? 10 : 0;
    inner = `<rect x="3" y="3" width="94" height="94" rx="${rx}" fill="none" stroke="${c}" stroke-width="${sw}"/>`;
  } else if (st === "double-frame") {
    inner = `<rect x="3" y="3" width="94" height="94" fill="none" stroke="${c}" stroke-width="${sw}"/><rect x="9" y="9" width="82" height="82" fill="none" stroke="${c2}" stroke-width="2"/>`;
  } else if (st === "diagonal-tl-br") {
    inner = `<rect x="2" y="2" width="96" height="96" fill="${c}"/><polygon points="100,0 100,100 0,100" fill="${c2}"/>`;
  } else if (st === "diagonal-tr-bl") {
    inner = `<rect x="2" y="2" width="96" height="96" fill="${c}"/><polygon points="0,0 100,0 0,100" fill="${c2}"/>`;
  } else if (st === "split-horizontal") {
    inner = `<rect x="2" y="2" width="96" height="48" fill="${c}"/><rect x="2" y="50" width="96" height="48" fill="${c2}"/>`;
  } else if (st === "split-vertical") {
    inner = `<rect x="2" y="2" width="48" height="96" fill="${c}"/><rect x="50" y="2" width="48" height="96" fill="${c2}"/>`;
  } else if (st === "corner-accent-tr") {
    inner = `<rect x="2" y="2" width="96" height="96" fill="${c}"/><polygon points="100,0 100,45 55,0" fill="${c2}"/>`;
  } else if (st === "curve-wave") {
    inner = `<rect x="2" y="2" width="96" height="96" fill="${c}"/><path d="M0,55 C30,40 70,70 100,50 L100,100 L0,100 Z" fill="${c2}"/>`;
  } else if (st === "gradient-linear" || st === "gradient-horizontal") {
    inner = `<rect x="2" y="2" width="96" height="96" fill="${c}"/><polygon points="100,0 100,100 0,100" fill="${c2}"/>`;
  } else if (st === "gradient-vertical") {
    inner = `<rect x="2" y="2" width="96" height="96" fill="${c}"/><polygon points="0,100 100,100 100,0" fill="${c2}"/>`;
  } else if (st === "gradient-radial") {
    inner = `<rect x="2" y="2" width="96" height="96" fill="${c}"/><circle cx="30" cy="30" r="70" fill="${c2}"/>`;
  } else if (st === "stripes-diagonal" || st === "stripes-horizontal") {
    inner = `<rect x="2" y="2" width="96" height="96" fill="${c}"/>`;
    const horiz = st === "stripes-horizontal";
    for (let i = 0; i < 10; i++) {
      const p = 6 + i * 10;
      inner += horiz
        ? `<rect x="2" y="${p}" width="96" height="5" fill="${c2}"/>`
        : `<rect x="${p}" y="2" width="5" height="96" fill="${c2}"/>`;
    }
  } else if (st === "dots-pattern" || st === "grid-pattern") {
    inner = `<rect x="2" y="2" width="96" height="96" fill="${c}"/>`;
    if (st === "dots-pattern") {
      for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
        inner += `<circle cx="${12 + i * 20}" cy="${12 + j * 20}" r="4" fill="${c2}"/>`;
      }
    } else {
      for (let i = 1; i < 5; i++) {
        inner += `<line x1="${2 + i * 19}" y1="2" x2="${2 + i * 19}" y2="98" stroke="${c2}" stroke-width="1.5"/>`;
        inner += `<line x1="2" y1="${2 + i * 19}" x2="98" y2="${2 + i * 19}" stroke="${c2}" stroke-width="1.5"/>`;
      }
    }
  } else if (st === "custom") {
    if (f.points && f.points.length >= 2) {
      const pts = f.points.map(p => `${p.x},${p.y}`).join(" ");
      inner = f.closed
        ? `<polygon points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`
        : `<polyline points="${pts}" fill="none" stroke="${c}" stroke-width="${sw}" stroke-linejoin="round"/>`;
    } else {
      inner = `<rect x="2" y="2" width="96" height="96" fill="${c}"/>`;
    }
  } else {
    inner = `<rect x="2" y="2" width="96" height="96" fill="${fill}"/>`;
  }
  return `<svg x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" viewBox="0 0 100 100" preserveAspectRatio="none">${inner}</svg>`;
}
  root.PackagingShapeSvg = Object.freeze({ buildShapeSvg });
})(window);
