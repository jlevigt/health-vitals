# Health Vitals - Gemini Context

This file serves as the primary instructional context for Gemini CLI interactions in the `health-vitals` workspace. It defines the project's architecture, development standards, and operational workflows.

@AGENTS.md
@.agents/quality.md
@.agents/patterns.md

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

| Task               | Command                                                       |
| ------------------ | ------------------------------------------------------------- |
| **Full Dev Setup** | `bun run dev` (Starts infra, runs migrations, boots all apps) |
| **Infrastructure** | `bun run infra:up` (Start Docker infrastructure)              |
| **Migrations**     | `bun run migration:run` (Apply SQL migrations)                |
| **Testing**        | `bun run test` (Run suite across all packages)                |
| **Typecheck**      | `bun run typecheck` (Verify TS integrity)                     |
