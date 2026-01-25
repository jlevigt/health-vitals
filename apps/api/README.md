# @health-data/api

The backend engine for the Health Data App. This service handles data ingestion, AI-powered extraction, and structured storage of medical results.

## 🚀 Features

- **Feature-Based Architecture:** Modular design grouped by domain.
- **AI Extraction:** Uses Google Gemini to parse PDF reports into structured data.
- **Express 5:** Uses the latest Express for better performance and promise handling.
- **Robust Auth:** JWT with refresh tokens and Argon2 hashing.
- **Modern Patterns:** Full ESM support, strict TypeScript, and absolute imports (`@/`).

## 🛠️ Architecture

- `src/features/`: Authentication, Reports, and Dashboard logic.
- `src/shared/`: Cross-cutting concerns (database pooled connection, logger).
- `src/server.ts`: Entry point.
- `src/app.ts`: Express application setup.

## 💻 Development

Run from the project root:
```bash
bun run dev:api
```

Or locally within this folder:
```bash
bun run dev
```

## 📋 Environment
This service consumes the root `.env` file via Bun's automatic environment loading or explicit `--env-file` flag.
