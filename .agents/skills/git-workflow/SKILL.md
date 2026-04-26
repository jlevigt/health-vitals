---
name: git-workflow
description: Standardized Git history maintenance, conventional commits, and atomic commit workflows. Use when preparing to commit changes, creating PRs, or when Git history consistency is required.
---

# Git Workflow

## Overview

This skill ensures that the monorepo maintains a high-quality, auditable Git history through the enforcement of Conventional Commits and Atomic Commit principles.

## Guidelines

### 1. Conventional Commits
All commit messages MUST follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:
`<type>[optional scope]: <description>`

#### Approved Types
- `feat`: A new feature for the user.
- `fix`: A bug fix for the user.
- `docs`: Documentation only changes.
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc).
- `refactor`: A code change that neither fixes a bug nor adds a feature.
- `perf`: A code change that improves performance.
- `test`: Adding missing tests or correcting existing tests.
- `build`: Changes that affect the build system or external dependencies.
- `ci`: Changes to CI configuration files and scripts.
- `chore`: Other changes that don't modify src or test files.

#### Scopes
Use package names or logical layers as scopes:
- `feat(api): add health check endpoint`
- `fix(web): correct dashboard alignment`
- `refactor(core): simplify error handling`

### 2. Atomic Commits
- **Single Logical Change**: Each commit should represent a single logical improvement or fix.
- **Implement + Test**: Always include implementation code and its corresponding tests in the same commit.
- **Do Not Mix**: Never mix a major refactor with a new feature implementation in one commit.

## Anti-Patterns
- ❌ `fix: multiple bugs fixed` (Not atomic)
- ❌ `refactor: cleanup code` (Vague description)
- ❌ `added stuff` (Missing conventional type)
- ❌ Commits with >20 files (Unless a global refactor/dependency update)

## Examples

### Before (Bad)
```bash
git commit -m "added login and fixed some styles in the header"
```

### After (Good)
```bash
git commit -m "feat(api): add login endpoint"
git commit -m "style(web): fix header alignment"
```
