# Core Layer

## Purpose
The domain "brain" of the system. Contains business interfaces, domain logic, custom errors, and environment validation.

## Rules
- Depends ONLY on `@health-vitals/contracts`.
- MUST NOT import from `@health-vitals/infra`.
- Defines interfaces for external ports (e.g., `Database`, `Logger`, `MailProvider`, `StorageClient`, `QueueConnection`).
- `process.env` validation happens exclusively in `config/env.ts`.
