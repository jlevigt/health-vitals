# Health Vitals

## 🚀 Project Overview

**Health Vitals** is a comprehensive monorepo for managing health metrics and extracting structured clinical data from PDF lab reports using AI.

- **Architecture:** Monorepo with Bun Workspaces + Layered Packages.
- **Backend:** Express 5 (ESM), PostgreSQL, RabbitMQ.
- **Frontend:** React 19, Vite 7, Tailwind CSS 4.
- **Infrastructure:** Docker Compose (Local), Docker Swarm (Prod).
- **Core Runtime:** Bun is the primary runtime.

# Project-Specific Quality Gates

## 1. Strict TypeScript

- All packages must build with `tsc` without errors.
- `any` is strictly prohibited in new code; use generics or proper types.

## 2. Error Handling

- Never swallow errors silently.
- Always use the custom `AppError` hierarchy (`NotFoundError`, `ValidationError`, etc.)
- Pass errors down to the outermost catch block (Express error middleware or Worker global handler).

## 3. Monorepo Discipline

- Apps must NEVER import from each other.
- Shared utilities and domains must be placed in `packages/*`.
- Only explicitly defined public exports from `src/index.ts` can be consumed across workspace boundaries.

## 4. Testing

- Fixes MUST include tests.
- Tests should assert edge cases and not just the happy path.

# Approved Patterns Catalog

## 1. Idempotency (Worker)

All worker jobs MUST be idempotent.

- Use a `processed_jobs` table or check if the result already exists in the database before processing.
- RabbitMQ jobs may be delivered more than once; the system must handle this gracefully.

## 2. Hard Rules (System-wide)

- **No direct DB access**: Business logic MUST NOT access the database directly. Use the infrastructure layer abstraction provided in `packages/infra`.
- **Validation First**: Every HTTP endpoint and Worker payload MUST be validated using a Zod schema from `packages/contracts`.
- **No Manual Ops**: Production database migrations and deployments MUST be handled via automated scripts/CI.
- **Environment Parity**: The application MUST fail fast if any environment variable defined in `packages/core/config/env.ts` is missing.

## 3. Dependency Rules

- `contracts` -> No dependencies.
- `core` -> Depends on `contracts`.
- `infra` -> Depends on `core` and `contracts`.
- `apps` -> Dependency injection root. Wires `infra` implementations into `core` interfaces.

## 4. Deployment Contract

- Applications MUST log to `stdout` for centralized logging.
- Applications MUST be stateless.
- Database migrations MUST be forward-only and executed via the `migrator` app before service rollout.

## 5. Script Execution Model

- Root `package.json` orchestrates workflows (e.g., `dev`, `typecheck`, `test`).
- Scripts resolve their own paths internally using `import.meta.url` rather than relying on `--cwd`.

## Git Standards

Conventional Commits specification (e.g., `feat:`, `fix:`, `refactor:`, `chore:`).
Atomic Commits:
Each commit SHOULD represent a single logical change.
Small, focused commits are preferred over large "catch-all" commits.
Grammar: Use the imperative mood in the subject line (e.g., "add feature" instead of "added feature").
