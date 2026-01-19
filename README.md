# Health Data App (Monorepo)

A comprehensive solution for managing and visualizing health data. This project uses AI to extract structured data from PDF lab reports and provides a detailed dashboard for health metrics.

## 📁 Repository Structure

```text
.
├── apps/               # Main applications
│   ├── api/            # Node.js/Express Backend (@health-data/api)
│   └── web/            # React/Vite Frontend (@health-data/web)
├── infra/              # Infrastructure and automation
│   ├── migrations/     # Shared database migrations
│   └── scripts/        # Database maintenance scripts
├── .env                # Global configuration
└── docker-compose.yml  # Shared services (Postgres, RabbitMQ, MinIO)
```

## 🛠️ Tech Stack

- **Runtime:** [Bun](https://bun.sh/)
- **Backend:** Express 5, TypeScript, PostgreSQL, Pino Logger
- **Frontend:** React 19, Vite 6, Recharts, Tailwind CSS 4
- **AI:** Google Gemini (Generative AI)
- **Infra:** Docker Compose, RabbitMQ (Broker), MinIO (Storage)

## ⚙️ Quick Start

### 1. Prerequisites
Ensure you have [Bun](https://bun.sh/) and [Docker](https://www.docker.com/) installed.

### 2. Installation
Install dependencies for all workspaces:
```bash
bun install
```

### 3. Environment Setup
Create a `.env` file in the root based on your credentials:
```env
PORT=3000
DATABASE_URL=postgres://user:pass@localhost:5432/health_db
SECRET_JWT_KEY=your_secret_key
GEMINI_API_KEY=your_gemini_api_key (optional)
```

### 4. Running the App
Use the root delegation scripts:

| Command | Description |
|---|---|
| `bun run infra:up` | Start Postgres, RabbitMQ, and MinIO |
| `bun run migration:run` | Run database migrations |
| `bun run dev:api` | Start Backend API (Port 3000) |
| `bun run dev:web` | Start Frontend (Port 5173) |
| `bun run dev:mock` | Start Frontend with MSW Mocks |

## 📖 Component Documentation

- [Backend API Guide](./apps/api/README.md)
- [Frontend Guide](./apps/web/README.md)
- [Infrastructure & Database](./infra/README.md)
