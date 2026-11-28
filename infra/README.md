# Health Vitals — Production Infrastructure (Split Managed Stack)

Zero-VPS, CLI-first production architecture tracked in this repository. For full C4 diagrams and operational failure-mode analysis, see [`docs/architecture/deployment.md`](../docs/architecture/deployment.md) and [`docs/architecture/infrastructure.md`](../docs/architecture/infrastructure.md).

## Tracked Providers Overview

| Concern | Provider | Repository Tracking |
| :--- | :--- | :--- |
| **Database** | Neon (PostgreSQL) | [`neon.ts`](../neon.ts), [`database/migrations/`](../database/migrations/), [`apps/jobs/migrator/`](../apps/jobs/migrator/) |
| **Object Storage** | Neon Object Storage | [`neon.ts`](../neon.ts) (`health-vitals-uploads` private bucket), [`packages/platform/src/storage/`](../packages/platform/src/storage/) |
| **Message Broker** | CloudAMQP (RabbitMQ) | [`packages/platform/src/queue/rabbitmq.ts`](../packages/platform/src/queue/rabbitmq.ts) (`file_processing` queue), [`infra/production.env.example`](./production.env.example) |
| **Frontend Server** | Vercel | [`apps/web/vercel.json`](../apps/web/vercel.json) |
| **Backend Compute** | Fly.io (`api` + `worker`) | [`infra/fly/api.toml`](./fly/api.toml), [`infra/fly/worker.toml`](./fly/worker.toml), [`infra/fly/deploy.sh`](./fly/deploy.sh) |
| **Email Delivery** | Resend | [`packages/platform/src/mail/resend.ts`](../packages/platform/src/mail/resend.ts), [`packages/emails/`](../packages/emails/), [`infra/dns/README.md`](./dns/README.md) |
| **LLM Provider** | Google Gemini (AI Studio) | [`packages/platform/src/llm/gemini.ts`](../packages/platform/src/llm/gemini.ts), [`packages/contracts/src/llm.ts`](../packages/contracts/src/llm.ts), [`infra/fly/worker.toml`](./fly/worker.toml) |
| **DNS & Domain** | Cloudflare (`binderlex.com`) | [`infra/dns/README.md`](./dns/README.md) |
| **CI/CD** | GitHub Actions | [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) |
| **Image Registry** | Fly.io Registry *(Docker Hub optional mirror)* | Dockerfiles in `apps/*/Dockerfile` (Fly builds directly to `registry.fly.io`; Docker Hub is optional/non-runtime) |

Validate repository infrastructure parity locally or in CI with:

```bash
bun run infra:check
```

---

## 1. Authenticate Provider CLIs (One-time)

```bash
neonctl auth        # Neon PostgreSQL & Object Storage
vercel login        # Vercel Frontend
fly auth login      # Fly.io Compute
```

## 2. Prepare Production Environment Variables

Copy [`infra/production.env.example`](./production.env.example) to `.env.production` (gitignored) and populate all provider credentials before deploying.

## 3. Neon (PostgreSQL & Object Storage)

Project services and per-branch defaults (including the private `health-vitals-uploads` bucket and 7-day preview branch TTL) are declared in [`neon.ts`](../neon.ts).

```bash
neonctl projects list
neonctl connection-string --project-id <PROJECT_ID>

# Run forward-only database migrations against Neon before deploying new API/Worker code
DATABASE_URL="<NEON_CONNECTION_STRING>" bun run migration:run
```

## 4. CloudAMQP (RabbitMQ)

Provision a **Little Lemur** instance in `us-east-1` (Ashburn, co-located with Neon and Fly `iad`) and set `RABBITMQ_URL` (`amqps://...`). The API and Worker automatically assert the durable `file_processing` queue on startup.

## 5. Fly.io (`api` + `worker`)

```bash
# Syncs secrets from .env.production and deploys both apps via Fly remote builders
./infra/fly/deploy.sh

# Attach custom domain TLS certificate
fly certs add api.binderlex.com --app health-vitals-api
```

## 6. Vercel (`apps/web`)

Configure the Vercel project with **Root Directory** = `apps/web` and environment variable `VITE_API_URL=https://api.binderlex.com`.

```bash
vercel link
vercel env ls
vercel --prod
```

## 7. Cloudflare DNS, Resend & Google Gemini (AI Studio)

- **Cloudflare DNS:** Configure web, API, and Resend SPF/DKIM/DMARC records as documented in [`infra/dns/README.md`](./dns/README.md).
- **Resend:** Verify `binderlex.com`, generate a scoped sending API key, and set `RESEND_API_KEY`, `MAIL_PROVIDER=resend`, and `MAIL_FROM`.
- **Google Gemini (AI Studio):** Generate an API key in Google AI Studio and set `GEMINI_API_KEY` (default model `gemini-3.5-flash-lite` is pinned in [`infra/fly/worker.toml`](./fly/worker.toml); model quotas are enforced via `llm_requests`).

## 8. Container Images & Docker Hub (Optional Mirror)

Fly.io builds directly from `apps/api/Dockerfile` and `apps/worker/Dockerfile` into Fly's internal registry (`registry.fly.io`). GitHub Actions also runs `docker build` across all 4 images on `main` to catch Dockerfile regressions. Docker Hub is **not** required for production deployments and is kept only as an optional manual mirror if standalone image distribution is ever needed.
