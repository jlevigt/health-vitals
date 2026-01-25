Below is a **concise summary** followed by a **checklist you can act on immediately**. It is intentionally strict.

---

## Executive Summary

Your direction is correct, but you must **separate concerns more sharply**:

* **Shared code ≠ runnable scripts**
* **Ops tooling ≠ application runtime**
* **Root orchestrates; packages execute**
* **Environment is injected, validated once, and immutable**
* **Scripts must be location-independent**
* **Bun workspaces rely on a single lockfile and deterministic installs**

Most changes are **structural**, not conceptual.

---

## Canonical Patterns to Follow

### Architecture

* Monorepo with Bun workspaces
* One lockfile at repo root
* Clear separation:

  * Apps
  * Shared libraries
  * Ops executables
  * Infra configs

### Environment

* No implicit `.env` loading
* Env injected by runner (`--env-file` locally, secrets in CI)
* Single `config/env.ts`
* No `process.env` access outside `env.ts`

### Scripts

* Root `package.json` orchestrates workflows
* Package `package.json` scripts are local and isolated
* No `--cwd`
* Scripts resolve their own paths internally

### Ops

* Migrations and infra bootstrapping are **explicit ops**
* Run before deployment
* Never bundled into app runtime
* Must be idempotent

---

## What You Should Change (Action Items)

### 1. Restructure folders

* [ ] Move runnable scripts **out of `packages/shared/src`**
* [ ] Create `packages/ops/` for migrations and S3 scripts
* [ ] Keep SQL migrations as data (not code) in shared

---

### 2. Centralize environment handling

* [ ] Create `packages/shared/src/config/env.ts`
* [ ] Validate required variables eagerly
* [ ] Export a frozen `env` object
* [ ] Remove direct `process.env` usage elsewhere

---

### 3. Fix script execution model

* [ ] Remove all usage of `--cwd`
* [ ] Ensure scripts compute paths via `import.meta.url`
* [ ] Make scripts location-independent

---

### 4. Normalize `package.json` responsibilities

#### Root `package.json`

* [ ] Dev/build/test orchestration
* [ ] Migrations and infra commands
* [ ] CI entrypoints
* [ ] Environment selection (local only)

#### App `package.json`

* [ ] `dev`, `build`, `start`, `test`, `typecheck`
* [ ] No ops or cross-package scripts

#### Ops `package.json` (optional but recommended)

* [ ] Direct script entrypoints
* [ ] No orchestration logic

---

### 5. Bun + workspace hygiene

* [ ] Single `bun.lockb` at repo root
* [ ] Always committed
* [ ] Use `bun install --frozen-lockfile` in CI
* [ ] No per-package lockfiles

---

### 6. TypeScript configuration

* [ ] Root `tsconfig.base.json`
* [ ] Shared path aliases (`@repo/shared/*`)
* [ ] Packages extend base config
* [ ] `noEmit: true` (Bun runs TS directly)

---

### 7. Deployment discipline

* [ ] Migrations run **before** deploy
* [ ] S3 bootstrap is idempotent
* [ ] No migrations on app startup
* [ ] No `.env.production` inside images

---

## Quick Self-Audit (Yes / No)

* Do I know exactly which scripts run in production?
* Can I delete `node_modules` and rebuild deterministically?
* Can ops scripts run from any directory?
* Can I list all required env vars in one file?
* Is there a clean boundary between runtime and infra?

If any answer is “no”, fix that first.

---

## Bottom Line

You are not missing tooling.
You are refining **boundaries and discipline**.

Apply this checklist and your setup will be:

* Predictable
* Auditable
* CI-safe
* Production-grade

---

Below is a **reference-grade answer** you can treat as a baseline. It is intentionally strict and production-oriented.

---

# 1. Reference Repository Layout (Bun + Workspaces)

This layout separates **runtime**, **libraries**, **operations**, and **infrastructure** unambiguously.

