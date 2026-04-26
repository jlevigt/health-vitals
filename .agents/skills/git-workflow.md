# Skill: Git Workflow & Commit Standards

## Context
Standardized Git history is essential for auditability, automated changelogs, and collaborative efficiency in a monorepo. This skill ensures that AI agents and human contributors maintain a high-quality commit log.

## Pattern: Conventional Commits
All commits must follow this structure:
`<type>[optional scope]: <description>`

### Approved Types
- `feat`: A new feature for the user, not a new feature for builds or internal programs.
- `fix`: A bug fix for the user, not a fix to a build script.
- `docs`: Changes to documentation.
- `style`: Formatting, missing semi-colons, etc.; no production code change.
- `refactor`: Refactoring production code, e.g. renaming a variable.
- `test`: Adding missing tests, refactoring tests; no production code change.
- `chore`: Updating grunt tasks etc.; no production code change.
- `perf`: A code change that improves performance.
- `ci`: Changes to CI configuration files and scripts.
- `build`: Changes that affect the build system or external dependencies.

### Scopes
Use package names or logical layers as scopes:
- `feat(api): ...`
- `fix(web): ...`
- `refactor(core): ...`

## Pattern: Atomic Commits
- **One change per commit**: Do not mix a refactor with a new feature.
- **Implement + Test**: Always include tests for a new feature or bug fix in the same commit.
- **Buildability**: Every commit should leave the codebase in a buildable state.

## Anti-Patterns
- ❌ `fix: multiple bugs fixed` (Not atomic)
- ❌ `refactor: cleanup code` (Vague description)
- ❌ `added stuff` (Missing conventional type)
- ❌ Commits with >20 files (Too large, hard to review)

## Example
### Before (Bad)
```bash
git commit -m "added login and fixed some styles in the header"
```

### After (Good)
```bash
git commit -m "feat(api): add login endpoint"
git commit -m "style(web): fix header alignment"
```
