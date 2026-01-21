# Monorepo Structure Concerns & Recommendations

## Critical Architectural Decisions

### 1. **Vertical Slice Architecture with Shared Infrastructure**

**Key Concern**: You want Vertical Slice Architecture but need shared infrastructure. This creates a tension you must resolve carefully.

**Recommendation**:
- **API & Worker**: Keep domain logic (slices) separate in each service
- **Shared package**: Only infrastructure/cross-cutting concerns, NOT business logic
- Each slice in API/Worker should be self-contained with its own controllers, services, validators, DTOs

### 2. **What Goes in `packages/shared`?**

**Should include**:
- **Database schema & migrations** (single source of truth)
- **Database client initialization** (connection pooling, config)
- **Queue client/infrastructure** (RabbitMQ connection, base job types)
- **Storage client abstraction** (S3-compatible interface for Minio/R2)
- **Logger configuration** (Pino setup, formatters)
- **Mail client abstraction** (interface that works with Ethereal/Resend)
- **Common types/interfaces** (shared DTOs, enums, constants)
- **Shared utilities** (date formatters, validators, encryption helpers)
- **Error classes** (custom error types used across services)
- **Configuration schemas** (Zod schemas for env validation)

**Should NOT include**:
- Business logic or domain models
- Route handlers or controllers
- Service layer implementations
- Feature-specific code
- React components or frontend code

### 3. **Package.json Hierarchy Strategy**

**Root `package.json`**:
- Workspace configuration
- Global dev dependencies (TypeScript, linters, formatters)
- Scripts to orchestrate all packages
- Shared tooling (Prettier, ESLint configs)

**Individual package `package.json`**:
- Service-specific dependencies only
- Independent versioning
- Service-specific scripts (dev, build, test, start)
- Explicit workspace dependencies (`"@bio-metrics/shared": "workspace:*"`)

**Concern**: Dependency duplication vs. version conflicts
- Use workspace protocol to share dependencies where possible
- Pin critical infrastructure versions in shared
- Allow services to override if needed

### 4. **TypeScript Configuration Hierarchy**

**Root `tsconfig.base.json`**:
- Compiler options shared across all packages
- Path aliases for workspace packages
- Strict mode settings
- Target/module/lib settings

**Service-specific `tsconfig.json`**:
- Extends base config
- Service-specific paths and includes
- Output directory configuration
- Project references for type-checking across packages

**Concern**: Bun's TypeScript handling
- Bun has native TypeScript support but respect tsconfig
- Ensure paths work in both Bun runtime and build process
- Test type-checking independently from runtime

### 5. **Environment Variable Management**

**Structure needed**:
```
.env.example (root) - Template with all variables
.env (root, gitignored) - Local development values
.env.test (optional) - Test-specific overrides
packages/api/.env.example - API-specific variables
packages/worker/.env.example - Worker-specific variables
packages/web/.env.example - Web-specific variables
```

**Concerns**:
- **Precedence**: Root .env vs package-specific .env
- **Validation**: Use Zod schemas in shared to validate env vars on startup
- **Secrets management**: Never commit real secrets, use .env.example as documentation
- **Production**: Use environment-specific configs, not .env files

### 6. **Docker & Docker Compose Strategy**

**You need three compose files**:

**`docker-compose.dev.yml`** (Infrastructure only):
- PostgreSQL
- RabbitMQ
- Minio
- Ports exposed to host
- Named volumes for persistence
- Health checks
- No API/Worker/Web containers (run locally with Bun)

**`docker-compose.prod.yml`** (Full stack):
- All infrastructure services
- API container
- Worker container
- Networks for service isolation
- Production-optimized images
- No exposed ports except necessary ones
- Secrets management

**`docker-compose.test.yml`** (Test infrastructure):
- Ephemeral containers (tmpfs volumes)
- Different ports to avoid conflicts
- Minimal configuration for speed

**Dockerfile Concerns**:
- **Multi-stage builds**: Builder stage + runtime stage
- **Layer caching**: Copy package.json first, then install, then code
- **Bun-specific**: Use `oven/bun` base images
- **Workspace handling**: Need to copy shared package when building API/Worker
- **Build context**: Root of monorepo, not individual packages

### 7. **Database Migrations & Seeds**

**Location**: `packages/shared/src/db/migrations`

