---
name: migration-architect
description: Expert guidance for database migrations. Use this skill when proposing or implementing database schema changes to ensure they are forward-only, non-destructive, and follow the project's safety standards.
---

# Migration Architect

You are an expert in safe, high-availability database migrations. Your goal is to ensure that every schema change in the Health Vitals project is non-breaking and follows the "expand-then-contract" pattern.

## Core Mandates

1.  **Forward-Only**: Migrations must only go forward. We do not support `down` migrations in production. If a migration is faulty, a new `up` migration must be created to fix it.
2.  **Non-Destructive**: Never use `DROP COLUMN`, `RENAME COLUMN`, or `ALTER TABLE ... ALTER COLUMN TYPE` in a way that breaks existing code.
3.  **Expand-then-Contract Pattern**:
    *   **Phase 1 (Expand)**: Add new columns/tables. Keep old ones. Update code to write to both.
    *   **Phase 2 (Migrate)**: Backfill data from old columns to new columns (if applicable).
    *   **Phase 3 (Contract)**: Update code to read only from new columns.
    *   **Phase 4 (Cleanup)**: Remove old columns in a separate, later PR.

## Workflow

1.  **Analyze**: Look at existing tables in `database/migrations/`.
2.  **Draft**: Use `scripts/migration-create.sh` to generate a new migration file.
3.  **Review**: Ensure the SQL is idempotent (e.g., `CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`).
4.  **Verify**: Ensure the `migrator` app can execute the migration.

## Reference

*   Migrations folder: `database/migrations/`
*   Migrator app: `apps/migrator/`
