(function (root) {
  "use strict";

  function toObjectBoundingBoxPoints(rawPoints) {
    return rawPoints.split(/\s*,\s*/).map((pair) => pair.trim().split(/\s+/).map((value) => {
      if (value.includes("%")) return parseFloat(value) / 100;
      const number = parseFloat(value);
      return number <= 0 ? 0 : (number >= 100 ? 1 : number / 100);
    }));
  }

  function applyPolygonClip(clonedDoc, id) {
    const element = clonedDoc.getElementById(id);
    if (!element) return false;
    if (clonedDoc.defaultView && clonedDoc.defaultView.getComputedStyle(element).display === "none") {
      return false;
    }
    const match = element.style.clipPath.match(/polygon\s*\(([^)]+)\)/i);
    if (!match) return false;
    const points = toObjectBoundingBoxPoints(match[1].trim())
      .map((point) => `${point[0].toFixed(4)},${point[1].toFixed(4)}`)
      .join(" ");
    const clipId = `pngclip_panel_${id}`;
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = clonedDoc.createElementNS(svgNS, "svg");
    svg.setAttribute("width", "0");
    svg.setAttribute("height", "0");
    svg.style.position = "absolute";
    svg.style.pointerEvents = "none";
    svg.style.overflow = "hidden";
    const defs = clonedDoc.createElementNS(svgNS, "defs");
    const clipPath = clonedDoc.createElementNS(svgNS, "clipPath");
    clipPath.setAttribute("id", clipId);
    clipPath.setAttribute("clipPathUnits", "objectBoundingBox");
    const polygon = clonedDoc.createElementNS(svgNS, "polygon");
    polygon.setAttribute("points", points);
    clipPath.appendChild(polygon);
    defs.appendChild(clipPath);
    svg.appendChild(defs);
    element.appendChild(svg);
    element.style.clipPath = `url(#${clipId})`;
    element.style.overflow = "hidden";
    element.style.border = "none";
    return true;
  }

  function applyPanelClips(clonedDoc, panelIds) {
    return panelIds.filter((id) => applyPolygonClip(clonedDoc, id)).length;
  }

  root.PackagingPngClips = Object.freeze({
    applyPanelClips,
    applyPolygonClip,
    toObjectBoundingBoxPoints,
  });
})(window);
