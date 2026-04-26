# Infrastructure Layer

## Purpose
Concrete implementations of external ports (PostgreSQL, RabbitMQ, S3/MinIO, Gemini AI, Resend/Nodemailer).

## Rules
- Depends on `@health-vitals/core` and `@health-vitals/contracts`.
- Implements interfaces defined in the `core` package.
- This is the ONLY package allowed to import database SDKs (e.g., `pg`), message broker SDKs (e.g., `amqplib`), or AI SDKs.
