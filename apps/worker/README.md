# @health-data/worker

Background processing worker for the Health Data App. Consumes jobs from RabbitMQ to process health reports using AI.

## 🚀 Features

- **Asynchronous Processing:** Handles long-running AI extraction tasks.
- **AI-Powered Parsing:** Integrates with Google Gemini.
- **Failure Resilience:** Implements retry logic via message queue.

## 🛠️ Usage

Run from the project root:

```bash
bun run dev:worker
```

## 🏗️ Structure

- `src/worker.ts`: Main entry point and queue consumer.
- `src/handlers/`: Logic for processing different job types.
