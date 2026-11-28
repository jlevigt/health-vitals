# Architecture Documentation

Health Vitals architecture is documented using the **[C4 Model](https://c4model.com/)** (Context, Containers, and Deployment views). Each diagram focuses on a single intent with concise labels; detailed specifications live in tables beneath each diagram.

## Reading Order & Diagram Catalog

1. **[System Context (C4 Level 1)](./system-context.md)**
   - Runtime System Context (users and live external providers)
   - Delivery & CI Context (non-runtime build and release tooling)
2. **[Containers, Dependencies & Flows (C4 Level 2)](./containers.md)**
   - High-Level Runtime Containers
   - Workspace Package Dependencies (compile-time monorepo DAG)
   - Frontend & Direct Upload Flow
   - Backend Async Extraction Flow
   - Migration & Bootstrap Flow
3. **[Deployment Topology (C4 Deployment)](./deployment.md)**
   - Production Runtime Hosting (Split Managed Stack)
   - Production Deploy Pipeline
   - Local Development Stack (`compose.yml`)
4. **[Infrastructure Inventory](./infrastructure.md)** — Operational reference for every managed service (purpose, dependent apps, environments, stored data, repo configuration, failure modes, official docs, and ownership).
5. **[Dependencies & Testing Strategy](./dependencies-and-testing.md)** — Library rationale, testing pyramid, LLM testing strategy, and CI pipeline.

## Architectural Principles

- **Strict Monorepo Boundaries:** `packages/contracts` (pure Zod/types) ← `packages/platform` (infrastructure adapters) ← `apps/*` (DI roots; never cross-import between apps).
- **Direct-to-Storage Uploads:** Clients upload PDFs directly to S3-compatible object storage using presigned PUT URLs so binary payloads never pass through API memory.
- **Asynchronous Clinical Extraction:** Heavy PDF parsing and LLM inference run asynchronously in `apps/worker` via RabbitMQ (`file_processing` durable queue) with PostgreSQL row-level locking (`SELECT ... FOR UPDATE`).
- **Forward-Only Schema Safety:** All database changes are applied before rollout by `apps/jobs/migrator` under a transaction-scoped advisory lock with SHA-256 checksum enforcement.
