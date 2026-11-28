# Health Vitals

Comprehensive health metrics management and AI-powered lab report extraction.

## 📂 Repository Structure

```text
/
├── apps/
│   ├── api/            # Express 5 REST API (@health-vitals/api)
│   ├── web/            # React 19 / Vite 8 Frontend (@health-vitals/web)
│   ├── worker/         # Background processing worker (@health-vitals/worker)
│   └── jobs/
│       └── migrator/   # Forward-only DB & S3 migrator (@health-vitals/migrator)
├── packages/
│   ├── contracts/      # Pure types & Zod schemas (@health-vitals/contracts)
│   ├── emails/         # Branded React Email templates (@health-vitals/emails)
│   └── platform/       # Unified platform layer (@health-vitals/platform)
├── tests/
│   └── e2e/            # End-to-end system tests
├── database/           # SQL Migrations
├── docs/               # System architecture (C4) & API documentation
├── infra/              # Production deployment configs (Fly.io, DNS, env contract)
├── compose.yml         # Root Docker Compose for local stack
├── neon.ts             # Neon Postgres & Object Storage config
└── README.md
```

## 🛠️ Tech Stack

- **Runtime:** [Bun](https://bun.sh/)
- **Backend:** Express 5, TypeScript 6, PostgreSQL, Pino Logger
- **Frontend:** React 19, Vite 8, Recharts, Tailwind CSS 4, i18next
- **Emails:** React Email v6, Resend
- **AI:** Google Gemini (Generative AI) / Ollama
- **Local Infra:** Docker Compose, Traefik, PostgreSQL, RabbitMQ, MinIO
- **Production Infra:** Vercel (`web`), Neon (PostgreSQL + Object Storage), CloudAMQP (RabbitMQ), Fly.io (`api` + `worker`), Cloudflare (DNS)

## ⚙️ Quick Start

### 1. Prerequisites

Ensure you have [Bun](https://bun.sh/) and [Docker](https://www.docker.com/) installed.

### 2. Installation

```bash
bun install
bash scripts/setup-hooks.sh
```

### 3. Local Development

Start local infrastructure, run migrations, and launch the services you need:

```bash
bun run infra:up
bun run migration:run

# Run apps in separate terminals:
bun --filter @health-vitals/api dev
bun --filter @health-vitals/worker dev
bun --filter @health-vitals/web dev
```

For offline frontend development using Mock Service Worker (MSW):

```bash
bun --filter @health-vitals/web dev:mock
```

### 4. Running the Full Stack in Docker (Production-like)

```bash
docker compose up --build
```

## 🧪 Testing & Quality Checks

We follow a **Test Pyramid** approach using `bun test`:

- **Unit Tests:** Co-located next to source files (`*.test.ts` / `*.unit.test.ts`).
- **Integration Tests:** Located in `apps/*/tests/integration/` (Supertest + real PostgreSQL & RabbitMQ).
- **E2E Tests:** Located in `tests/e2e/system.e2e.test.ts` (native Bun `fetch` against a running stack).

Run checks from root:

```bash
bun run lint
bun run infra:check
bun run typecheck
bun run test
bun run test:e2e   # requires running stack
```

## 📖 Documentation

- [Documentation Hub](./docs/README.md)
- [System Architecture & C4 Diagrams](./docs/architecture/README.md)
- [HTTP API Docs (`/docs` & `/openapi.json`)](./docs/api/README.md)
- [Infrastructure Inventory](./docs/architecture/infrastructure.md) & [Production Deployment Guide](./infra/README.md)
- [Dependencies & Testing Strategy](./docs/architecture/dependencies-and-testing.md)
- [Backend API Guide](./apps/api/README.md) | [Frontend Guide](./apps/web/README.md) | [Worker Guide](./apps/worker/README.md)
