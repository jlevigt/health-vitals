# Health Vitals — Architecture Overview

The canonical C4 architecture diagrams, infrastructure inventory, API contract guide, and testing strategy live under [`docs/`](./docs/README.md).

## Documentation Map

- **[Documentation Hub](./docs/README.md)** — Overview of the API, Architecture, and Infrastructure documentation layers.
- **[Architecture Guide (C4 Model)](./docs/architecture/README.md):**
  - [System Context (C4 Level 1)](./docs/architecture/system-context.md) — Actors, system boundary, runtime providers vs. delivery tooling.
  - [Containers & Processing Flow (C4 Level 2)](./docs/architecture/containers.md) — `apps/*`, `packages/*`, sync HTTP vs. async RabbitMQ extraction sequence.
  - [Deployment Topology (C4 Deployment)](./docs/architecture/deployment.md) — Local Docker Compose vs. Production Split Managed Stack.
  - [Infrastructure Inventory](./docs/architecture/infrastructure.md) — Complete operational table for Neon, CloudAMQP, Vercel, Fly.io, Resend, Google Gemini, Cloudflare, and GitHub Actions.
  - [Dependencies & Testing Strategy](./docs/architecture/dependencies-and-testing.md) — Technology rationale, test pyramid, and CI pipeline.
- **[HTTP API Documentation](./docs/api/README.md)** — Live Swagger UI (`/docs`) and Zod-generated OpenAPI 3.0.3 (`/openapi.json`).
- **[Production Deployment Runbook](./infra/README.md)** — CLI deployment steps, [`infra/production.env.example`](./infra/production.env.example), and [`infra/dns/README.md`](./infra/dns/README.md).
