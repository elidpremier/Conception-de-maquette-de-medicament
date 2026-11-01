import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const temp = await mkdtemp(join(tmpdir(), "packaging-browser-"));
const templatePath = join(temp, "template.json");
await writeFile(templatePath, JSON.stringify(template));

try {
  const page = await context.newPage();
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
    visibleLiquidZones: [...document.querySelectorAll('[id^="fieldzone-lp"]')]
      .filter((zone) => zone.getBoundingClientRect().width > 0 && zone.getBoundingClientRect().height > 0)
      .length,
    svgChildren: document.querySelector("#dieLinesSvg")?.children.length || 0,
  }));
  if (liquid.svgChildren < 1 || liquid.visibleLiquidZones < 4) {
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

  let invalidImportMessage = "";
  page.once("dialog", async (dialog) => {
    invalidImportMessage = dialog.message();
    await dialog.dismiss();
  });
  await page.locator("#importFieldsInput").setInputFiles({
    name: "invalid.json",
    mimeType: "application/json",
    buffer: Buffer.from("{invalid"),
  });
  await page.waitForTimeout(100);
  if (!invalidImportMessage.includes("Impossible de lire ce fichier JSON")) {
    throw new Error("L'import JSON invalide n'a pas affiché d'erreur.");
  }

  let oversizedImportMessage = "";
  page.once("dialog", async (dialog) => {
    oversizedImportMessage = dialog.message();
    await dialog.dismiss();
  });
  await page.locator("#importFieldsInput").setInputFiles({
    name: "oversized.json",
    mimeType: "application/json",
    buffer: Buffer.alloc(2 * 1024 * 1024 + 1, 0x20),
  });
  await page.waitForTimeout(100);
  if (!oversizedImportMessage.includes("Gabarit refusé")) {
    throw new Error("L'import JSON trop volumineux n'a pas été refusé.");
  }

  const jsonDownloadPromise = page.waitForEvent("download");
  await page.locator("#exportFieldsBtn").click();
  const jsonDownload = await jsonDownloadPromise;
  const jsonDownloadPath = await jsonDownload.path();
  if (!jsonDownloadPath) throw new Error("L'export JSON n'a pas produit de fichier.");
  const exportedTemplate = JSON.parse(await readFile(jsonDownloadPath, "utf8"));
  if (
    exportedTemplate.version !== 2 ||
    exportedTemplate.schemaVersion !== 2 ||
    !Array.isArray(exportedTemplate.fields) ||
    exportedTemplate.settings?.boxType !== "liquid"
  ) {
    throw new Error("La structure du gabarit JSON exporté est invalide.");
  }

  let invalidImageMessage = "";
  page.once("dialog", async (dialog) => {
    invalidImageMessage = dialog.message();
    await dialog.dismiss();
  });
  await page.locator("#logoUpload").setInputFiles({
    name: "logo.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from("<svg></svg>"),
  });
  await page.waitForTimeout(100);
  if (!invalidImageMessage.includes("Image refusée")) {
    throw new Error("L'image non autorisée n'a pas été refusée.");
  }

  await page.locator("#printBtn").click();
  const gate = await page.evaluate(() => ({
    visible: !document.querySelector("#accessGateOverlay")?.classList.contains("hidden"),
    consentRequired: document.querySelector("#gateConsent")?.required === true,
  }));
  if (!gate.visible || !gate.consentRequired) {
    throw new Error("La porte d'accès à l'impression n'est pas accessible.");
  }

  await page.keyboard.press("Escape");
  const focusable = await page.locator("main button, main input, main select, main textarea").count();
  if (focusable < 10) {
    throw new Error("Le parcours clavier ne contient pas assez de contrôles accessibles.");
  }

  const accessibility = await new AxeBuilder({ page }).analyze();
  const seriousAccessibility = accessibility.violations.filter((violation) =>
    ["critical", "serious"].includes(violation.impact),
  );
  if (seriousAccessibility.length) {
    const summary = seriousAccessibility
      .map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`)
      .join(", ");
    throw new Error(`Violations axe-core critiques/serious : ${summary}`);
  }

  await page.evaluate(() => {
    localStorage.setItem("packaging_fields_config_v1", "{corrupted");
    localStorage.setItem("packaging_faces_bg_v1", '{"p5":"not-a-color"}');
    localStorage.setItem("packaging_sidebar_sections_v1", "[]");
  });
  await page.reload();
  await page.waitForTimeout(500);
  const restored = await page.evaluate(() => ({
    svgChildren: document.querySelector("#dieLinesSvg")?.children.length || 0,
    summary: document.querySelector("#validationSummary")?.textContent || "",
  }));
  if (restored.svgChildren < 1 || restored.summary.includes("Impossible")) {
    throw new Error("La restauration depuis un stockage local corrompu a dégradé le rendu.");
  }

  await page.evaluate(() => {
    window.html2canvas = undefined;
  });
  const fallbackDownload = page.waitForEvent("download");
  await page.locator("#menuDropdownBtn").click();
  await page.locator("#exportPngAction").click();
  const download = await fallbackDownload;
  if (!download.suggestedFilename().endsWith(".png")) {
    throw new Error("Le fallback SVG n'a pas produit un téléchargement PNG.");
  }

  await page.evaluate(() => {
    window.URL.createObjectURL = () => {
      throw new Error("download blocked");
    };
  });
  let downloadErrorMessage = "";
  page.once("dialog", async (dialog) => {
    downloadErrorMessage = dialog.message();
    await dialog.dismiss();
  });
  await page.locator("#menuDropdownBtn").click();
  await page.locator("#exportPngAction").click();
  await page.waitForTimeout(150);
  if (!downloadErrorMessage.includes("Impossible de télécharger patron.png")) {
    throw new Error("L'échec de téléchargement PNG n'a pas été signalé.");
  }

  if (errors.length) throw new Error(`Erreur JavaScript navigateur : ${errors.join("; ")}`);
  console.log(`Browser checks passed (render, modes, resize, import, access gate, keyboard controls, PNG fallback, axe: ${accessibility.violations.length} violation(s)).`);
} finally {
  await context.close();
  await browser.close();
  await rm(temp, { recursive: true, force: true });
}
