# Infrastructure & Database

This directory contains the database schema, migrations, and operational scripts for the Health Data App.

## 🗄️ Database Migrations

Migrations are stored as raw SQL files in `infra/migrations/`.

- **Format:** `[TIMESTAMP]_[NAME].sql`
- **Execution:** Managed by a custom script that uses Advisory Locks to prevent concurrent modifications.

### Commands (Run from Project Root)

| Command | Description |
|---|---|
| `bun run migration:create <name>` | Generate a new timestamped migration file |
| `bun run migration:run` | Apply all pending migrations |

## 🛠️ Scripts

Located in `infra/scripts/`:
- `migrate.js`: The core migration engine.
- `migration-create.js`: Helper to scaffold new migration files.

## 🐳 Docker Services

The root `docker-compose.yml` defines the following services:
1. **PostgreSQL 18:** The primary relational database.
2. **RabbitMQ:** Message broker for asynchronous background jobs.
3. **MinIO:** S3-compatible blob storage for PDF reports.

To start all services:
```bash
bun run infra:up
```
