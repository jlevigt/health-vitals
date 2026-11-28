# Deployment Topology (C4 Deployment)

Health Vitals runs in two distinct topologies: a **local Docker Compose stack** for self-contained development and integration testing, and a **zero-VPS Split Managed Stack** in production.

## Production Topology (Split Managed Stack)

```mermaid
flowchart TB
    Client["End User Browser"]

    subgraph EdgeDNS ["Cloudflare DNS (binderlex.com)"]
        DNS["DNS Records\nbinderlex.com -> Vercel\napi.binderlex.com -> Fly.io\nSPF / DKIM / DMARC -> Resend"]
    end

    subgraph VercelNode ["Vercel Edge / CDN"]
        WebProd["health-vitals-web\n(Static React 19 + Vite 8 SPA\napps/web/vercel.json)"]
    end

    subgraph FlyNode ["Fly.io (Region: iad — Ashburn, VA)"]
        ApiProd["health-vitals-api\n(shared-cpu-1x, 512MB, auto_stop/auto_start\ninfra/fly/api.toml, /health every 30s)"]
        WorkerProd["health-vitals-worker\n(shared-cpu-1x, 512MB\ninfra/fly/worker.toml)"]
    end

    subgraph NeonNode ["Neon (Managed Cloud)"]
        NeonPG[("Neon PostgreSQL\n(Branches + 7d preview TTL\nneon.ts)")]
        NeonS3[("Neon Object Storage\n(Bucket: health-vitals-uploads, private\nneon.ts)")]
    end

    subgraph CloudAMQPNode ["CloudAMQP (us-east-1 — Ashburn)"]
        RMQProd["RabbitMQ (Little Lemur)\nQueue: file_processing (durable)"]
    end

    subgraph SaaS ["External SaaS APIs"]
        ResendProd["Resend API\n(noreply@binderlex.com)"]
        GeminiProd["Google Gemini API\n(AI Studio — gemini-3.5-flash-lite)"]
    end

    subgraph ReleaseOps ["CI & Release Execution (Non-Runtime)"]
        GHA["GitHub Actions (.github/workflows/ci.yml)\nLint + Infra Check + Typecheck + Migrations + Tests + Docker Build"]
        DevCLI["Operator CLI (Local)\nbun run migration:run -> ./infra/fly/deploy.sh -> vercel --prod"]
    end

    Client -->|"HTTPS"| DNS
    DNS --> WebProd
    DNS --> ApiProd
    Client -->|"Direct Presigned PUT"| NeonS3

    WebProd -->|"HTTPS JSON (api.binderlex.com)"| ApiProd
    ApiProd -->|"TLS SQL"| NeonPG
    ApiProd -->|"S3 API"| NeonS3
    ApiProd -->|"AMQPS"| RMQProd
    ApiProd -->|"HTTPS"| ResendProd

    RMQProd -->|"AMQPS"| WorkerProd
    WorkerProd -->|"TLS SQL"| NeonPG
    WorkerProd -->|"S3 API"| NeonS3
    WorkerProd -->|"HTTPS"| GeminiProd

    DevCLI -.->|"Pre-deploy SQL migrations"| NeonPG
    DevCLI -.->|"Builds & deploys to registry.fly.io"| FlyNode
    GHA -.->|"Validates PRs & main"| DevCLI
```

## Local Development Topology (`compose.yml`)

```mermaid
flowchart LR
    DevBrowser["Local Browser"] --> Traefik["Traefik v3.6 (:80)\nweb.localhost / api.localhost / s3.localhost / rabbitmq.localhost"]
    Traefik --> WebLocal["apps/web (:80 or Vite :5173)"]
    Traefik --> ApiLocal["apps/api (:3000)"]
    Traefik --> MinIO["MinIO (:9000 / :9001)"]
    Traefik --> RMQLocal["RabbitMQ 3 (:5672 / :15672)"]

    MigratorLocal["apps/jobs/migrator\n(run-once before api/worker)"] --> PGLocal[("PostgreSQL 17 (:5432)")]
    MigratorLocal --> MinIO
    ApiLocal --> PGLocal
    ApiLocal --> MinIO
    ApiLocal --> RMQLocal
    WorkerLocal["apps/worker"] --> PGLocal
    WorkerLocal --> MinIO
    WorkerLocal --> RMQLocal
```

## Environment Differences

| Aspect | Local Development (`compose.yml`) | Production (Split Managed Stack) |
| :--- | :--- | :--- |
| **Ingress / TLS** | Traefik v3.6 HTTP (`*.localhost`) | Cloudflare DNS + Vercel TLS (`binderlex.com`) + Fly.io Let's Encrypt TLS (`api.binderlex.com`) |
| **PostgreSQL** | Docker `postgres:17-alpine` | Neon Serverless PostgreSQL (`sslmode=require`) |
| **Object Storage** | Docker `minio/minio` | Neon Object Storage (`health-vitals-uploads`, private) |
| **Message Broker** | Docker `rabbitmq:3-management-alpine` (`amqp://`) | CloudAMQP Little Lemur (`amqps://`) |
| **Backend Hosting** | Local Bun watch or Docker Compose | Fly.io (`iad`): `health-vitals-api` & `health-vitals-worker` |
| **Frontend Hosting** | Vite dev server (`:5173`) or MSW `dev:mock` | Vercel CDN (`apps/web`) |
| **Email & LLM** | Mock/Nodemailer + Mock/Ollama/Gemini | Resend (`noreply@binderlex.com`) + Google Gemini AI Studio |
| **Image Registry** | Local Docker daemon | Fly.io internal registry (`registry.fly.io`); Docker Hub optional mirror only |
