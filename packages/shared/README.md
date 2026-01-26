# @health-data/shared

Shared package for the Health Data App monorepo. Contains database schema, migrations, common types, and utility providers.

## 📁 Contents

- `src/db/`: Database pool initialization and SQL migrations.
- `src/queue/`: RabbitMQ connection and communication logic.
- `src/storage/`: S3 (MinIO) client for report file storage.
- `src/logger/`: Centralized Pino logger configuration.
- `src/types/`: Shared TypeScript interfaces and Zod schemas.

## 🛠️ Usage

This package is used by both `api` and `worker` via workspace references.

## 🗄️ Database Migrations

Run migrations from the root:
```bash
bun run migration:run
```

Create a new migration:
```bash
bun run migration:create <name>
```
