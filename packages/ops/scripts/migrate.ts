import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import { env } from "@health-data/shared";
import { createLogger } from "@health-data/shared/logger";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const logger = createLogger({ name: "migration-runner" });
  
  // Create single connection using DATABASE_URL
  const client = new Client({
    connectionString: env.DATABASE_URL,
  });

  try {
    await client.connect();
    
    logger.info("🔄 Starting migrations...");

    // 1. Start Transaction
    await client.query("BEGIN");

    // 2. Advisory Lock (arbitrary ID 123456789)
    await client.query("SELECT pg_advisory_xact_lock(123456789)");

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

    // 5. Read migration files
    const migrationsDir = path.join(__dirname, "../../shared/db/migrations");
    
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
    }
    
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    // 6. Execution Loop
    let count = 0;
    for (const file of files) {
      if (!appliedNames.has(file)) {
        logger.info(`🚀 Executing: ${file}`);

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
      logger.info(`✅ Successfully applied ${count} migrations!`);
    } else {
      logger.info("✨ Database is up to date (no new migrations).");
    }

  } catch (error) {
    // Rollback on error
    try {
      await client.query("ROLLBACK");
    } catch (ignore) {}
    logger.error("❌ Migration failed (Rollback executed)", { error });
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
