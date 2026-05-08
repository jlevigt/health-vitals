# Platform Package

## Purpose
Unified platform layer combining business interfaces and infrastructure implementations.

## Rules
- **Internal Structure**: 
  - `interface.ts` files define contracts for external ports.
  - Implementation files (e.g., `pg.ts`, `rabbitmq.ts`) provide concrete drivers.
- **Errors**: Contains the global `AppError` hierarchy in `src/errors/`.
- **Environment**: `process.env` validation happens exclusively in `src/config/env.ts`.
- **Usage**: Only package allowed to import external SDKs (e.g., `pg`, `amqplib`).
