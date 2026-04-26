import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import { Client } from "pg";
import { env } from "@health-vitals/core/config";
import { createLogger } from "@health-vitals/infra/logger";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Calculate SHA-256 checksum of a string
 */
function calculateChecksum(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

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

    // 3. Create control table if not exists with checksum column
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        checksum CHAR(64) NOT NULL,
        run_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Ensure checksum column exists (for backward compatibility if migrating from older version)
    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='migrations' AND column_name='checksum') THEN
          ALTER TABLE migrations ADD COLUMN checksum CHAR(64);
        END IF;
      END $$;
    `);

    // 4. Read applied migrations
    const { rows: appliedRows } = await client.query("SELECT name, checksum FROM migrations");
    const appliedMigrations = new Map(appliedRows.map((row) => [row.name, row.checksum]));

    // 5. Resolve migration files directory
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
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, "utf-8");
      const currentChecksum = calculateChecksum(sql);

      if (appliedMigrations.has(file)) {
        // Verify checksum
        const storedChecksum = appliedMigrations.get(file);
        
        if (storedChecksum) {
          if (storedChecksum.trim() !== currentChecksum) {
            logger.error(`❌ DIVERGENCE DETECTED: Migration "${file}" has been modified!`);
            logger.error(`   Stored: ${storedChecksum}`);
            logger.error(`   Current: ${currentChecksum}`);
            throw new Error(`Migration checksum mismatch for ${file}`);
          }
        } else {
          // Backfill missing checksum for existing migration
          logger.info(`Backfilling missing checksum for: ${file}`);
          await client.query("UPDATE migrations SET checksum = $1 WHERE name = $2", [currentChecksum, file]);
        }
        continue;
      }

      logger.info(`Applying migration: ${file}`);

      // Execute migration SQL
      await client.query(sql);

      // Record migration with checksum
      await client.query("INSERT INTO migrations (name, checksum) VALUES ($1, $2)", [file, currentChecksum]);
      count++;
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
