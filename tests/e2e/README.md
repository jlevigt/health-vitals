# E2E Tests

This directory contains End-to-End (E2E) tests for the Health Vitals system.

## Testing Strategy

We follow a hybrid testing stack to balance speed and reliability:

- **Unit Tests (`__tests__/unit/` inside apps):** Test pure logic in isolation using `bun test` and mocks.
- **Integration Tests (`__tests__/integration/` inside apps):** Test HTTP routes and database/queue interactions using **Supertest** (for fast in-memory Express testing) and real infrastructure.
- **E2E Tests (`tests/e2e/`):** Test full system flows using **Playwright** (for UI) and **native Bun fetch** (for API) against a running environment (Docker or `bun run dev`).

## Running E2E Tests

1. Ensure the system is running:
   ```bash
   bun run dev
   ```

2. Run tests:
   ```bash
   # Commands for playwright will go here
   ```
