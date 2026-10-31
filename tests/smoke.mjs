import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = new URL("..", import.meta.url);
const html = await readFile(new URL("index.html", root), "utf8");

const assertions = [
  ["the document has one main landmark", (value) => (value.match(/<main\b/g) || []).length === 1],
  ["the document has a closing body and html tag", (value) => /<\/body>\s*<\/html>\s*$/.test(value)],
  ["the Cloudflare challenge injection is absent", (value) => !value.includes("/cdn-cgi/challenge-platform/")],
  ["the access form requires explicit consent", (value) => /id="gateConsent"[^>]*required/.test(value)],
  ["EmailJS credentials are deployment configuration", (value) => value.includes("window.PACKAGING_EMAIL_CONFIG")],
  ["the access form does not persist the submitted name", (value) => !value.includes('localStorage.setItem("user_fullname"')],
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
