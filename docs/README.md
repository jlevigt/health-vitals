# Health Vitals Documentation

This directory is the central documentation hub for **Health Vitals**, organized into clear layers so every document stays anchored to a single source of truth in code or infrastructure manifests.

## Documentation Layers

| Layer | Location | Standard / Source of Truth | Status |
| :--- | :--- | :--- | :--- |
| **HTTP API Contracts** | [`docs/api/`](./api/README.md) & live `/docs`, `/openapi.json` | OpenAPI 3.0.3 generated from [`packages/contracts`](../packages/contracts/) Zod v4 schemas | Active |
| **System Architecture** | [`docs/architecture/`](./architecture/README.md) | C4 Model (Context, Containers, Deployment) + Infrastructure Inventory | Active |
| **Deployment & Infra Configs** | [`infra/README.md`](../infra/README.md) & [`infra/dns/README.md`](../infra/dns/README.md) | `neon.ts`, `infra/fly/*.toml`, `apps/web/vercel.json`, `infra/production.env.example` | Active |
| **Async Messaging Contracts** | *Planned (`docs/messaging/`)* | AsyncAPI 3.0 for RabbitMQ `file_processing` queue | Roadmap |
| **Architecture Decisions** | *Planned (`docs/decisions/`)* | Architecture Decision Records (ADRs) | Roadmap |
| **Operational Runbooks** | *Planned (`docs/operations/`)* | Troubleshooting, backup/recovery, incident response | Roadmap |

## Quick Navigation

- **Understand the system:** Start with [`docs/architecture/README.md`](./architecture/README.md) → [System Context](./architecture/system-context.md) → [Containers](./architecture/containers.md).
- **Inspect production topology & providers:** Read [Deployment Topology](./architecture/deployment.md) and the [Infrastructure Inventory](./architecture/infrastructure.md).
- **Integrate with the REST API:** Read [`docs/api/README.md`](./api/README.md) or browse Swagger UI at `/docs` (`/openapi.json` for tooling).
- **Dependencies & Testing Strategy:** See [Dependencies & Testing](./architecture/dependencies-and-testing.md).
- **AI Agent Guidelines:** See root [`AGENTS.md`](../AGENTS.md).
