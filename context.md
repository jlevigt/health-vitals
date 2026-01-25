Below is a **practical, opinionated structure** that scales from local development to production, fits **Bun + workspaces**, and avoids common deployment and secret-management mistakes.

---

## 1. Monorepo baseline (Bun workspaces)

```
repo/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   ├── Dockerfile
│   │   ├── Dockerfile.dev
│   │   ├── bunfig.toml
│   │   └── package.json
│   ├── web/
│   │   ├── src/
│   │   ├── Dockerfile
│   │   ├── Dockerfile.dev
│   │   └── package.json
│   └── worker/
│       ├── src/
│       └── Dockerfile
│
├── packages/
│   ├── shared/
│   │   ├── src/
│   │   └── package.json
│   └── config/
│       └── env.schema.ts
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
├── .env.example
├── .env.local
├── .env.test
├── .env.production
│
├── bun.lockb
├── package.json
└── README.md
```

This separation is intentional:

* **apps/** → runtime artifacts
* **packages/** → shared code/config
* **infra/** → deployment concerns only

No mixing.

---

## 2. `.env` strategy (do not improvise here)

### Rules

1. **Never** commit real secrets.
2. `.env.production` is **never** used locally.
3. Containers receive env via:

   * docker-compose (local/test)
   * CI/CD secrets or platform env vars (prod)

### Recommended files

| File              | Purpose        | Committed |
| ----------------- | -------------- | --------- |
| `.env.example`    | Contract       | ✅         |
| `.env.local`      | Local dev      | ❌         |
| `.env.test`       | CI / test      | ❌         |
| `.env.production` | Reference only | ❌         |

### Loading env in Bun

```ts
// bootstrap/env.ts
import { config } from "dotenv";
config({ path: process.env.ENV_FILE ?? ".env" });
```

Docker sets `ENV_FILE`.

---

## 3. Dockerfiles (strict separation)

### `Dockerfile.dev` (local only)

```Dockerfile
FROM oven/bun:1.1

WORKDIR /app
COPY . .
RUN bun install

CMD ["bun", "run", "dev"]
```

Fast. Dirty. Never used in CI.

---

### `Dockerfile` (production)

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
COPY --from=build /app/dist ./dist

CMD ["bun", "run", "start"]
```

Deterministic and reproducible.

---

## 4. Docker Compose (environment-specific)

### `docker-compose.local.yml`

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

  nginx:
    image: nginx:alpine
    volumes:
      - ./infra/nginx/nginx.local.conf:/etc/nginx/nginx.conf
    ports:
      - "80:80"
```

### `docker-compose.prod.yml`

* No volumes
* No `.env.production` file
* All secrets injected externally

---

## 5. nginx config strategy

```
infra/nginx/
├── nginx.local.conf
├── nginx.prod.conf
└── snippets/
    ├── gzip.conf
    ├── security.conf
    └── proxy.conf
```

### Key rule

**Never** reuse local nginx config in prod.

Local:

* No SSL
* Debug headers
* Simple proxy

Prod:

* Strict headers
* Rate limits
* TLS (usually managed outside Docker)

---

## 6. Bun workspaces & `bun.lockb`

### bun.lockb rules

* **Single lockfile at repo root**
* Always committed
* Never regenerated in CI

### Install policy

```bash
bun install --frozen-lockfile
```

If this fails → your repo is broken. Fix locally.

---

## 7. Builds (what actually gets built)

| Environment | Build happens | How           |
| ----------- | ------------- | ------------- |
| Local       | On demand     | `bun run dev` |
| Test        | Once          | CI job        |
| Prod        | Once          | Docker build  |

**Never build at runtime.**

---

## 8. CI/CD (minimum viable discipline)

1. `bun install --frozen-lockfile`
2. `bun run test`
3. `docker build`
4. Inject secrets at deploy time
5. No `.env` files in prod images

---

## 9. Common mistakes to avoid

* One Dockerfile for all environments ❌
* `.env.production` inside container ❌
* Multiple lockfiles ❌
* Building inside `docker-compose up` ❌
* Sharing nginx config between local and prod ❌

---

## Bottom line

You want:

* **Deterministic builds**
* **Explicit environment boundaries**
* **No magic, no conditionals**

I will be direct and opinionated.

Your current organization is **mostly correct**, but there are **important structural and operational risks** you should address before this grows.

---

## 1. Conceptual separation: what you got right and what is wrong

### ✅ Correct decisions

* SQL migrations as files, not code → good.
* Migration runner as code → correct.
* Same scripts usable locally and in deployment → correct goal.
* No `dotenv` dependency; env injected externally → **very good**.
* Single monorepo with shared logic → correct.

### ⚠️ Problematic decisions

* Treating **operational scripts** as “shared library code”.
* Keeping **runnable scripts under `src/`**.
* Coupling **infra actions (S3, DB)** to application packages.
* Implicit execution context (cwd, env, paths).

These will bite you in CI/CD and production.

---

## 2. Correct mental model (this is the key)

You have **three different things**, and they must not be mixed:

1. **Libraries** → imported by apps
2. **Executables (ops tools)** → run by humans or CI
3. **Runtime apps** → long-running services

Right now, you are mixing **1** and **2**.

---

## 3. Recommended restructuring (minimal but correct)

### Keep your SQL where it is

This part is fine:

```
packages/shared/
└── db/
    └── migrations/
        ├── 001_init.sql
        ├── 002_users.sql
```

SQL is data, not code.

---

### Move scripts out of `src/`

Do **not** put runnable scripts inside `src/`.
`src` is for **importable modules**, not entrypoints.

### Recommended structure

```
packages/
├── shared/
│   ├── src/
│   │   ├── db/
│   │   │   ├── client.ts
│   │   │   └── migrator.ts
│   │   ├── storage/
│   │   │   └── s3.ts
│   │   └── config/
│   │       └── env.ts
│   └── db/
│       └── migrations/
│
├── ops/
│   ├── package.json
│   ├── tsconfig.json
│   ├── scripts/
│   │   ├── migrate.ts
│   │   ├── migrate-create.ts
│   │   └── s3-bootstrap.ts
│   └── README.md
```

### Why this is important

* `packages/ops` is **explicitly operational**
* No confusion about what runs in CI
* No accidental bundling into production images
* Clear security boundaries

---

## 4. How scripts should work (local + deploy)

### Scripts are **thin**

They should:

* Parse arguments
* Validate environment
* Call shared logic

Example (`migrate.ts`):

```ts
import { runMigrations } from "@repo/shared/db/migrator";
import { loadEnv } from "@repo/shared/config/env";

loadEnv();
await runMigrations();
```

### Shared logic stays in `shared`

* DB client
* S3 client
* Migration engine

This separation is non-negotiable if you want sanity later.

---

## 5. Environment variables (you are doing this correctly)

You are right **not** to use dotenv implicitly.

### Best practice

* **Scripts never load env files themselves**
* The runner (Bun / Docker / CI) injects env

Example:

```json
{
  "scripts": {
    "migrate:local": "bun run packages/ops/scripts/migrate.ts --env-file=.env.local",
    "migrate:prod": "bun run packages/ops/scripts/migrate.ts"
  }
}
```

Production:

* CI/CD injects env
* No `--env-file`
* No `.env.production`

---

## 6. Bun specifics you must respect

### 6.1 `bun.lockb`

* **Single lockfile at repo root**
* Always committed
* Never regenerate in CI
* Use:

```bash
bun install --frozen-lockfile
```

If this fails, your repo is broken.

---

### 6.2 Workspaces

Root `package.json`:

```json
{
  "workspaces": ["apps/*", "packages/*"]
}
```

Each package:

* Has its own `package.json`
* **No lockfile**
* No `node_modules` committed

---

### 6.3 Scripts execution

Bun resolves workspace binaries correctly.

This is valid:

```bash
bun run migrate
```

As long as:

* Script is defined in root
* Entry file is explicit

---

## 7. TypeScript configuration (very important)

### Root `tsconfig.base.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "baseUrl": ".",
    "paths": {
      "@repo/shared/*": ["packages/shared/src/*"]
    }
  }
}
```

### Each package

```json
{
  "extends": "../../tsconfig.base.json"
}
```

### Why this matters

* Consistent imports
* No relative path hell
* Bun + TS aligned

---

## 8. Builds and deployments (critical rule)

### Rule

**Operational scripts are never built into production images.**

Options:

1. Run them **before** deploy (recommended)
2. Separate “ops image” (acceptable)
3. Never run migrations inside app startup

Correct flow:

```
CI
 ├─ migrate
 ├─ s3-bootstrap (idempotent)
 └─ deploy app
```

---

## 9. S3 bucket creation: special warning

S3 bucket creation is:

* Global
* Slow
* Eventually consistent
* Often permission-restricted

### Best practice

* Script must be **idempotent**
* Fail if bucket exists with wrong config
* Never run on every deploy blindly

This belongs **only** in ops scripts, not app code.

---

## 10. Verdict on your current organization

| Area                 | Verdict     |
| -------------------- | ----------- |
| Scripts under `src/` | ❌ Change    |
| Shared logic         | ✅ Keep      |
| SQL in repo          | ✅ Correct   |
| No dotenv            | ✅ Excellent |
| Single lockfile      | ✅ Required  |
| Ops mixed with app   | ❌ Fix       |

---

## Final guidance

You are **very close to professional-grade structure**.

The missing step is **recognizing ops scripts as first-class executables**, not shared code.

Yes. You **should** centralize environment access. Not doing so is a structural defect, not a stylistic choice.

However, there are **strict rules** for doing it correctly.

---

## 1. Why `process.env` spread is a problem

If you allow direct access everywhere:

* No guarantee a variable exists
* No guarantee of type
* Silent misconfiguration in production
* Impossible to audit required env for a service or script
* Fragile refactors

This is acceptable only in prototypes.

---

## 2. Correct pattern: single env module

You want **one read point**, **many read-only consumers**.

### Location (important)

This belongs in **shared**, not apps:

```
packages/shared/src/config/env.ts
```

This makes it usable by:

* API
* Workers
* Ops scripts
* Tests

---

## 3. What `env.ts` must and must NOT do

### It MUST

* Read from `process.env`
* Validate eagerly
* Export a frozen object
* Fail fast on startup

### It MUST NOT

* Load `.env` files
* Contain side effects beyond validation
* Be environment-specific
* Swallow errors

---

## 4. Minimal but correct implementation (no dependencies)

```ts
// packages/shared/src/config/env.ts

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function optional(name: string, fallback?: string): string | undefined {
  return process.env[name] ?? fallback;
}

export const env = Object.freeze({
  NODE_ENV: optional("NODE_ENV", "development") as
    | "development"
    | "test"
    | "production",

  DATABASE_URL: required("DATABASE_URL"),

  AWS_REGION: required("AWS_REGION"),
  S3_BUCKET_NAME: required("S3_BUCKET_NAME"),

  PORT: Number(optional("PORT", "3000")),
});
```

### Key properties

* Validation happens **once**
* Crash is immediate
* No runtime branching everywhere

---

## 5. How to use it everywhere

### Application code

```ts
import { env } from "@repo/shared/config/env";

db.connect(env.DATABASE_URL);
```

### Ops scripts

```ts
import { env } from "@repo/shared/config/env";

await createBucket(env.S3_BUCKET_NAME);
```

No script touches `process.env` directly.

---

## 6. Environment injection (you are already correct)

Your approach remains:

* Local:

  ```bash
  bun run migrate --env-file=.env.local
  ```

* CI / Production:

  * Env injected by runner
  * No `.env` files
  * `env.ts` simply reads

This is the clean separation.

---

## 7. Advanced hardening (recommended)

### 7.1 Freeze early

You already did. This prevents mutation bugs.

### 7.2 Validate formats

Example:

```ts
if (!env.DATABASE_URL.startsWith("postgres://")) {
  throw new Error("DATABASE_URL must be postgres");
}
```

### 7.3 Environment scoping

Optional but useful:

```ts
if (env.NODE_ENV === "production" && env.PORT < 1024) {
  throw new Error("Invalid PORT for production");
}
```

---

## 8. Why no schema library?

You *can* use one later, but for now:

* Fewer dependencies in ops scripts
* Faster cold start
* Easier debugging in CI
* Zero magic

For most teams, this manual approach is sufficient.

---

## 9. One important warning

Do **not** create multiple env modules:

* No `env.api.ts`
* No `env.worker.ts`

If a variable is unused somewhere, it is fine.
If it is required somewhere, it must be declared centrally.

This is how you prevent config drift.

---

## Final answer

Yes, centralize env access in `config/env.ts`.

But:

* It validates
* It fails fast
* It does not load files
* It is shared
* It is immutable

Anything less is not a best practice.

