(function (root) {
  "use strict";

  const polygonPoints = Object.freeze({
    triangle: Object.freeze([[50, 3], [97, 97], [3, 97]]),
    "triangle-inverted": Object.freeze([[3, 3], [97, 3], [50, 97]]),
    "right-triangle": Object.freeze([[3, 3], [97, 97], [3, 97]]),
    diamond: Object.freeze([[50, 3], [97, 50], [50, 97], [3, 50]]),
    pentagon: Object.freeze([[50, 3], [95, 38], [78, 95], [22, 95], [5, 38]]),
    hexagon: Object.freeze([[25, 3], [75, 3], [97, 50], [75, 97], [25, 97], [3, 50]]),
    star: Object.freeze([[50, 3], [61, 37], [97, 37], [68, 58], [79, 94], [50, 72], [21, 94], [32, 58], [3, 37], [39, 37]]),
    "arrow-right": Object.freeze([[3, 35], [60, 35], [60, 12], [97, 50], [60, 88], [60, 65], [3, 65]]),
    "arrow-left": Object.freeze([[97, 35], [40, 35], [40, 12], [3, 50], [40, 88], [40, 65], [97, 65]]),
    "arrow-up": Object.freeze([[35, 97], [35, 40], [12, 40], [50, 3], [88, 40], [65, 40], [65, 97]]),
    "arrow-down": Object.freeze([[35, 3], [35, 60], [12, 60], [50, 97], [88, 60], [65, 60], [65, 3]]),
    "chevron-right": Object.freeze([[10, 3], [55, 50], [10, 97], [30, 97], [75, 50], [30, 3]]),
  });

  const linePoints = Object.freeze({
    "line-horizontal": Object.freeze([3, 50, 97, 50]),
    "line-vertical": Object.freeze([50, 3, 50, 97]),
    "line-diagonal": Object.freeze([5, 5, 95, 95]),
  });

  function getShapeGeometry(shapeType) {
    if (linePoints[shapeType]) return { kind: "line", points: linePoints[shapeType] };
    return {
      kind: "polygon",
      points: polygonPoints[shapeType] || polygonPoints.triangle,
    };
  }

  root.PackagingShapeGeometry = Object.freeze({
    getShapeGeometry,
    polygonPoints,
    linePoints,
  });
})(window);
