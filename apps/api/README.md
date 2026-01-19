# @health-data/api

The backend engine for the Health Data App. This service handles data ingestion, AI-powered extraction, and structured storage of medical results.

## 🚀 Features

- **Feature-Based Architecture:** Modular design grouped by domain.
- **AI Extraction:** Uses Google Gemini to parse PDF reports into structured data.
- **Express 5:** Uses the latest Express for better performance and promise handling.
- **Robust Auth:** JWT with refresh tokens and Argon2 hashing.

## 🛠️ Architecture

The service follows a strict feature-based grouping:
- `src/features/`: Authentication, Reports, and Dashboard logic.
- `src/shared/`: Cross-cutting concerns (database pooled connection, logger).

## 💻 Development

This service is meant to be run from the project root using:
```bash
bun run dev:api
```

However, if developing locally within this folder:
```bash
bun install
bun run dev
```

## 📋 Environment
This service consumes the root `.env` file. Ensure `DATABASE_URL` is set correctly.
