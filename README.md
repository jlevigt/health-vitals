# Health Vitals (Monorepo)

A comprehensive solution for managing and visualizing health data. This project uses AI to extract structured data from PDF lab reports and provides a detailed dashboard for health metrics.

## 📁 Repository Structure

```text
.
├── packages/           # Monorepo packages
│   ├── api/            # Node.js/Express Backend (@health-vitals/api)
│   ├── web/            # React/Vite Frontend (@health-vitals/web)
│   ├── shared/         # Shared logic, DB migrations, types (@health-vitals/shared)
│   └── worker/         # Background processing worker (@health-vitals/worker)
├── infra/              # Infrastructure (Docker context, Scripts)
│   ├── docker-compose.local.yml
│   └── ...
├── .env.local          # Local configuration (gitignored)
└── .env.production     # Production configuration
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
Install dependencies for all workspaces:
```bash
bun install
```

### 3. Environment Setup
Create a `.env.local` file in the root based on your credentials:
```env
PORT=3000
DATABASE_URL=postgres://user:pass@localhost:5432/health_db
SECRET_JWT_KEY=your_secret_key
GEMINI_API_KEY=your_gemini_api_key (optional)
# RabbitMQ & S3 config if needed
```

### 4. Running the App
Use the root delegation scripts (managed via Bun):

| Command | Description |
|---|---|
| `bun run infra:up` | Start Postgres, RabbitMQ, and MinIO |
| `bun run migration:run` | Run database migrations |
| `bun run dev:api` | Start Backend API (Port 3000) |
| `bun run dev:web` | Start Frontend (Port 5173) |
| `bun run dev:mock` | Start Frontend with MSW Mocks |
| `bun run dev:worker` | Start Background Worker |

## 📖 Component Documentation

- [Backend API Guide](./packages/api/README.md)
- [Frontend Guide](./packages/web/README.md)
- [Shared Package](./packages/shared/README.md) (Database & Helpers)
- [Worker Package](./packages/worker/README.md) (AI Processing)

## 🏗️ Development Guidelines

- **TypeScript**: All packages use TypeScript with strict mode.
- **ESM**: Every package uses `"type": "module"`.
- **Absolute Imports**: Use `@/` to refer to the `src/` directory of the current package.
- **Bun**: Prefer `bun` for running all tasks.
