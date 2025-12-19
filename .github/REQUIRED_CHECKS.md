# Required Status Checks Configuration

This document specifies the required status checks that must pass before a Pull Request can be merged into the `main` branch.

## Required Checks

The following GitHub Actions workflows must complete successfully before merging:

### 1. Lint Check (ESLint)
- **Workflow**: `.github/workflows/lint.yml`
- **Job Name**: `eslint`
- **Description**: Runs ESLint to check code quality and coding standards
- **Command**: `pnpm lint`

### 2. Type Check
- **Workflow**: `.github/workflows/type-check.yml`
- **Job Name**: `type-check`
- **Description**: Runs TypeScript type checking across the monorepo
- **Command**: `pnpm type-check`

### 3. Prettier Check
- **Workflow**: `.github/workflows/prettier.yml`
- **Job Name**: `prettier`
- **Description**: Validates code formatting using Prettier
- **Command**: Prettier validation

## Setting Up Branch Protection

To enforce these required checks, a repository administrator should:

1. Go to **Settings** → **Branches** → **Branch protection rules**
2. Add or edit the rule for the `main` branch
3. Enable **Require status checks to pass before merging**
4. Enable **Require branches to be up to date before merging** (recommended)
5. Search for and select the following status checks:
   - `eslint`
   - `type-check`
   - `prettier`

## Additional Recommended Checks

While not strictly required for code quality, these checks are also recommended:

- **Build And Upload Extension Zip Via Artifact** (`build`)
- **E2E tests for Chrome** (`chrome`)
- **E2E tests for Firefox** (`firefox`)

## For Contributors

Before submitting a Pull Request, ensure that all checks pass locally:

```bash
# Run linting
pnpm lint

# Run type checking
pnpm type-check

# Run prettier formatting
pnpm prettier

# Run all checks together
pnpm lint && pnpm type-check && pnpm prettier
```

## Automatic Enforcement

These checks will run automatically on every Pull Request. The PR cannot be merged until all required checks pass. If a check fails:

1. Review the error messages in the GitHub Actions logs
2. Fix the issues locally
3. Commit and push the changes
4. The checks will automatically re-run

## Notes

- The lint check runs with `--fix` flag in CI, but will still fail if there are unfixable issues
- Type checking ensures TypeScript compilation succeeds across the entire monorepo
- Prettier validation ensures consistent code formatting
