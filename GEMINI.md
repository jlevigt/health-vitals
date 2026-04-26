# Health Vitals - Gemini Context

This file serves as the primary instructional context for Gemini CLI interactions in the `health-vitals` workspace. It defines the project's architecture, development standards, and operational workflows.

## 🚀 Project Overview

**Health Vitals** is a comprehensive monorepo for managing health metrics and extracting structured clinical data from PDF lab reports using AI.

- **Architecture:** Monorepo with Bun Workspaces + Layered Packages.
- **Backend:** Express 5 (ESM), PostgreSQL, RabbitMQ.
- **Frontend:** React 19, Vite 7, Tailwind CSS 4.
- **Infrastructure:** Docker Compose (Local), Docker Swarm (Prod).
- **Core Runtime:** Bun is the primary runtime.

## 📂 Repository Structure

```text
/
├── apps/
│   ├── api/            # Express REST API (Port 3000)
│   ├── web/            # React/Vite Frontend (Port 80/5173)
│   ├── worker/         # Background job processor (RabbitMQ consumer)
│   └── migrator/       # Database migration runner (Run-once)
├── packages/
│   ├── contracts/      # Pure types & Zod schemas (@health-vitals/contracts)
│   ├── core/           # Interfaces & domain logic (@health-vitals/core)
│   └── infra/          # Infrastructure implementations (@health-vitals/infra)
├── database/           # SQL Migrations
├── scripts/            # Local developer scripts (Bash)
├── infra/              # Docker Swarm & deployment configs
└── GEMINI.md           # This file (Instructional context)
```

## 🛠️ Operational Workflows

| Task | Command |
|---|---|
| **Full Dev Setup** | `bun run dev` (Starts infra, runs migrations, boots all apps) |
| **Infrastructure** | `bun run infra:up` (Start Docker infrastructure) |
| **Migrations** | `bun run migration:run` (Apply SQL migrations) |
| **Testing** | `bun run test` (Run suite across all packages) |
| **Typecheck** | `bun run typecheck` (Verify TS integrity) |

## 🏗️ Architectural Patterns & Standards

### 1. Strict Layering
Follow the dependency rule: `contracts` ← `core` ← `infra` ← `apps`.
- **Contracts**: Zero-dependency types and schemas.
- **Core**: Domain interfaces and logic. No implementation details (no SDKs).
- **Infra**: Concrete implementations (PG, RabbitMQ, S3).
- **Apps**: Composition root. Performs Manual Dependency Injection.

### 2. Manual Dependency Injection
- Encapsulate business logic in services that accept interfaces (from `core`) in their constructor.
- Instantiate and wire these in the app's `container.ts`.

### 3. Idempotency & Resiliency
- Worker jobs MUST be idempotent. Check for existing results before processing.
- Services should handle transient failures gracefully.

### 4. Data Validation (Zod)
- Validate ALL entry points (API requests, Worker payloads) using schemas from `@health-vitals/contracts`.

### 5. Environment Safety
- NEVER use `process.env` directly in business logic.
- Import `env` from `@health-vitals/core/config`.

## 📝 General Rules
- **ESM Only:** All files use ESM syntax.
- **Absolute Imports:** Use `@/` for local `src` directory.
- **Bun First:** Use `bun` for package management and script execution.
- **Clean Architecture:** Keep business logic independent of transport and infrastructure.
