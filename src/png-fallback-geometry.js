(function (root) {
  "use strict";

  function getPanelClipPoly(boxType, id, ratios) {
    const { pctRabat, pctCote, pctRect } = ratios;
    if (boxType === "tablet") {
      return {
        p1: [[100, 0], [100, 100], [pctRabat, 100], [0, 85], [0, 15], [pctRabat, 0]],
        p10: [[0, 0], [0, 100], [pctCote, 100], [100, 85], [100, 15], [pctCote, 0]],
        p2: [[5, 0], [95, 0], [85, 100], [15, 100]],
        p3: [[100, 0], [100, 100], [20, 80], [20, 0]],
        p4: [[0, 0], [0, 100], [80, 80], [80, 0]],
        p11: [[100, 0], [100, 100], [20, 100], [20, 20]],
        p13: [[0, 0], [100, 0], [80, 100], [20, 100]],
      }[id] || null;
    }
    return {
      p1: [[0, 100], [100, 100], [100, pctRect], [85, 0], [15, 0], [0, pctRect]],
      p10: [[0, 0], [100, 0], [100, pctRect], [85, 100], [15, 100], [0, pctRect]],
      p2: [[20, 0], [80, 0], [100, 100], [0, 100]],
      p3: [[20, 0], [80, 0], [100, 100], [0, 100]],
      p4: [[0, 0], [100, 0], [80, 100], [20, 100]],
      p11: [[0, 0], [100, 0], [80, 100], [20, 100]],
      p9: [[0, 5], [0, 95], [100, 85], [100, 15]],
    }[id] || null;
  }

  function polyToPath(poly, box) {
    if (!poly) return `M${box.left} ${box.top} H${box.left + box.width} V${box.top + box.height} H${box.left} Z`;
    const points = poly.map((point) =>
      `${(box.left + point[0] / 100 * box.width).toFixed(2)} ${(box.top + point[1] / 100 * box.height).toFixed(2)}`);
    return `M${points.join(" L")} Z`;
  }

  root.PackagingFallbackGeometry = Object.freeze({ getPanelClipPoly, polyToPath });
})(window);
