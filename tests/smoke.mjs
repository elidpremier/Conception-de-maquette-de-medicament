import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = new URL("..", import.meta.url);
const html = await readFile(new URL("index.html", root), "utf8");
const workflow = await readFile(new URL(".github/workflows/quality.yml", root), "utf8");

const assertions = [
  ["the document has one main landmark", (value) => (value.match(/<main\b/g) || []).length === 1],
  ["the main landmark wraps the application layout", (value) => /<main>[\s\S]*class="main-layout"[\s\S]*<\/main>\s*<!-- Retractable Footer/.test(value)],
  ["the document has a closing body and html tag", (value) => /<\/body>\s*<\/html>\s*$/.test(value)],
  ["the CI workflow installs dependencies and Chromium", () => workflow.includes("npm ci") && workflow.includes("playwright install --with-deps chromium")],
  ["default field presets are loaded from their module", (value) => value.includes('src/packaging-defaults.js') && value.includes("PackagingDefaults.defaultTabletFieldsConfig") && value.includes("PackagingDefaults.defaultLiquidFieldsConfig")],
  ["history state is isolated in its module", (value) => value.includes('src/history-controller.js') && value.includes("PackagingHistory.createHistoryController")],
  ["the Cloudflare challenge injection is absent", (value) => !value.includes("/cdn-cgi/challenge-platform/")],
  ["the access form requires explicit consent", (value) => /id="gateConsent"[^>]*required/.test(value)],
  ["the access gate is exposed as a labelled dialog", (value) => value.includes('role="dialog"') && value.includes('aria-labelledby="accessGateTitle"')],
  ["EmailJS credentials are deployment configuration", (value) => value.includes("window.PACKAGING_EMAIL_CONFIG")],
  ["the access form does not persist the submitted name", (value) => !value.includes('localStorage.setItem("user_fullname"')],
  ["imported image sources are validated", (value) => value.includes("isSafeImageDataUrl") && value.includes("sanitizeImportedFields")],
  ["the predefined field picker has an associated label", (value) => value.includes('<label for="defaultFieldPicker">')],
  ["the reset face picker has an associated label", (value) => value.includes('<label for="resetFacePicker"')],
  ["dynamic editor labels are associated after rendering", (value) => value.includes("ensureAccessibleLabels") && value.includes("label.parentElement?.querySelector")],
  ["local persistence reports quota failures", (value) => value.includes("function saveToLocalStorage") && value.includes("Sauvegarde locale impossible")],
  ["local persistence handles unavailable storage reads", (value) => value.includes("function readFromLocalStorage") && value.includes("Lecture locale impossible")],
  ["image and template imports have size and type limits", (value) => value.includes("MAX_IMAGE_FILE_SIZE") && value.includes("MAX_TEMPLATE_FILE_SIZE") && value.includes("isAllowedTemplateFile")],
  ["static security metadata is present", (value) => value.includes('name="referrer"') && value.includes('http-equiv="Permissions-Policy"')],
  ["geometry updates are frame-scheduled", (value) => value.includes("function scheduleGeometryUpdate") && value.includes("requestAnimationFrame")],
  ["pure packaging utilities are loaded before the application", (value) => value.includes('src/packaging-utils.js') && value.includes("PackagingUtils.sanitizeImportedFields")],
  ["pure geometry utilities are used by the application", (value) => value.includes("PackagingUtils.getVisualSize") && value.includes("PackagingUtils.getFieldPlacement")],
  ["field schema migration uses the pure utility", (value) => value.includes("PackagingUtils.migrateFieldsV1toV2")],
  ["template serialization uses the pure utility", (value) => value.includes("PackagingUtils.createTemplate") && value.includes("PackagingUtils.parseTemplate")],
  ["local persistence uses the storage adapter", (value) => value.includes("PackagingUtils.createStorageAdapter") && value.includes("clearLocalStorage")],
  ["imported settings are sanitized before application", (value) => value.includes("PackagingUtils.sanitizeImportedSettings")],
  ["field identifiers are generated uniquely", (value) => value.includes("PackagingUtils.createUniqueFieldId") && value.includes("function createFieldId")],
  ["local JSON restores through safe parsing", (value) => value.includes("PackagingUtils.parseStoredJson") && value.includes("sanitizeImportedFaceColors(PackagingUtils.parseStoredJson")],
  ["global reset handles storage failures", (value) => value.includes("if (!clearLocalStorage())") && value.includes("Les données existantes ont été conservées")],
  ["file operations report import and download failures", (value) => value.includes("function reportFileOperationError") && value.includes("function downloadBlob") && value.includes("function readFileAsText") && value.includes("function readFileAsDataUrl")],
  ["file reading delegates to pure utilities", (value) => value.includes('PackagingUtils.readFileAs(file, "readAsText")') && value.includes('PackagingUtils.readFileAs(file, "readAsDataURL")')],
  ["imported fields are bounded and type-sanitized", (value) => value.includes("MAX_IMPORTED_FIELDS") && value.includes("PackagingUtils.sanitizeImportedFields")],
];

const failures = assertions
  .filter(([, assertion]) => !assertion(html))
  .map(([label]) => label);

const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map((match) => match[1])
  .filter((source) => source.trim());
const temp = await mkdtemp(join(tmpdir(), "packaging-tool-"));
try {
  for (const [index, source] of scripts.entries()) {
    const file = join(temp, `inline-${index}.js`);
    await writeFile(file, source);
    const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
    if (result.status !== 0) {
      failures.push(`inline script ${index + 1} has valid JavaScript syntax: ${result.stderr.trim()}`);
    }
  }
} finally {
  await rm(temp, { recursive: true, force: true });
}

if (failures.length > 0) {
  console.error(`Smoke checks failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Smoke checks passed (${assertions.length} document checks, ${scripts.length} inline scripts).`);
}
