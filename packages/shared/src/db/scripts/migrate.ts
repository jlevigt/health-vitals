import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createDbPool } from "../index.ts";
import { createLogger } from "@/logger/index.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const logger = createLogger({ name: "migration-runner" });
  
  // Create pool using shared implementation (picks up env vars automatically)
  const pool = createDbPool({
    host: process.env.POSTGRES_HOST ?? "localhost",
    port: parseInt(process.env.POSTGRES_PORT ?? "5432"),
    database: process.env.POSTGRES_DB ?? "dev",
    user: process.env.POSTGRES_USER ?? "local_user",
    password: process.env.POSTGRES_PASSWORD ?? "local_password",
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
  const client = await pool.connect();

  try {
    logger.info("🔄 Starting migrations...");

    // 1. Start Transaction
    await client.query("BEGIN");

    // 2. Advisory Lock (arbitrary ID 123456789)
    // Prevents multiple containers from running migrations simultaneously
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
    const migrationsDir = path.join(__dirname, "../migrations");
    
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
    }
    
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Ensures chronological order due to timestamp prefixes

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
    await client.query("ROLLBACK");
    logger.error("❌ Migration failed (Rollback executed)", { error });
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
