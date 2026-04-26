# API Application

## Purpose
Express 5 REST API handling HTTP requests.

## Rules
- Composition Root: Instantiates infrastructure drivers from `@health-vitals/infra` and injects them into `core` services inside `container.ts`.
- Feature-Oriented: Code is grouped by business feature in `src/features/`.
- Validation: All inputs are validated via Zod schemas from `@health-vitals/contracts`.
- Errors: Throws `AppError` subclasses from `@health-vitals/core`, handled by the global error middleware.
