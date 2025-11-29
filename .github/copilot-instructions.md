# Copilot Instructions for Simple Start

This repository contains **Simple Start**, a Chrome browser extension providing a simple and modern start interface.

## Project Overview

- **Type**: Chrome Extension (with Firefox support)
- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Monorepo**: Turborepo with pnpm workspaces
- **Styling**: Tailwind CSS with custom configuration

## Project Structure

```
├── chrome-extension/    # Extension manifest and core configuration
├── packages/            # Shared packages (ui, storage, i18n, etc.)
├── pages/               # Extension pages (new-tab, popup, options, etc.)
└── tests/               # End-to-end tests
```

## Development Setup

### Prerequisites

- Node.js >= 18.19.1 (specified in `.nvmrc`)
- pnpm 9.9.0 (specified in `package.json`)

### Commands

```bash
pnpm install            # Install dependencies
pnpm dev                # Start development mode (Chrome)
pnpm dev:firefox        # Start development mode (Firefox)
pnpm build              # Build for production (Chrome)
pnpm build:firefox      # Build for production (Firefox)
pnpm lint               # Run ESLint
pnpm prettier           # Run Prettier
pnpm type-check         # Run TypeScript type checking
pnpm e2e                # Run end-to-end tests (Chrome)
pnpm e2e:firefox        # Run end-to-end tests (Firefox)
pnpm zip                # Build and create distribution zip
```

## Code Style Guidelines

### TypeScript

- Use consistent type imports: `import type { ... } from '...'`
- Follow the ESLint rules defined in `.eslintrc`

### Formatting (Prettier)

- No semicolons
- Single quotes for strings
- Trailing commas everywhere
- Arrow function parentheses: avoid around single parameters
- Print width: 120 characters

### React

- React is in JSX scope automatically (no need to import React)
- Follow React Hooks rules

## Testing

- End-to-end tests are located in `tests/e2e/`
- Run tests with `pnpm e2e` (Chrome) or `pnpm e2e:firefox` (Firefox)

## Browser Extension Specifics

- The `chrome` global is available in extension contexts (background scripts, popups, options pages)
- Manifest configuration is in `chrome-extension/manifest.js`
- Support both Chrome and Firefox builds via environment variables (`__FIREFOX__`)
