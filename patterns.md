# Project Patterns

This document captures the architectural and coding patterns extracted from the `health-vitals` project. These patterns promote modularity, testability, and scalability.

## 1. Shared Infrastructure Monorepo Pattern
Infrastructure concerns (Database, Logger, Queue, Storage, Mail, LLM) are extracted into a `packages/shared` package.
- **Why**: Ensures consistency across different apps (API, Worker) and prevents duplication.
- **Implementation**: Each concern has an interface and one or more implementations (e.g., `Logger` interface with `PinoLogger` implementation).

## 2. Dependency Container Pattern
A central `container.ts` in each application manages the lifecycle and initialization of infrastructure dependencies.
- **Why**: Provides a single place to configure dependencies and simplifies their retrieval throughout the app.
- **Implementation**: Exports singleton instances or factory functions for shared resources like the database pool or logger.

## 3. Feature-Oriented API Structure
The API is organized by business features rather than technical layers (e.g., `features/auth/login`).
- **Why**: Improves discoverability and keeps related code (routes, controllers, services, types) together.
- **Implementation**: Each feature folder contains its own `routes.ts`, `controller.ts`, `service.ts`, and `types.ts`.

## 4. Service Layer Pattern
Business logic is encapsulated in class-based services.
- **Why**: Decouples business logic from HTTP/Transport details, making it easier to test and reuse.
- **Implementation**: Services typically expose a single public `execute` method and receive their dependencies via the constructor.

## 5. Manual Dependency Injection
Dependencies are passed explicitly into constructors or as function arguments.
- **Why**: Simplifies unit testing by allowing easy mocking of dependencies without complex DI frameworks.
- **Implementation**: `const service = new AuthenticateUserService(db, logger);`

## 6. Boundary Validation with Zod
Schema validation is performed at the entry points of the application (API requests, Worker job payloads).
- **Why**: Ensures data integrity and provides TypeScript type safety at runtime.
- **Implementation**: `const data = schema.parse(req.body);`

## 7. Standardized Error Handling
A custom error hierarchy (extending `AppError`) is used to represent different failure modes.
- **Why**: Enables consistent error responses and simplified error handling logic.
- **Implementation**: Services throw specific errors like `NotFoundError` or `UnauthorizedError`, which are caught by a global error middleware.

## 8. Async Task Offloading (Worker Pattern)
Long-running or resource-intensive tasks are offloaded to a background worker via a message queue.
- **Why**: Keeps the API responsive and allows for independent scaling of processing logic.
- **Implementation**: The API publishes a job to RabbitMQ; a separate `apps/worker` consumes and processes the job.

## 9. Environment Variable Centralization
Environment variables are managed, validated, and exported from a central `env.ts` file.
- **Why**: Prevents runtime errors due to missing configuration and provides a typed configuration object.
- **Implementation**: Uses a validation library (or simple checks) to ensure all required `process.env` variables are present at startup.

## 10. SQL-Based Migrations
Database schema changes are managed via versioned SQL files.
- **Why**: Provides a clear history of schema changes and ensures consistent environments across development and production.
- **Implementation**: Incremental SQL files stored in `packages/shared/db/migrations`.

## 11. API Mocking for Frontend Development
Mock Service Worker (MSW) is used to intercept network requests and return mock data during development and testing.
- **Why**: Enables frontend development to proceed independently of the backend and ensures reliable tests.
- **Implementation**: Mock handlers defined in `apps/web/src/mocks/handlers.ts` and integrated into the browser/test environment.

## 12. Component-Based Frontend Architecture
The frontend is built using reusable React components organized by responsibility (layout, common components, pages).
- **Why**: Promotes UI consistency and code reuse.
- **Implementation**: Components stored in `apps/web/src/components` and `apps/web/src/pages`.

## 13. Colocated Tests
Tests are located in `__tests__` directories adjacent to the code they verify.
- **Why**: Makes it easier to find and maintain tests for a given piece of functionality.
- **Implementation**: `apps/api/src/__tests__`, `apps/worker/src/__tests__`, etc.

## 14. Multi-Stage Docker Builds
Dockerfiles use multi-stage builds to optimize image size and security.
- **Why**: Produces lean production images by excluding build-only dependencies.
- **Implementation**: `apps/api/Dockerfile`, `apps/worker/Dockerfile`.

## 15. Centralized Development Workflow
The root `package.json` provides a single entry point for managing the entire stack during development.
- **Why**: Simplifies the onboarding process and provides a consistent way to run different parts of the system.
- **Implementation**: Root scripts for starting the API, Worker, Web (mocked or real), and managing infrastructure/migrations using Bun and Docker Compose.
