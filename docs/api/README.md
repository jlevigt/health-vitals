# HTTP API Documentation

Health Vitals exposes an OpenAPI 3.0.3 contract generated directly from [`@health-vitals/contracts`](../../packages/contracts/) Zod v4 schemas via `z.toJSONSchema(..., { target: "openapi-3.0" })`. There is no static `openapi.yaml` file to maintain separately.

## Endpoints

| URI | Purpose | Consumer |
| :--- | :--- | :--- |
| `/docs` | Interactive **Swagger UI** | Humans exploring or testing endpoints |
| `/openapi.json` | Canonical **OpenAPI 3.0.3 JSON** document | Code generators, SDK tools, API clients, contract tests |

### Base URLs

- **Production (Fly.io):** `https://api.binderlex.com/docs` and `https://api.binderlex.com/openapi.json`
- **Local Development:** `http://localhost:3000/docs` and `http://localhost:3000/openapi.json`

## Single Source of Truth Workflow

1. Define or update request/response schemas in [`packages/contracts/src/`](../../packages/contracts/src/).
2. Register or update endpoint metadata in [`apps/api/src/docs/openapi.ts`](../../apps/api/src/docs/openapi.ts).
3. Verify contract coverage and schema fidelity with:

```bash
bun test apps/api/src/docs/openapi.test.ts
```

Swagger UI is bundled locally via `swagger-ui-express` and fetches `/openapi.json` dynamically so it works identically offline in local development and in production.

## Authentication Schemes

- **`bearerAuth` (JWT Access Token):** Returned by `POST /auth/login` and `POST /auth/refresh` (15-minute TTL). Pass as `Authorization: Bearer <token>` on protected routes (`/auth/password/change`, `/files/*`, `/reports/*`, `/dashboard/*`).
- **`refreshCookie` (Session Refresh Token):** Set as an `HttpOnly`, `SameSite=Strict` cookie named `refreshToken` scoped to `/auth` (7-day TTL) and rotated on `POST /auth/refresh`.

## Consuming `/openapi.json` with External Tooling

```bash
# Fetch the canonical OpenAPI document locally
curl -s http://localhost:3000/openapi.json | jq '.paths | keys'
```

You can import `/openapi.json` directly into Postman, Insomnia, Bruno, Hoppscotch, or OpenAPI TypeScript/SDK generators without interacting with Swagger UI.
