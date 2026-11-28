import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const errors: string[] = [];

function check(condition: boolean, message: string): void {
  if (!condition) {
    errors.push(message);
  }
}

function readRepoFile(relPath: string): string {
  const fullPath = path.join(rootDir, relPath);
  if (!fs.existsSync(fullPath)) {
    errors.push(`Missing required infrastructure file: ${relPath}`);
    return "";
  }
  return fs.readFileSync(fullPath, "utf-8");
}

function extractEnvKeys(content: string): Set<string> {
  const keys = new Set<string>();
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIndex = line.indexOf("=");
    if (eqIndex > 0) {
      keys.add(line.slice(0, eqIndex).trim());
    }
  }
  return keys;
}

// 1. Verify required repo-tracked infrastructure files exist
const requiredFiles = [
  "neon.ts",
  "apps/web/vercel.json",
  "infra/README.md",
  "infra/production.env.example",
  "infra/dns/README.md",
  "infra/fly/api.toml",
  "infra/fly/worker.toml",
  "infra/fly/deploy.sh",
  ".github/workflows/ci.yml",
];

const contents = new Map<string, string>();
for (const file of requiredFiles) {
  contents.set(file, readRepoFile(file));
}

// 2. Verify Neon bucket name parity across neon.ts, Fly configs, production.env.example, and platform storage
const expectedBucket = "health-vitals-uploads";
const neonTs = contents.get("neon.ts") ?? "";
const apiToml = contents.get("infra/fly/api.toml") ?? "";
const workerToml = contents.get("infra/fly/worker.toml") ?? "";
const prodEnvContent = contents.get("infra/production.env.example") ?? "";

check(neonTs.includes(`"${expectedBucket}"`), `neon.ts must declare bucket "${expectedBucket}"`);
check(
  apiToml.includes(`STORAGE_BUCKET = "${expectedBucket}"`),
  `infra/fly/api.toml must set STORAGE_BUCKET = "${expectedBucket}"`,
);
check(
  workerToml.includes(`STORAGE_BUCKET = "${expectedBucket}"`),
  `infra/fly/worker.toml must set STORAGE_BUCKET = "${expectedBucket}"`,
);
check(
  prodEnvContent.includes(`STORAGE_BUCKET=${expectedBucket}`),
  `infra/production.env.example must set STORAGE_BUCKET=${expectedBucket}`,
);

// 3. Verify Fly API health check and port settings
check(apiToml.includes('path = "/health"'), 'infra/fly/api.toml must check path = "/health"');
check(apiToml.includes("internal_port = 3000"), "infra/fly/api.toml must set internal_port = 3000");

// 4. Verify Vercel JSON is valid and configures SPA rewrites
const vercelRaw = contents.get("apps/web/vercel.json") ?? "";
if (vercelRaw) {
  try {
    const parsed = JSON.parse(vercelRaw) as { rewrites?: unknown[] };
    check(
      Array.isArray(parsed.rewrites) && parsed.rewrites.length > 0,
      "apps/web/vercel.json must define SPA rewrites",
    );
  } catch (err) {
    errors.push(`apps/web/vercel.json is invalid JSON: ${String(err)}`);
  }
}

// 5. Verify production.env.example covers all core production env keys from packages/platform/src/config/env.ts
const prodEnvKeys = extractEnvKeys(prodEnvContent);
const requiredProdKeys = [
  "NODE_ENV",
  "PORT",
  "DATABASE_URL",
  "STORAGE_ENDPOINT",
  "STORAGE_REGION",
  "STORAGE_ACCESS_KEY",
  "STORAGE_SECRET_KEY",
  "STORAGE_BUCKET",
  "RABBITMQ_URL",
  "WEB_URL",
  "SECRET_JWT_KEY",
  "MAIL_PROVIDER",
  "MAIL_FROM",
  "RESEND_API_KEY",
  "LLM_PROVIDER",
  "GEMINI_API_KEY",
  "GEMINI_MODEL",
  "VITE_API_URL",
];

for (const key of requiredProdKeys) {
  check(
    prodEnvKeys.has(key),
    `infra/production.env.example is missing required production key: ${key}`,
  );
}

// 6. Verify env.ts schema still defines the backend keys referenced in production.env.example
const envTs = readRepoFile("packages/platform/src/config/env.ts");
for (const key of requiredProdKeys.filter((k) => k !== "VITE_API_URL")) {
  check(
    envTs.includes(`${key}:`),
    `packages/platform/src/config/env.ts does not define key "${key}"`,
  );
}

if (errors.length > 0) {
  process.stderr.write(`Infrastructure config check failed (${errors.length} issue(s)):\n`);
  for (const error of errors) {
    process.stderr.write(`  - ${error}\n`);
  }
  process.exit(1);
}

process.stdout.write(
  `Infrastructure config check passed (${requiredFiles.length} manifests, ${requiredProdKeys.length} prod env keys verified).\n`,
);
