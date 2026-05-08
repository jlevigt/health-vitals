# Health Vitals

Comprehensive health metrics management and AI-powered lab report extraction.

## 📂 Repository Structure

```text
/
├── apps/
│   ├── api/            # Node.js/Express Backend (@health-vitals/api)
│   ├── web/            # React/Vite Frontend (@health-vitals/web)
│   └── worker/         # Background processing worker (@health-vitals/worker)
├── packages/
│   ├── contracts/      # Pure types & Zod schemas (@health-vitals/contracts)
│   ├── platform/       # Unified platform layer (@health-vitals/platform)
├── tests/
│   └── e2e/            # End-to-end system tests
├── database/           # SQL Migrations
├── compose.yml         # Root Docker Compose for full stack
├── .env                # Project configuration
└── README.md
```

## 🛠️ Tech Stack

- **Runtime:** [Bun](https://bun.sh/)
- **Backend:** Express 5, TypeScript, PostgreSQL, Pino Logger
- **Frontend:** React 19, Vite 7, Recharts, Tailwind CSS 4
- **AI:** Google Gemini (Generative AI)
- **Infra:** Docker Compose, RabbitMQ (Broker), MinIO (Storage)
- **Patterns:** ESM (Type Module), Absolute Imports (`@/*`), Clean Architecture

## ⚙️ Quick Start

### 1. Prerequisites

Ensure you have [Bun](https://bun.sh/) and [Docker](https://www.docker.com/) installed.

### 2. Installation

```bash
bun install
```

### 3. Running the Full Stack (Recommended for Dev)

This starts the infrastructure, runs migrations, and starts all applications:

```bash
# Start everything from root
bun run dev
```

### 4. Running the Full Stack in Docker (Production-like)

```bash
docker compose up --build
```

### 5. Running a Single Service (Isolated Dev)

If you only want to work on the API:

```bash
cd apps/api
bun run infra:up  # Starts only Postgres/Rabbit/Minio for API
bun run dev       # Starts the API server
```

## 🧪 Testing Strategy

We follow a **Test Pyramid** approach:

- **Unit Tests:** Located in `__tests__/unit/` or next to source files. Run with `bun test`.
- **Integration Tests:** Located in `__tests__/integration/`. Uses **Supertest** for fast API testing.
- **E2E Tests:** Located in `tests/e2e/`. Uses **Playwright** for browser/system testing against a running instance.

Run all tests from root:
```bash
bun test
```

## 📖 Component Documentation

- [Backend API Guide](./apps/api/README.md)
- [Frontend Guide](./apps/web/README.md)
- [Worker Package](./apps/worker/README.md) (AI Processing)
