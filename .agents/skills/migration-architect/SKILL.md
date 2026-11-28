---
name: migration-architect
description: >-
  Guides forward-only, non-destructive PostgreSQL schema migrations in Health Vitals.
  Use whenever proposing, creating, reviewing, or modifying database tables, columns,
  indexes, constraints, or files under database/migrations/ or apps/jobs/migrator/.
---

# Database Migration Workflow

Follow these rules whenever designing or implementing schema changes in Health Vitals.

## Safety Mandates

1. **Forward-Only:** Production does not run `down` migrations. Fix faulty migrations by adding a new forward migration.
2. **Immutable History (Checksum Enforcement):** `apps/jobs/migrator/src/index.ts` computes SHA-256 checksums of every file in `database/migrations/` and aborts if a previously applied file changes. **Never edit an already-applied migration.**
3. **Single-Transaction Execution:** The migrator wraps all pending `.sql` files inside one `BEGIN ... COMMIT` transaction guarded by `pg_advisory_xact_lock(1769100000000)`.
   - Avoid statements forbidden inside a PostgreSQL transaction block (such as `CREATE INDEX CONCURRENTLY`) unless executed via a separate out-of-band mechanism.
   - Do not assume nested `BEGIN`/`COMMIT` statements inside a `.sql` file will isolate sub-transactions (note that `scripts/migration-create.sh` stubs `BEGIN;`/`COMMIT;` — remove them or verify clean execution against Postgres with `bun run migration:run` because Postgres warns or breaks outer transaction boundaries if an inner `COMMIT;` closes the migrator's outer transaction!).
4. **Non-Destructive (Expand-then-Contract):** Never execute `DROP COLUMN`, `DROP TABLE`, `RENAME COLUMN`, or breaking `ALTER COLUMN TYPE` in the same deployment as code expecting the old schema.
   - **Expand:** Add new nullable columns, defaults, or tables; update code to dual-write if needed.
   - **Backfill:** Populate new columns safely in bounded batches.
   - **Contract:** Switch readers to the new schema and deploy.
   - **Cleanup:** Drop obsolete columns/tables in a separate, subsequent PR after rollout verification.
5. **Idempotent DDL:** Use `IF NOT EXISTS` / `IF EXISTS` guards (`CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`).

## Step-by-Step Procedure

1. **Inspect existing schema:** Review all files in `database/migrations/` to understand current table structures, constraints, and naming conventions.
2. **Generate a migration file:**
   ```bash
   bun run migration:create <descriptive_snake_case_name>
   ```
   This creates `database/migrations/<epoch_ms>_<name>.sql`.
3. **Author SQL:**
   - Remove the stub `BEGIN;` and `COMMIT;` lines so the migrator's outer transaction manages atomicity cleanly across checksum recording.
   - Ensure every statement is idempotent and non-breaking for currently running `api` and `worker` instances.
4. **Update contracts and tests:** Align `@health-vitals/contracts` schemas and add/update integration tests covering the schema change.
5. **Verify locally:**
   ```bash
   bun run migration:run
   bun run typecheck
   bun run test
   ```
   Confirm the migration applies cleanly on both a fresh database and a re-run (no-op with matching SHA-256 checksum).
