# System Context (C4 Level 1)

Health Vitals enables patients to upload clinical laboratory reports (PDF), automatically extract structured biomarker measurements using generative AI, and track longitudinal health trends across clinical panels (lipid panel, glucose metabolism, renal function).

## Context Diagram

The diagram below distinguishes **runtime external dependencies** from **delivery/CI platforms** (which build, test, and deploy the system but are not called at request time).

```mermaid
flowchart TB
    User["Patient / End User\n(Web Browser)"]

    subgraph CoreSystem ["Health Vitals Platform"]
        HV["Health Vitals System\n(Web SPA + REST API + AI Worker + DB Migrator)"]
    end

    subgraph RuntimeExternal ["External Runtime Providers"]
        Cloudflare["Cloudflare DNS\n(binderlex.com routing & TLS DNS)"]
        NeonDB[("Neon PostgreSQL\n(Users, sessions, files, reports, observations, LLM metrics)")]
        NeonStorage[("Neon Object Storage\n(Private S3-compatible PDF bucket)")]
        CloudAMQP["CloudAMQP (RabbitMQ)\n(Durable file_processing queue)"]
        Gemini["Google Gemini API (AI Studio)\n(Structured clinical extraction LLM)"]
        Resend["Resend\n(Transactional verification & recovery emails)"]
    end

    subgraph DeliveryTooling ["Build, CI & Registry Platforms (Non-Runtime)"]
        GitHub["GitHub & GitHub Actions\n(Source control, lint, typecheck, tests, Docker build checks)"]
        FlyRegistry["Fly.io Remote Builders & Registry\n(Builds & hosts API/Worker containers)"]
        VercelBuild["Vercel Build Pipeline\n(Builds & serves static Web SPA)"]
    end

    User -->|"HTTPS (binderlex.com, api.binderlex.com)"| Cloudflare
    Cloudflare -->|"DNS resolution"| HV
    User -->|"Direct presigned PDF upload (HTTPS PUT)"| NeonStorage

    HV -->|"SQL over TLS (pg.Pool)"| NeonDB
    HV -->|"S3 API: presign, fetch, delete"| NeonStorage
    HV -->|"AMQP over TLS (amqps)"| CloudAMQP
    HV -->|"HTTPS JSON extraction requests"| Gemini
    HV -->|"HTTPS API email dispatch"| Resend

    GitHub -.->|"Triggers builds on main"| VercelBuild
    GitHub -.->|"Verified commits deployed via CLI"| FlyRegistry
```

## Key Boundaries

- **Direct Browser-to-Storage Data Plane:** After authenticating with the API and requesting a presigned PUT URL, the user's browser streams PDF bytes directly to Neon Object Storage (`health-vitals-uploads` private bucket), keeping binary uploads out of the API process.
- **Asynchronous Extraction Decoupling:** Confirming an upload enqueues a job in CloudAMQP and returns immediately (`200 OK`, status `QUEUED`). The background worker downloads the PDF, parses text, enforces model rate limits, invokes Google Gemini, and commits normalized biomarkers to Neon PostgreSQL.
- **Non-Runtime Tooling Separation:** GitHub Actions, Vercel builds, Fly.io remote builders/registry, and Docker Hub (optional archival mirror) are **not** runtime dependencies—if GitHub is down, live users can still log in, upload PDFs, and view dashboards.
