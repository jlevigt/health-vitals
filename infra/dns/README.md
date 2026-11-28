# Cloudflare DNS & Email Authentication Inventory (`binderlex.com`)

DNS for `binderlex.com` is managed in **Cloudflare**. This file tracks the required record topology (without exposing sensitive verification tokens or account IDs) so production routing and email deliverability remain reproducible from the repository.

## 1. Web & API Routing Records

| Type | Name | Target / Value | Cloudflare Proxy | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `A` | `@` (`binderlex.com`) | Vercel apex IP (`76.76.21.21` or project-assigned IP) | DNS only (grey) recommended for Vercel TLS | Production frontend (`apps/web` on Vercel) |
| `CNAME` | `www` | `cname.vercel-dns.com` | DNS only (grey) | `www.binderlex.com` redirect/alias to Vercel |
| `CNAME` | `api` (`api.binderlex.com`) | `health-vitals-api.fly.dev` | DNS only (grey) or Proxied with `_acme-challenge` | Production REST API (`apps/api` on Fly.io) |
| `CNAME` | `_acme-challenge.api` | Fly.io ACME verification target (output by `fly certs add`) | DNS only (grey) | Automated Let's Encrypt TLS renewal on Fly.io |

> **TLS note:** When adding `api.binderlex.com` via `fly certs add api.binderlex.com --app health-vitals-api`, Fly.io prints the exact `CNAME` and `_acme-challenge` records required for certificate issuance.

## 2. Transactional Email Authentication (Resend)

Outbound transactional emails (account verification, password recovery) are sent from `noreply@binderlex.com` via **Resend**. The following records must be present in Cloudflare for SPF, DKIM, and DMARC alignment:

| Type | Name | Target / Value | Proxy | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `TXT` | `resend._domainkey` | Public DKIM key (`p=...`) generated in Resend Dashboard | DNS only | Cryptographic DKIM signing for `binderlex.com` |
| `MX` | `send` | `feedback-smtp.<region>.amazonses.com` (priority `10`) | DNS only | Bounce/complaint return-path for Resend |
| `TXT` | `send` | `v=spf1 include:amazonses.com ~all` | DNS only | SPF authorization for Resend return-path |
| `TXT` | `_dmarc` | `v=DMARC1; p=none;` (or stricter `quarantine`/`reject` once monitored) | DNS only | DMARC alignment policy |

## 3. Verification Commands

```bash
# Verify API DNS resolution & TLS certificate
dig +short CNAME api.binderlex.com
fly certs show api.binderlex.com --app health-vitals-api

# Verify email authentication records
dig +short TXT resend._domainkey.binderlex.com
dig +short TXT send.binderlex.com
dig +short TXT _dmarc.binderlex.com
```
