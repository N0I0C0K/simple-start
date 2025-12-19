# Contributing to NextTab

Thank you for your interest in contributing to NextTab! This document provides guidelines and requirements for contributing to the project.

## Getting Started

### Prerequisites

- **Node.js**: >= 18.19.1 (see `.nvmrc`)
- **pnpm**: 9.9.0 (required)
- **Git**: For version control

### Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/NextTab.git`
3. Install dependencies: `pnpm install`
4. Create a new branch: `git checkout -b your-feature-branch`

## Development Workflow

### Running the Extension

```bash
# Start development mode (Chrome)
pnpm dev

# Start development mode (Firefox)
pnpm dev:firefox

# Build for production
pnpm build
```

### Code Quality

Before submitting a Pull Request, ensure your code passes all quality checks:

```bash
# Run linting
pnpm lint

# Run type checking
pnpm type-check

# Run formatting check
pnpm prettier
```

## Required Status Checks

All Pull Requests must pass the following checks before merging:

### 1. **ESLint (Lint Check)** ✅ **REQUIRED**
- Ensures code quality and adherence to coding standards
- Workflow: `.github/workflows/lint.yml`
- Job: `eslint`

### 2. **TypeScript Type Check** ✅ **REQUIRED**
- Validates TypeScript types across the monorepo
- Workflow: `.github/workflows/type-check.yml`
- Job: `type-check`

### 3. **Prettier (Formatting)** ✅ **REQUIRED**
- Ensures consistent code formatting
- Workflow: `.github/workflows/prettier.yml`
- Job: `prettier`

These checks run automatically on every Pull Request and must all pass before the PR can be merged.

## Pull Request Process

1. **Create a descriptive branch name**: `feature/your-feature` or `fix/your-bugfix`
2. **Make your changes**: Follow the existing code style and conventions
3. **Run all checks locally**: `pnpm lint && pnpm type-check && pnpm prettier`
4. **Commit your changes**: Use clear, descriptive commit messages
5. **Push to your fork**: `git push origin your-feature-branch`
6. **Open a Pull Request**: Use the PR template and fill in all required sections
7. **Wait for CI checks**: All required checks must pass
8. **Address review feedback**: Make changes if requested by reviewers
9. **Merge**: Once approved and all checks pass, your PR will be merged

## Code Style

- **TypeScript**: Use strict type checking
- **Imports**: Use type-only imports where applicable (`import type { ... }`)
- **Formatting**: Prettier with single quotes, no semicolons
- **Tailwind CSS**: Use `cn()` utility for class merging
- **Components**: Follow the existing component structure

## Monorepo Structure

```
chrome-extension/     # Core extension
pages/               # Extension UI pages
packages/            # Shared packages
  shared/           # Common utilities
  storage/          # Chrome storage abstraction
  ui/               # Reusable UI components
  i18n/             # Internationalization
```

## Testing

```bash
# Run E2E tests (Chrome)
pnpm e2e

# Run E2E tests (Firefox)
pnpm e2e:firefox
```

## Questions?

If you have questions or need help:
- Check the [copilot instructions](.github/copilot-instructions.md)
- Open an issue for discussion
- Review existing PRs for examples

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
