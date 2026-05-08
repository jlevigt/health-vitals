# Migrator Application

## Purpose
Run-once containerized application to execute database schema migrations and initialize infrastructure (e.g., S3 buckets).

## Rules
- **Operational Safety**: Uses advisory locks to prevent concurrent execution during deployment.
- **Integrity**: Verifies SHA-256 checksums of applied migrations to detect silent schema drift.
