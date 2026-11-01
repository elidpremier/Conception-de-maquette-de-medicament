import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
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

  if (errors.length) throw new Error(`Erreur JavaScript navigateur : ${errors.join("; ")}`);
  console.log(`Browser checks passed (render, modes, resize, import, access gate, keyboard controls, axe: ${accessibility.violations.length} violation(s)).`);
} finally {
  await context.close();
  await browser.close();
  await rm(temp, { recursive: true, force: true });
}