```
repo/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   ├── tsconfig.json
│   │   ├── package.json
│   │   ├── Dockerfile
│   │   └── Dockerfile.dev
│   │
│   ├── worker/
│   │   ├── src/
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   └── web/
│       ├── src/
│       ├── package.json
│       └── Dockerfile
│
├── packages/
│   ├── shared/
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   └── env.ts
│   │   │   ├── db/
│   │   │   │   ├── client.ts
│   │   │   │   ├── migrator.ts
│   │   │   │   └── types.ts
│   │   │   └── storage/
│   │   │       └── s3.ts
│   │   └── db/
│   │       └── migrations/
│   │           ├── 001_init.sql
│   │           └── 002_users.sql
│   │
│   └── ops/
│       ├── scripts/
│       │   ├── migrate.ts
│       │   ├── migrate-create.ts
│       │   └── s3-bootstrap.ts
│       ├── tsconfig.json
│       └── package.json
│
├── infra/
│   ├── docker/
│   │   ├── docker-compose.local.yml
│   │   ├── docker-compose.test.yml
│   │   └── docker-compose.prod.yml
│   │
│   └── nginx/
│       ├── nginx.local.conf
│       ├── nginx.prod.conf
│       └── snippets/
│
├── tsconfig.base.json
├── bun.lockb
├── package.json
├── .env.example
└── README.md
```

### Invariants

* `src/` = importable code only
* `packages/ops` = executable entrypoints
* SQL migrations are data, not TS
* Infra is never imported by apps

---

# 2. Hardened Migration Runner Specification

This is **non-negotiable** if you want safety.

## 2.1 Migration table (required)

```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
  id TEXT PRIMARY KEY,
  checksum TEXT NOT NULL,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 2.2 Migration file rules

* Immutable after commit
* Sequential, sortable IDs (`001_`, timestamp also acceptable)
* One direction only (no down migrations unless you know why)

Example filename:

```
20240120_120001_create_users.sql
```

---

## 2.3 Runner responsibilities

The migration runner **must**:

1. Discover migrations from a fixed directory
2. Sort deterministically
3. Validate file checksum
4. Run inside a transaction (when DB supports it)
5. Lock execution
6. Fail fast on divergence

---

## 2.4 Locking (critical)

Postgres example:

```sql
SELECT pg_advisory_lock(123456789);
```

* One lock per database
* Prevents concurrent deploys corrupting schema

---

## 2.5 Execution algorithm

Pseudocode:

```
connect DB
acquire lock

load applied migrations
load filesystem migrations

for each migration:
  if not applied:
    begin transaction
      execute SQL
      insert record (id, checksum)
    commit

release lock
```

---

## 2.6 Divergence detection (mandatory)

If:

* A migration exists in DB but file checksum differs → **abort**
* DB has a migration that no longer exists in repo → **abort**

Silent drift is unacceptable.

---

## 2.7 CLI behavior

| Command               | Behavior                 |
| --------------------- | ------------------------ |
| `migrate`             | Apply pending migrations |
| `migrate --dry-run`   | Show plan                |
| `migrate --status`    | Print applied vs pending |
| `migrate:create name` | Create new SQL file      |

---

## 2.8 What NOT to do

* ❌ Run migrations on app startup
* ❌ Auto-create DB
* ❌ Ignore partial failures
* ❌ Swallow SQL errors

---

# 3. Dockerfiles (Reference Grade)

## 3.1 Development Dockerfile

```Dockerfile
FROM oven/bun:1.1

WORKDIR /app
COPY . .
RUN bun install

CMD ["bun", "run", "dev"]
```

* Fast
* Volume-mounted
* Never used in CI

---

## 3.2 Production Dockerfile (API example)

```Dockerfile
FROM oven/bun:1.1 AS build

WORKDIR /app
COPY package.json bun.lockb ./
COPY apps ./apps
COPY packages ./packages

RUN bun install --frozen-lockfile
RUN bun run build

FROM oven/bun:1.1-slim
WORKDIR /app

COPY --from=build /app/apps/api/dist ./dist

ENV NODE_ENV=production
CMD ["bun", "run", "start"]
```

### Rules

* Deterministic build
* No `.env` files
* No ops scripts included

---

# 4. Docker Compose (Environment-Specific)

## 4.1 Local

```yaml
services:
  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile.dev
    env_file: .env.local
    volumes:
      - .:/app
    ports:
      - "3000:3000"

  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: postgres
```

---

## 4.2 Production

```yaml
services:
  api:
    image: your-registry/api:latest
    environment:
      NODE_ENV: production
    depends_on:
      - db
```

### Production rules

* No volumes
* No `.env.production`
* Secrets injected by platform

---

# 5. Operational Flow (Canonical)

```
CI
 ├─ bun install --frozen-lockfile
 ├─ bun run migrate
 ├─ bun run s3:bootstrap (idempotent)
 ├─ docker build
 └─ deploy
```

---

# Final Assessment

If you follow **exactly** this structure:

* Your migrations will be safe
* Your deployments will be deterministic
* Your repo will scale cleanly
* Your infra will remain auditable

This is the same mental model used in mature backend teams.


