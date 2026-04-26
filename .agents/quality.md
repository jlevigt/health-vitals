# Project-Specific Quality Gates

## 1. Strict TypeScript
- All packages must build with `tsc` without errors.
- `any` is strictly prohibited in new code; use generics or proper types.

## 2. Error Handling
- Never swallow errors silently.
- Always use the custom `AppError` hierarchy (`NotFoundError`, `ValidationError`, etc.) from `@health-vitals/core/errors`.
- Pass errors down to the outermost catch block (Express error middleware or Worker global handler).

## 3. Monorepo Discipline
- Apps must NEVER import from each other.
- Shared utilities and domains must be placed in `packages/*`.
- Only explicitly defined public exports from `src/index.ts` can be consumed across workspace boundaries.

## 4. Environment Variables
- `process.env` MUST NOT be used directly outside of `packages/core/src/config/env.ts`.
- Always import the validated `env` object from `@health-vitals/core/config`.

## 5. Testing
- Fixes MUST include tests.
- Tests should assert edge cases and not just the happy path.
