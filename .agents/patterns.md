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

## 6. Git Standards

- **Conventional Commits**: All commit messages MUST follow the [Conventional Commits](https://www.conventionalcommits.org/) specification (e.g., `feat:`, `fix:`, `refactor:`, `chore:`).
- **Atomic Commits**: Each commit SHOULD represent a single logical change. Small, focused commits are preferred over large "catch-all" commits.
- **No Large Commits**: Avoid commits that touch more than 10-15 files unless it is a project-wide refactor or a dependency update.
- **Self-Contained**: A commit should include the implementation, related tests, and necessary documentation updates.
- **Grammar**: Use the imperative mood in the subject line (e.g., "add feature" instead of "added feature").
