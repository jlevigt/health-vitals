---
name: pr-review
description: >-
  Performs an operational safety, architecture, and quality review of code changes
  aligned with Health Vitals standards and .github/pull_request_template.md.
  Use when reviewing a pull request, auditing a branch diff, or verifying changes
  before finalizing a task.
---

# Pull Request & Operational Safety Review

Run this checklist against the current git diff (`git status`, `git diff`, or `git diff main...HEAD`) before opening or approving a PR.

## 1. Scope & Hygiene

- Verify all modified files stay within the requested task or GitHub Issue **Allowed Scope** (no drive-by refactors).
- Verify no secrets, tokens, or local artifacts (`.env*`, `.neon`, credentials, sample patient PDFs) are staged or committed.
- Confirm commit messages follow Conventional Commits (`feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`, etc.).

## 2. Deterministic Checks

Run and confirm green results:

```bash
bun run lint
bun run typecheck
bun run test
```

If local Postgres/RabbitMQ are not running, note clearly which integration tests could not execute locally and run unit/package tests at minimum.

## 3. Architectural & Code Quality Review

- **TypeScript:** No `any` introduced in new code; strict typing preserved.
- **Validation:** Every new/changed HTTP route and worker job payload validates input with a Zod schema from `@health-vitals/contracts`.
- **Error Handling:** Errors use `AppError` subclasses (`@health-vitals/platform`) and are not silently swallowed.
- **Boundaries:** No cross-app imports (`apps/*` importing another app), no direct `process.env` reads outside `packages/platform/src/config/env.ts`, no unmanaged DB connections in feature services.
- **Worker Idempotency (if `apps/worker` changed):** Preserves `SELECT ... FOR UPDATE` state locking and atomic `QUEUED -> PROCESSING` transition.
- **API Docs (if `apps/api` routes changed):** `apps/api/src/docs/openapi.ts` and `openapi.test.ts` updated to match.
- **Frontend (if `apps/web` changed):** Uses `src/api/client.ts` (`fetch`, no `axios`), keeps `src/locales/` keys in sync, and updates MSW mocks if endpoints changed.
- **Observability:** Core flows emit structured Pino logs to `stdout` without leaking secrets or PII.

## 4. Database & Operational Safety

- If `database/migrations/` or `apps/jobs/migrator/` changed, activate and verify against the `migration-architect` skill:
  - No edits to previously applied migration files (SHA-256 checksum safety).
  - Forward-only, non-destructive expand-then-contract SQL.
  - Safe under the migrator's outer transaction.

## 5. Report Format

Summarize findings grouped by severity (**Blocker**, **Warning**, **Suggestion**), list verification commands executed with pass/fail status, and draft the **Risk & Operational Safety** section matching `.github/pull_request_template.md`:
- Migration Required (`Yes`/`No`)
- Breaking Change (`Yes`/`No`)
- Downtime Expected (`None`/`Minimal`/`Required`)
