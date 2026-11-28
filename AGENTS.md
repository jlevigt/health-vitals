# Health Vitals

Health metrics management and AI-powered PDF lab report extraction platform.

## Architecture & Tech Stack

- **Monorepo & Runtime:** Bun Workspaces (`apps/*`, `apps/jobs/*`, `packages/*`), TypeScript 6 (`tsc`), ESM (`"type": "module"`), Biome v2.
- **Applications:**
  - `apps/api`: Express 5 REST API (Argon2, JWT + session refresh tokens, Pino, Supertest).
  - `apps/web`: React 19, Vite 8, Tailwind CSS 4, Recharts, i18next, MSW.
  - `apps/worker`: RabbitMQ job consumer (`pdf-parse`, LLM structured extraction).
  - `apps/jobs/migrator`: Run-once database migration & S3 bucket/CORS initializer.
- **Packages:**
  - `packages/contracts`: Pure TypeScript types, enums, and Zod v4 schemas.
  - `packages/platform`: Infrastructure adapters (PostgreSQL, RabbitMQ, S3, Pino, Mail [Resend/Nodemailer/Mock], LLM [Google Gemini/Ollama/Mock]), `AppError` hierarchy, and `env.ts`.
  - `packages/emails`: Branded React Email v6 transactional templates.
- **Infrastructure:** Local Docker Compose (`compose.yml`: Traefik, Postgres 17, RabbitMQ, MinIO). Production Split Managed Stack: Vercel (`apps/web`), Neon (PostgreSQL + Object Storage configured in `neon.ts`), CloudAMQP (RabbitMQ), Fly.io (`apps/api`, `apps/worker`), Cloudflare (DNS), Resend (email).

See `docs/README.md` and `docs/architecture/` for full C4 system topology, infrastructure inventory, API docs, and testing details.

## Core Commands

Run from repository root unless noted:

- `bun run lint` / `bun run lint:fix` — Biome lint & format check/fix.
- `bun run infra:check` — Validate production infrastructure manifest & env parity.
- `bun run typecheck` — TypeScript build (`tsc`) across all workspaces.
- `bun run test` — Run unit and integration tests (requires local Postgres/RabbitMQ for integration suites).
- `bun run test:e2e` — Run E2E system test (`RUN_E2E=true`).
- `bun run infra:up` / `bun run infra:down` — Start/stop local Docker Compose stack.
- `bun run migration:create <name>` — Generate timestamped SQL migration in `database/migrations/`.
- `bun run migration:run` — Run pending migrations and initialize storage via `apps/jobs/migrator`.
- Per-app dev: `bun --filter @health-vitals/api dev`, `bun --filter @health-vitals/worker dev`, `bun --filter @health-vitals/web dev` (or `dev:mock` for offline MSW mode), `bun --filter @health-vitals/emails email:dev`.

## Non-Negotiable Quality Gates & Invariants

1. **Strict TypeScript:** All packages must compile with `bun run typecheck` without errors. Never use `any` in new code; use generics or explicit types.
2. **Error Handling:** Never swallow errors silently. Throw subclasses of `AppError` (`NotFoundError`, `ValidationError`, `UnauthorizedError`, `ForbiddenError`, `ConflictError`) from `@health-vitals/platform` and let outer Express error middleware or worker handlers process them.
3. **Validation First:** Every HTTP request payload/query and RabbitMQ job payload must be validated with a Zod schema from `@health-vitals/contracts`.
4. **Monorepo & Dependency Boundaries:**
   - `packages/contracts` has no internal workspace dependencies and must remain purely declarative (no business logic or runtime I/O).
   - `packages/platform` depends only on `@health-vitals/contracts`.
   - `apps/*` are dependency-injection roots and must **never** import from each other.
   - Consume cross-workspace modules only through declared public package exports (`package.json` `exports` / `src/index.ts`).
5. **No Direct DB Pools in Business Logic:** Feature services and job handlers must use injected `@health-vitals/platform` abstractions (`Database`, `Queue`, `StorageClient`, `MailProvider`, `LLMProvider`, `Logger`).
6. **Fail-Fast Environment Parity:** Validate `process.env` exclusively in `packages/platform/src/config/env.ts`. Never read raw `process.env` in feature logic.
7. **Deployment Contract:** Applications must remain stateless and emit structured JSON logs (Pino) to `stdout`. Database schema changes must be forward-only and executed via `apps/jobs/migrator` before rollout.
8. **Testing:** Every fix or feature must include tests asserting both happy paths and edge cases.

## Package-Specific Conventions

- **`apps/api`:** Group code by business feature in `src/features/<feature>/` (`routes.ts`, `controller.ts`, `service.ts`). Wire infrastructure clients centrally in `src/container.ts`. Keep Zod-generated OpenAPI routes in `apps/api/src/docs/openapi.ts` aligned with implemented endpoints (`/openapi.json` and `/docs`).
- **`apps/worker`:** Jobs must be idempotent under RabbitMQ redelivery. Lock the target `files` row with `SELECT ... FOR UPDATE`, skip non-`QUEUED` rows, and atomically transition to `PROCESSING` before external I/O. Record LLM usage and latency metrics in `llm_requests`.
- **`apps/web`:** Use the native `fetch` wrapper in `src/api/client.ts` (do not add `axios`). Style with Tailwind CSS and Lucide React icons. Import shared DTO types from `@health-vitals/contracts`, keep `src/locales/` i18n keys synchronized, and maintain MSW mocks in `src/mocks/`.
- **`apps/jobs/migrator`:** Runs all pending `.sql` files inside a single transaction protected by `pg_advisory_xact_lock` and verifies SHA-256 checksums of already-applied files. Never modify an already-applied migration.
- **`packages/emails`:** Build templates with React Email in `src/emails/`, maintain exported signatures in `src/public.d.ts`, and keep `src/render.test.ts` passing.

## Git, PR & Agent Guardrails

- **Trunk-Based Development:** Use short-lived feature branches merged to `main` via **Squash and Merge**.
- **Conventional Commits:** Enforced by `.githooks/commit-msg` (run `bash scripts/setup-hooks.sh` if hooks are not active).
- **Scoped Execution:** Only modify files within the requested task or GitHub Issue "Allowed Scope" (`.github/ISSUE_TEMPLATE/task.yml`). Avoid drive-by refactoring of unrelated files.
- **Never commit or print secrets:** `.env*` and `.neon` files are gitignored and must never be leaked or committed.
- **Skills (`.agents/skills/`):**
  - Use `migration-architect` for any database schema or migration work.
  - Use `pr-review` before finalizing pull requests or reviewing operational safety.
  - Use `neon-postgres` and `neon-object-storage` when working on Neon database branching, query optimization, or Neon bucket storage.
