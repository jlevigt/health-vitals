# Contracts Layer

## Purpose
Contains pure TypeScript types, interfaces, and Zod schemas.

## Rules
- MUST NOT have any external dependencies (except `zod`).
- MUST NOT contain business logic or runtime code.
- All HTTP request/response schemas, DB models, and Queue payload types belong here.
