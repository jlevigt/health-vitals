import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 1. Get migration name from arguments
const args = process.argv.slice(2);
const migrationName = args[0];

// Basic validation
if (!migrationName) {
  console.error("❌ Error: You must provide a migration name.");
  console.error("👉 Example: bun run migration:create create_users_table");
  process.exit(1);
}

// 2. Create timestamp (Date.now() returns milliseconds, ensuring chronological order)
const timestamp = Date.now().toString();

// Sanitize name (spaces to underscores, remove special chars)
const safeName = migrationName
  .toLowerCase()
  .replace(/[^a-z0-9]/g, "_")
  .replace(/_+/g, "_");

const filename = `${timestamp}_${safeName}.sql`;

// 3. Define migrations directory path
const migrationsDir = path.join(__dirname, "../../../database/migrations");
// Ensure directory exists
if (!fs.existsSync(migrationsDir)) {
  fs.mkdirSync(migrationsDir, { recursive: true });
}

const filePath = path.join(migrationsDir, filename);

// 4. Default content (Boilerplate)
const content = `-- Migration: ${safeName}
-- Created at: ${new Date().toISOString()}

-- Write your SQL below.
-- Use BEGIN and COMMIT to ensure atomic transactions.

BEGIN;

-- CREATE TABLE ...

COMMIT;
`;

// 5. Create the file
try {
  fs.writeFileSync(filePath, content);
  console.log("✅ Migration created successfully!");
  console.log(`📄 File: packages/shared/db/migrations/${filename}`);
} catch (error) {
  console.error("❌ Error creating migration file:", error);
  process.exit(1);
}