**Concerns**:
- **Migration runner**: Should be in shared, runnable from any service
- **Migration tool**: Drizzle-kit, Kysely migrations, or Knex
- **Versioning**: Timestamp-based naming
- **Rollbacks**: Must support down migrations
- **Seeds**: Separate from migrations, optional script in shared
- **CI/CD**: Migrations run before service deployment
- **Multiple databases**: Consider if you need separate migration paths

**Execution strategy**:
- Local: `bun run db:migrate` from root
- Docker: Migration init container or startup script
- Production: Separate migration job before deployment

### 8. **Testing Isolation & Execution**

**Per-package test isolation**:
- Each package has its own test suite
- Shared package tested independently
- API tests don't trigger Worker tests
- Web tests use MSW (Mock Service Worker) for API

**Test database strategy**:
- Separate test database (different port/name)
- Clean between test files (truncate, not drop/create)
- Transaction rollback for unit tests
- Use different database per test worker for parallelization

**Concerns**:
- **Parallel execution**: Bun test runs in parallel by default - ensure tests are isolated
- **Fixtures**: Share test fixtures via shared package test utilities
- **E2E complexity**: Cypress needs all services running - use docker-compose.test.yml
- **CI performance**: Run unit/integration in parallel, E2E sequentially

### 9. **Vertical Slice Organization in API**

**Concern**: How middleware fits with vertical slices
- Auth, CORS, error handling are cross-cutting - keep in middleware
- Feature-specific middleware goes in the slice
- Share middleware from packages/shared only if Worker also needs it

### 10. **Worker Architecture with Vertical Slices**

**Structure**:
```
packages/worker/src/
├── jobs/
│   ├── process-pdf/
│   │   ├── process-pdf.handler.ts
│   │   ├── process-pdf.service.ts
│   │   ├── pdf-extractor.ts
│   │   ├── llm-processor.ts
│   │   └── process-pdf.test.ts
│   └── send-notification/
└── worker.ts (job registration)
```

**Concerns**:
- **Job definitions**: Type-safe job payloads in shared
- **Consumer configuration**: RabbitMQ queue bindings, prefetch, concurrency
- **Error handling**: Dead letter queues, retry strategies
- **Observability**: Logging job start/complete/fail with correlation IDs

### 11. **Storage Client Abstraction**

**Critical concern**: Minio (dev) vs Cloudflare R2 (prod)

**Strategy**:
- Create abstraction in `packages/shared/src/storage/`
- S3-compatible interface (both support AWS SDK v3)
- Configuration-driven: switch via env vars
- Mock implementation for tests

**Interface methods needed**:
- `uploadFile(bucket, key, buffer, metadata)`
- `getFile(bucket, key)`
- `deleteFile(bucket, key)`
- `getSignedUrl(bucket, key, expiresIn)`
- `listFiles(bucket, prefix)`

### 12. **Logger Configuration**

**Shared logger setup**:
- Pino instance with common configuration
- Different transport for dev (pretty) vs prod (JSON)
- Child loggers with context (service name, request ID)
- HTTP logging wrapper (pino-http) configured in API

**Concerns**:
- **Correlation IDs**: Generate in API middleware, pass to Worker via job payload
- **Structured logging**: Always log objects, not strings
- **Log levels**: Environment-based (debug in dev, info in prod)
- **Sensitive data**: Redact passwords, tokens in serializers

### 13. **OpenAPI Specification**

**Location**: `packages/api/openapi.yaml` or generated

**Strategy options**:
1. **Hand-written**: Maintain YAML manually (more control, more maintenance)
2. **Generated from code**: Use decorators/JSDoc + tool (tsoa, swagger-autogen)
3. **Code-first with validation**: Zod schemas generate both runtime validation and OpenAPI

**Recommendation**: Zod + zod-to-openapi
- Define schemas in API routes
- Validate requests with same schemas
- Generate OpenAPI spec automatically
- Single source of truth

## Priority Checklist for Monorepo Setup

1. ✅ Define workspace structure and dependencies
2. ✅ Set up TypeScript configs with proper references
3. ✅ Configure Bun workspaces in root package.json
4. ✅ Create shared package with infrastructure only
5. ✅ Set up dev docker-compose for local infrastructure
6. ✅ Configure environment variables with validation
7. ✅ Implement database migrations in shared
8. ✅ Set up test infrastructure per package
9. ✅ Create production Dockerfiles with multi-stage builds
10. ✅ Document everything with README hierarchy
11. ✅ Configure CI/CD pipeline with proper build order

The key is **progressive enhancement**: Start with basic structure, add complexity as needed, keep vertical slices independent while sharing only true infrastructure concerns.