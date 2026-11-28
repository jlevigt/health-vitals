# Health Vitals — Production Infrastructure (Split Managed Stack)

Zero-VPS, CLI-first architecture using:
- **Frontend:** Vercel (`apps/web`)
- **Database:** Neon (PostgreSQL)
- **Object Storage:** Neon Object Storage (`health-vitals-uploads` private bucket, declared in [`neon.ts`](../neon.ts))
- **Message Broker:** CloudAMQP (*Little Lemur* free tier)
- **Backend Compute:** Fly.io (`api` + `worker`)
- **DNS:** Cloudflare (`binderlex.com`)
- **Transactional Email:** Resend

---

## 1. Authenticate Provider CLIs (One-time)

```bash
neonctl auth        # Neon PostgreSQL & Object Storage
vercel login        # Vercel Frontend
fly auth login      # Fly.io Compute
```

## 2. Neon (PostgreSQL & Object Storage)

Project services and per-branch defaults (including the private `health-vitals-uploads` bucket) are declared in [`neon.ts`](../neon.ts).

List your projects/branches and grab the connection string:

```bash
neonctl projects list
neonctl connection-string --project-id <PROJECT_ID>
```

Run database migrations directly from your machine against Neon:

```bash
DATABASE_URL="<NEON_CONNECTION_STRING>" bun run migration:run
```

Configure S3-compatible credentials from your Neon branch's Object Storage settings in `.env.production`:
- `STORAGE_ENDPOINT`
- `STORAGE_REGION`
- `STORAGE_ACCESS_KEY`
- `STORAGE_SECRET_KEY`
- `STORAGE_BUCKET=health-vitals-uploads`

## 3. CloudAMQP (RabbitMQ)

Create a free **Little Lemur** instance at CloudAMQP (region: `us-east-1` / Ashburn to stay close to Neon & Fly `iad`) and copy the `amqps://...` URL into `RABBITMQ_URL`.

## 4. Fly.io (`api` + `worker`)

Put your production values into `.env.production` (gitignored), then deploy both services:

```bash
./infra/fly/deploy.sh
```

Point `api.binderlex.com` to Fly.io:

```bash
fly certs add api.binderlex.com --app health-vitals-api
```

Follow the DNS record output (typically a `CNAME` for `api.binderlex.com` → `health-vitals-api.fly.dev` + `_acme-challenge` if proxied).

## 5. Vercel (`apps/web`)

Link and manage frontend env vars via CLI:

```bash
vercel link
vercel env ls
vercel --prod
```
