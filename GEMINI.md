# Health Vitals - Gemini Context

This file serves as the primary instructional context for Gemini CLI interactions in the `health-vitals` workspace. It defines the project's architecture, development standards, and operational workflows.

## 🚀 Project Overview

**Health Vitals** is a comprehensive monorepo designed for managing health metrics and extracting structured clinical data from PDF lab reports using AI.

- **Architecture:** Monorepo with Bun Workspaces.
- **Backend:** Express 5 (ESM), PostgreSQL (via `pg`), RabbitMQ (message broker).
- **Frontend:** React 19, Vite 7, Tailwind CSS 4, Recharts.
- **Worker:** Background processing for AI (Gemini) extraction and PDF parsing.
- **Infrastructure:** Managed via Docker Compose (Postgres, RabbitMQ, MinIO).
- **Core Runtime:** Bun is the primary runtime for scripts, testing, and execution.

## 📂 Repository Structure

```text
/
├── apps/
│   ├── api/            # Express REST API (Port 3000)
│   ├── web/            # React/Vite Frontend (Port 5173)
│   └── worker/         # Background job processor (AI extraction)
├── packages/
│   ├── shared/         # Core logic: DB, Config, Logger, Types, LLM
│   └── ops/            # Operational scripts: Migrations, S3 Bootstrap
├── infra/              # Docker Compose and environment configuration
└── GEMINI.md           # This file (Instructional context)
```

## 🛠️ Operational Workflows

All key commands are orchestrated from the root `package.json` using Bun.

| Task | Command |
|---|---|
| **Setup** | `bun install` |
| **Infrastructure** | `bun run infra:up` (Start Docker stack) |
| **Migrations** | `bun run migration:run` (Apply SQL migrations) |
| **API Dev** | `bun run dev:api` (Start backend) |
| **Web Dev** | `bun run dev:web` (Start frontend) |
| **Worker Dev** | `bun run dev:worker` (Start worker) |
| **Mock Web** | `bun run dev:mock` (Start frontend with MSW) |

## 🏗️ Architectural Patterns & Standards

Follow these established patterns when modifying or extending the codebase:

### 1. Feature-Oriented API
The API is organized by business features in `apps/api/src/features/`.
- Each feature has its own `routes.ts`, `controller.ts`, `service.ts`, and `types.ts`.
- Avoid cross-feature contamination; keep logic local to the feature folder.

### 2. Service Layer & Manual DI
- Encapsulate business logic in class-based services.
- Dependencies (DB, Logger, etc.) must be passed via the constructor (**Manual Dependency Injection**).
- Services typically expose a single `execute` method.

### 3. Shared Infrastructure
- All external dependencies (DB, S3, Queue, Mail, LLM) are abstracted in `packages/shared`.
- Use the interfaces defined in `packages/shared/src/` instead of direct implementations when writing business logic.

### 4. Data Validation (Zod)
- Validate all entry points (API requests, Worker job payloads) using Zod schemas.
- Schemas and their inferred types should be colocated in the feature's `types.ts` or in `packages/shared/src/types`.

### 5. Error Handling
- Use the custom `AppError` hierarchy (e.g., `NotFoundError`, `UnauthorizedError`).
- Never swallow errors; allow the global `errorMiddleware` in the API or the worker's catch block to handle logging and response formatting.

### 6. Environment Management
- All environment variables are validated in `packages/shared/src/config/env.ts`.
- **Never** use `process.env` directly in application code; import the `env` object from `@repo/shared/config/env`.

### 7. Testing Strategy
- Tests are colocated in `__tests__` directories next to the implementation.
- Use `bun test` for running the suite.
- Frontend uses Mock Service Worker (MSW) for API interception.

## 📝 General Rules
- **ESM Only:** All files use ESM syntax. Use `.ts` or `.tsx` extensions.
- **Absolute Imports:** Use the `@/` alias for the `src` directory within each package.
- **Bun First:** Use `bun` for all package management and script execution.
- **Clean Architecture:** Keep business logic (Services) separate from transport logic (Controllers/Routes).
