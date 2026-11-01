import { chromium } from "playwright";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = new URL("..", import.meta.url);
const template = {
  version: 2,
  schemaVersion: 2,
  fields: [],
  settings: {
    boxType: "liquid",
    dimW: 80,
    dimH: 120,
    dimD: 30,
    flapLength: 20,
    dustFlapsEnabled: true,
    colPrimary: "#12233f",
    colAccent: "#f5a623",
    txtLabName: "Test",
    txtSlogan: "E2E",
    showLabName: true,
    logoSize: 22,
    customLogoUrl: null,
    customFacesBg: {},
  },
};

const browser = await chromium.launch({ headless: true });
const temp = await mkdtemp(join(tmpdir(), "packaging-browser-"));
const templatePath = join(temp, "template.json");
await writeFile(templatePath, JSON.stringify(template));

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(new URL("index.html", root).href);
  await page.waitForTimeout(100);

  const initial = await page.evaluate(() => ({
    svgChildren: document.querySelector("#dieLinesSvg")?.children.length || 0,
    sheetWidth: document.querySelector("#patronSheet")?.getBoundingClientRect().width || 0,
  }));
  if (initial.svgChildren < 1 || initial.sheetWidth <= 0) {
    throw new Error("Le patron SVG initial n'est pas rendu.");
  }

  await page.locator("#boxType").selectOption("liquid");
  await page.waitForTimeout(100);
  const liquid = await page.evaluate(() => ({
    visibleLiquidPanel: [...document.querySelectorAll(".panel")].some(
      (panel) => getComputedStyle(panel).display !== "none" && /^p[0-9]+$/.test(panel.id),
    ),
    svgChildren: document.querySelector("#dieLinesSvg")?.children.length || 0,
  }));
  if (liquid.svgChildren < 1 || !liquid.visibleLiquidPanel) {
    throw new Error("Le changement vers le mode liquide n'a pas rendu le patron.");
  }

  await page.locator("#dimW").fill("120");
  await page.waitForTimeout(100);
  const resized = await page.evaluate(() => ({
    width: Number.parseFloat(document.querySelector("#patronSheet")?.style.width || "0"),
    status: document.querySelector("#statusChip")?.textContent || "",
  }));
  if (resized.width <= initial.sheetWidth || !resized.status.includes("120")) {
    throw new Error("Le redimensionnement du patron n'est pas appliqué.");
  }

  await page.locator("#boxType").selectOption("tablet");
  await page.locator("#importFieldsInput").setInputFiles(templatePath);
  await page.waitForTimeout(100);
  const imported = await page.evaluate(() => ({
    boxType: document.querySelector("#boxType")?.value,
    svgChildren: document.querySelector("#dieLinesSvg")?.children.length || 0,
    summary: document.querySelector("#validationSummary")?.textContent || "",
  }));
  if (imported.boxType !== "liquid" || imported.svgChildren < 1 || imported.summary.includes("Impossible")) {
    throw new Error("L'import du gabarit n'a pas restauré le rendu.");
  }

  if (errors.length) throw new Error(`Erreur JavaScript navigateur : ${errors.join("; ")}`);
  console.log("Browser checks passed (initial render, modes, resize, template import).");
} finally {
  await browser.close();
  await rm(temp, { recursive: true, force: true });
}
