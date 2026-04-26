import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import { Client } from "pg";
import {
  S3Client,
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketCorsCommand,
} from "@aws-sdk/client-s3";
import { env } from "@/config/env";
import { createLogger } from "@health-vitals/infra/logger";
import { Buckets } from "@health-vitals/infra/storage";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const logger = createLogger({ name: "migrator" });

/**
 * Calculate SHA-256 checksum of a string
 */
function calculateChecksum(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

async function initStorage() {
  const endpoint = env.STORAGE_ENDPOINT;
  const region = env.STORAGE_REGION;
  const accessKeyId = env.STORAGE_ACCESS_KEY;
  const secretAccessKey = env.STORAGE_SECRET_KEY;

  logger.info(`🔌 Connecting to storage at ${endpoint}...`);

  const s3 = new S3Client({
    endpoint,
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
  });

  const bucketName = Buckets.UPLOADS;

  try {
    // 1. Check if bucket exists
    try {
      await s3.send(new HeadBucketCommand({ Bucket: bucketName }));
      logger.info(`✅ Bucket '${bucketName}' already exists.`);
    } catch (error: any) {
      if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
        // 2. Create bucket
        logger.info(`🛠️ Creating bucket '${bucketName}'...`);
        await s3.send(new CreateBucketCommand({ Bucket: bucketName }));
        logger.info(`✅ Bucket '${bucketName}' created.`);
      } else {
        throw error;
      }
    }

    // 3. Set CORS policy
    try {
      logger.info(`🔐 Setting CORS policy for '${bucketName}'...`);
      await s3.send(
        new PutBucketCorsCommand({
          Bucket: bucketName,
          CORSConfiguration: {
            CORSRules: [
              {
                AllowedHeaders: ["*"],
                AllowedMethods: ["PUT", "POST", "GET", "HEAD"],
                AllowedOrigins: ["*"],
                ExposeHeaders: ["ETag"],
                MaxAgeSeconds: 3000,
              },
            ],
          },
        })
      );
      logger.info(`✅ CORS policy set.`);
    } catch (corsError: any) {
      if (corsError.name === "NotImplemented") {
        logger.info(
          `ℹ️ CORS policy not supported by this storage provider (NotImplemented). ` +
            `Ensure CORS is handled by the server environment (e.g., MINIO_API_CORS_ALLOW_ORIGIN).`
        );
      } else {
        logger.warn(
          `⚠️ Warning: Failed to set CORS policy. Client uploads might fail if running in browser.\n` +
            `Message: ${corsError.message}`
        );
      }
    }
  } catch (error) {
    logger.error("❌ Error initializing storage:", { error });
    // We don't exit here to allow migrations to run even if storage init fails
  }
}

async function migrate() {
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

async function run() {
  await initStorage();
  await migrate();
}

run();
