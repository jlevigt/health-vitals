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

- **No direct DB access**: Business logic MUST NOT access the database directly. Use the infrastructure layer abstraction provided in `packages/platform`.
- **Validation First**: Every HTTP endpoint and Worker payload MUST be validated using a Zod schema from `packages/contracts`.
- **No Manual Ops**: Production database migrations and deployments MUST be handled via automated scripts/CI.
- **Environment Parity**: The application MUST fail fast if any environment variable defined in `packages/platform/src/config/env.ts` is missing.

## 3. Dependency Rules

- `contracts` -> No dependencies.
- `platform` -> Depends on `contracts`.
- `apps` -> Dependency injection root. Wires `platform` implementations.

## 4. Deployment Contract

- Applications MUST log to `stdout` for centralized logging.
- Applications MUST be stateless.
- Database migrations MUST be forward-only and executed via the `migrator` app before service rollout.

## 5. Script Execution Model

- Root `package.json` orchestrates workflows (e.g., `dev`, `typecheck`, `test`).
- Scripts resolve their own paths internally using `import.meta.url` rather than relying on `--cwd`.

# 6. Git & GitHub Standards

- **Branching**: We use Trunk-Based Development. Merge to `main` via short-lived feature branches using **Squash and Merge**.
- **Conventional Commits**: All commit messages MUST follow the [Conventional Commits](https://www.conventionalcommits.org/) specification. This is enforced by a Git hook.
- **Atomic PRs**: Each PR SHOULD represent a single logical change and follow the template in `.github/pull_request_template.md`.
- **Issue Scoping**: Every task must be defined in a GitHub Issue using the approved templates, explicitly defining the "Allowed Scope" and "Risk Classification".
- **Git Hooks**: Native git hooks are stored in `.githooks/`. Run `bash scripts/setup-hooks.sh` to configure them.

# AI-Agent Operational Guardrails

## 1. Scoped Execution

- Agents must only modify files within the "Allowed Scope" defined in the corresponding GitHub Issue.
- "Drive-by" refactoring of unrelated files is strictly prohibited.

## 2. Migration Architect Skill

- When proposing or implementing database schema changes, the `migration-architect` skill MUST be used.
- All migrations must be forward-only and non-destructive.

## 3. PR Reviews

- Agents should use the `migration-architect` skill or a PR-review workflow to verify that all operational safety rules are met before finalizing a task.
