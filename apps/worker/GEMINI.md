# Worker Application

## Purpose
Background job processor consuming messages from RabbitMQ. Handles AI extraction and PDF parsing.

## Rules
- Idempotency: All jobs MUST check for existing results before processing to handle duplicate message deliveries.
- Composition Root: Wires up infrastructure and core services in `container.ts`.
- Validation: Validates incoming RabbitMQ payloads using Zod schemas from `@health-vitals/contracts`.
