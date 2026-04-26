import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import { env } from "@health-vitals/core/config";
import { createLogger } from "@health-vitals/infra/logger";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const logger = createLogger({ name: "migrator" });
  
  // Create single connection using DATABASE_URL
  const client = new Client({
    connectionString: env.DATABASE_URL,
  });

  try {
    await client.connect();
    
    logger.info("Starting database migrations...");

    // 1. Start Transaction
    await client.query("BEGIN");

    // 2. Advisory Lock (consistent ID across all instances)
    await client.query("SELECT pg_advisory_xact_lock(1769100000000)");

    // 3. Create control table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        run_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 4. Read applied migrations
    const { rows: appliedMigrations } = await client.query("SELECT name FROM migrations");
    const appliedNames = new Set(appliedMigrations.map((row) => row.name));

    // 5. Resolve migration files directory
    // Default to the relative path from src, but allow override via env for Docker
    const migrationsDir = process.env.MIGRATIONS_DIR || path.join(__dirname, "../../../database/migrations");
    
    logger.info(`Reading migrations from: ${migrationsDir}`);

    if (!fs.existsSync(migrationsDir)) {
      logger.error(`Migrations directory not found: ${migrationsDir}`);
      process.exit(1);
    }
    
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    // 6. Execution Loop
    let count = 0;
    for (const file of files) {
      if (!appliedNames.has(file)) {
        logger.info(`Applying migration: ${file}`);

        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, "utf-8");

        // Execute migration SQL
        await client.query(sql);

        // Record migration
        await client.query("INSERT INTO migrations (name) VALUES ($1)", [file]);
        count++;
      }
    }

    // 7. Final Commit
    await client.query("COMMIT");
    
    if (count > 0) {
      logger.info(`Successfully applied ${count} migrations.`);
    } else {
      logger.info("Database is already up to date.");
    }

  } catch (error) {
    // Rollback on error
    try {
      await client.query("ROLLBACK");
    } catch (ignore) {}
    logger.error("Migration failed. Transaction rolled back.", { error });
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
