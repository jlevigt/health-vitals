# Migrator Application

## Purpose
Run-once containerized application to execute database schema migrations and initialize infrastructure (e.g., S3 buckets).

## Rules
- Security: Connects to the database using `DATABASE_URL` from `@health-vitals/core/config/env.ts`.
- Resilience: Uses advisory locks (`pg_advisory_xact_lock`) to prevent concurrent execution during deployment.
- Integrity: Verifies SHA-256 checksums of applied migrations against the filesystem to detect silent schema drift or tampering.
