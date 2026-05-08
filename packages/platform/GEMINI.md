# Platform Package

## Purpose
The unified platform layer of the system. It combines the business interfaces (formerly Core) and their concrete infrastructure implementations (formerly Infra).

## Rules
- **Dependency Boundary**: Depends on `@health-vitals/contracts`. 
- **Internal Structure**: 
  - `interface.ts` files define the contracts for external ports.
  - Implementation files (e.g., `pg.ts`, `rabbitmq.ts`) provide the concrete drivers.
- **Errors**: Contains the global `AppError` hierarchy in `src/errors/`.
- **Environment**: `process.env` validation happens exclusively in `src/config/env.ts`.
- **Usage**: This is the only package allowed to import external SDKs (e.g., `pg`, `amqplib`, `@google/genai`).
