# Architecture Documentation

Health Vitals architecture is documented using the **[C4 Model](https://c4model.com/)** (Context, Containers, and Deployment views) complemented by a full operational infrastructure inventory and testing/dependency rationale.

## Reading Order

1. **[System Context (C4 Level 1)](./system-context.md)** — Who uses Health Vitals, what the system does, and which external systems it depends on at runtime versus delivery/CI tooling.
2. **[Containers & Processing Flow (C4 Level 2)](./containers.md)** — Applications (`web`, `api`, `worker`, `migrator`), shared workspace packages (`contracts`, `platform`, `emails`), synchronous HTTP vs. asynchronous AMQP flows, and architectural invariants.
3. **[Deployment Topology (C4 Deployment)](./deployment.md)** — Side-by-side view of Local Development (Docker Compose) and Production (Split Managed Stack).
4. **[Infrastructure Inventory](./infrastructure.md)** — Operational reference for every managed service (purpose, dependent apps, environments, stored data, repo configuration, failure modes, official docs, and ownership).
5. **[Dependencies & Testing Strategy](./dependencies-and-testing.md)** — Library rationale, testing pyramid, LLM testing strategy, and CI quality gates.

## Architectural Principles

- **Strict Monorepo Boundaries:** `packages/contracts` (pure Zod/types) ← `packages/platform` (infrastructure adapters) ← `apps/*` (DI roots; never cross-import between apps).
- **Direct-to-Storage Uploads:** Clients upload PDFs directly to S3-compatible object storage using presigned PUT URLs so binary payloads never pass through API memory.
- **Asynchronous Clinical Extraction:** Heavy PDF parsing and LLM inference run asynchronously in `apps/worker` via RabbitMQ (`file_processing` durable queue) with PostgreSQL row-level locking (`SELECT ... FOR UPDATE`).
- **Forward-Only Schema Safety:** All database changes are applied before rollout by `apps/jobs/migrator` under a transaction-scoped advisory lock with SHA-256 checksum enforcement.
