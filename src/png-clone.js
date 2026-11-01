(function (root) {
  "use strict";

  function prepareClone(clonedDoc) {
    const workspace = clonedDoc.querySelector(".workspace");
    if (workspace) {
      workspace.style.padding = "0";
      workspace.style.background = "#ffffff";
      workspace.style.overflow = "visible";
      workspace.style.display = "block";
      workspace.style.position = "relative";
    }
    const sheet = clonedDoc.getElementById("patronSheet");
    if (sheet) {
      sheet.style.transform = "none";
      sheet.style.padding = "0";
      sheet.style.margin = "0";
      sheet.style.border = "none";
      sheet.style.position = "relative";
    }
    const boxGrid = clonedDoc.getElementById("boxGrid");
    if (boxGrid) boxGrid.classList.add("hide-labels");
    clonedDoc.querySelectorAll(".panel").forEach((panel) => {
      panel.style.colorAdjust = "exact";
      panel.style.webkitPrintColorAdjust = "exact";
      panel.style.printColorAdjust = "exact";
    });
    clonedDoc.querySelectorAll(".field-resize-handle").forEach((handle) => {
      handle.style.display = "none";
    });
    clonedDoc.querySelectorAll(".panel-label, .safe-margin").forEach((element) => {
      element.style.display = "none";
    });
    ["floatingToolbar", "groupToolbar"].forEach((id) => {
      const toolbar = clonedDoc.getElementById(id);
      if (toolbar) toolbar.classList.remove("show");
    });
    clonedDoc.querySelectorAll(
      ".custom-field.selected, .custom-field.field-overflow, .custom-field.field-overlap",
    ).forEach((element) => {
      element.classList.remove("selected", "field-overflow", "field-overlap");
      element.style.outline = "none";
    });
  }

  root.PackagingPngClone = Object.freeze({ prepareClone });
})(window);
