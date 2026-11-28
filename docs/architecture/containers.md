# Containers & Communication Flows (C4 Level 2)

Health Vitals is organized as a Bun Workspace monorepo containing four runnable containers (`apps/*`) and three internal shared packages (`packages/*`).

## Container Diagram

```mermaid
flowchart TB
    User["Patient Browser"]

    subgraph Apps ["Runnable Containers (Bun Runtime)"]
        Web["Web SPA\napps/web\n(React 19, Vite 8, Tailwind 4, Recharts, i18next)"]
        API["REST API\napps/api\n(Express 5, Argon2, JWT, Swagger UI)"]
        Worker["AI Extraction Worker\napps/worker\n(AMQP consumer, pdf-parse, LLM pipeline)"]
        Migrator["Schema & Storage Migrator\napps/jobs/migrator\n(Run-once pre-deploy job)"]
    end

    subgraph Packages ["Shared Workspace Packages (Compile-Time Libraries)"]
        Contracts["@health-vitals/contracts\n(Pure Zod v4 schemas & DTOs)"]
        Platform["@health-vitals/platform\n(DB, Queue, S3, Mail, LLM, Pino, env.ts)"]
        Emails["@health-vitals/emails\n(React Email v6 templates)"]
    end

    subgraph DataLayer ["Data, Storage & Messaging"]
        PG[("PostgreSQL\n(Local PG 17 / Prod Neon)")]
        S3[("S3 Object Storage\n(Local MinIO / Prod Neon Object Storage)")]
        RMQ["RabbitMQ\n(Local RMQ 3 / Prod CloudAMQP)\nQueue: file_processing"]
    end

    subgraph ExternalAPIs ["External APIs"]
        Gemini["Google Gemini API / Local Ollama"]
        Resend["Resend / SMTP"]
    end

    User -->|"HTTPS SPA"| Web
    Web -->|"REST JSON + Bearer JWT / HttpOnly Cookie"| API
    Web -->|"Direct Presigned PUT (PDF bytes)"| S3

    API -->|"SQL (pg.Pool)"| PG
    API -->|"Presign PUT & DeleteObject"| S3
    API -->|"Publish FileProcessJobPayload"| RMQ
    API -->|"Send verification & reset emails"| Resend

    RMQ -->|"Deliver jobs (prefetch=1)"| Worker
    Worker -->|"FOR UPDATE lock, rate-limit check, insert reports/observations/llm_requests"| PG
    Worker -->|"GetObject (PDF buffer)"| S3
    Worker -->|"Structured biomarker extraction"| Gemini

    Migrator -->|"pg_advisory_xact_lock + SHA-256 SQL migrations"| PG
    Migrator -->|"HeadBucket / CreateBucket / PutBucketCors"| S3

    Web -.-> Contracts
    API -.-> Contracts
    API -.-> Platform
    API -.-> Emails
    Worker -.-> Contracts
    Worker -.-> Platform
    Migrator -.-> Platform
```

## Container & Package Responsibilities

| Container / Package | Runtime Role | Key Communication Contracts |
| :--- | :--- | :--- |
| **`apps/web`** | React 19 SPA (`src/api/client.ts` native `fetch`, MSW mock mode `dev:mock`). | Calls `apps/api` over HTTPS; uploads PDFs directly to S3 presigned URLs. |
| **`apps/api`** | Express 5 REST API organized by business feature (`auth`, `files`, `reports`, `dashboard`, `health`, `docs`). | Exposes OpenAPI 3.0.3 at `/openapi.json` and Swagger UI at `/docs`; publishes `FileProcessJobPayload` to RabbitMQ `file_processing`. |
| **`apps/worker`** | Headless background consumer (`prefetch = 1`). | Locks `files` row via `SELECT ... FOR UPDATE`, skips non-`QUEUED` rows, transitions atomically to `PROCESSING`, extracts PDF text, enforces `llm_requests` rate limits, calls `LLMProvider`, persists `reports` + `observations`, updates status to `SUCCEEDED` or `FAILED_*`. |
| **`apps/jobs/migrator`** | Run-once job executed before service rollout. | Acquires `pg_advisory_xact_lock(1769100000000)`, verifies SHA-256 checksums of applied migrations, applies pending SQL inside a single `BEGIN ... COMMIT` transaction, ensures bucket + CORS. |
| **`packages/contracts`** | Pure declarative leaf package (no internal dependencies). | Single source of truth for Zod v4 schemas, enums (`FileStatus`, `ExamExtractionModel`), DTO types, and OpenAPI schema generation. |
| **`packages/platform`** | Infrastructure abstraction layer (`Database`, `Queue`, `StorageClient`, `MailProvider`, `LLMProvider`, `Logger`, `AppError`, `env.ts`). | Centralizes external SDKs and startup env validation. |
| **`packages/emails`** | Branded transactional email templates (React Email v6). | Rendered by `apps/api` into HTML + plain-text fallbacks for verification and password recovery. |

## End-to-End Upload & Extraction Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User as Patient
    participant Web as apps/web
    participant API as apps/api
    participant S3 as Object Storage
    participant RMQ as RabbitMQ (file_processing)
    participant Worker as apps/worker
    participant LLM as Gemini / Ollama
    participant DB as PostgreSQL

    User->>Web: Selects clinical lab report PDF
    Web->>API: POST /files/uploads (Bearer JWT)
    API->>DB: INSERT files (status = CREATED)
    API->>S3: Generate Presigned PUT URL
    API-->>Web: 201 { files: [{ file_id, upload_url, ... }] }

    Web->>S3: PUT <upload_url> (PDF binary stream)
    S3-->>Web: 200 OK

    Web->>API: POST /files/{file_id}/upload-complete
    API->>DB: UPDATE files SET status = QUEUED
    API->>RMQ: Publish FileProcessJobPayload (persistent)
    API-->>Web: 200 { file_id, status: "QUEUED" }

    RMQ->>Worker: Deliver message (prefetch = 1)
    Worker->>DB: BEGIN + SELECT ... FOR UPDATE + status = PROCESSING + COMMIT
    Worker->>S3: GetObject(health-vitals-uploads, object_key)
    Worker->>Worker: Extract text via pdf-parse (min 50 chars)
    Worker->>DB: Check RPM / TPM / RPD quotas in llm_requests
    Worker->>LLM: Structured extraction request
    LLM-->>Worker: Normalized JSON observations + usage metrics

    Worker->>DB: Transaction: INSERT reports, categories, definitions, observations, llm_requests
    Worker->>DB: UPDATE files SET status = SUCCEEDED, processed_at = now()
    Worker->>RMQ: ACK message

    User->>Web: Opens Dashboard
    Web->>API: GET /dashboard/{category}
    API->>DB: Query time-series observations
    API-->>Web: 200 DashboardResponse
```
