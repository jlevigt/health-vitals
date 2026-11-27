# Health Vitals — Production Infrastructure (Split Managed Stack)

Zero-VPS, CLI-first architecture using:
- **Frontend:** Vercel (`apps/web`)
- **Database:** Neon (PostgreSQL)
- **Object Storage:** Cloudflare R2 (10 GB free, S3-compatible, zero egress)
- **Message Broker:** CloudAMQP (*Little Lemur* free tier)
- **Backend Compute:** Fly.io (`api` + `worker`, $5/mo free allowance)
- **DNS:** Cloudflare (`binderlex.com`)

---

## 1. Authenticate All Provider CLIs (One-time)

```bash
neonctl auth        # Neon PostgreSQL
vercel login        # Vercel Frontend
wrangler login      # Cloudflare R2 / DNS
fly auth login      # Fly.io Compute
```

## 2. Neon (PostgreSQL)

List your projects/branches and grab the connection string:

```bash
neonctl projects list
neonctl connection-string --project-id <PROJECT_ID>
```

Run database migrations directly from your machine against Neon:

```bash
DATABASE_URL="<NEON_CONNECTION_STRING>" bun run migration:run
```

## 3. Cloudflare R2 (Object Storage)

Create the `health-vitals-uploads` bucket and configure CORS:

```bash
./infra/cloudflare/setup-r2.sh
```

Then create an R2 S3 API Token (Object Read & Write for `health-vitals-uploads`) in Cloudflare Dashboard → R2 → Manage R2 API Tokens, which gives you:
- `STORAGE_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
- `STORAGE_REGION=auto`
- `STORAGE_ACCESS_KEY=<R2_ACCESS_KEY_ID>`
- `STORAGE_SECRET_KEY=<R2_SECRET_ACCESS_KEY>`

## 4. CloudAMQP (RabbitMQ)

Create a free **Little Lemur** instance at CloudAMQP (region: `us-east-1` / Ashburn to stay close to Neon & Fly `iad`) and copy the `amqps://...` URL into `RABBITMQ_URL`.

## 5. Fly.io (`api` + `worker`)

Put your production values into `.env.production` (gitignored), then deploy both services:

```bash
./infra/fly/deploy.sh
```

Point `api.binderlex.com` to Fly.io:

```bash
fly certs add api.binderlex.com --app health-vitals-api
```

Follow the DNS record output (typically a `CNAME` for `api.binderlex.com` → `health-vitals-api.fly.dev` + `_acme-challenge` if proxied).

## 6. Vercel (`apps/web`)

Link and manage frontend env vars via CLI:

```bash
vercel link
vercel env ls
vercel --prod
```
