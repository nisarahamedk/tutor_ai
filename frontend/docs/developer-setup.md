# Developer Setup Guide

## Overview

This guide provides step-by-step instructions for setting up the AI Tutor development environment, including all necessary tools, dependencies, and configurations.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Development Environment](#development-environment)
4. [IDE Configuration](#ide-configuration)
5. [Testing Setup](#testing-setup)
6. [Performance Monitoring](#performance-monitoring)
7. [Debugging Tools](#debugging-tools)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- **Node.js**: Version 18.17+ or 20.4+
- **npm**: Version 9+ (or yarn/pnpm)
- **Git**: Latest version
- **VS Code**: Recommended IDE (or your preferred editor)

### Operating System Support

- **macOS**: 10.15+
- **Windows**: 10 (with WSL2 recommended)
- **Linux**: Ubuntu 18.04+, Debian 10+, or equivalent

### Browser Requirements (for testing)

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Initial Setup

### 1. Clone the Repository

```bash
# Clone the repository
git clone <repository-url>
cd ai-tutor-frontend

# Install dependencies
npm install
```

### 2. Environment Configuration

Create environment files:

```bash
# Copy environment templates
cp .env.example .env.local
cp .env.example .env.development
cp .env.example .env.production
```

### 3. Environment Variables

Configure the following environment variables in `.env.local`:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
API_SECRET_KEY=your-secret-key

# Database (if applicable)
DATABASE_URL=postgresql://user:password@localhost:5432/aitutor

# Authentication
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000

# Third-party Services
OPENAI_API_KEY=your-openai-key
ANALYTICS_API_KEY=your-analytics-key

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true
```

### 4. Install Additional Tools

```bash
# Install global tools
npm install -g typescript
npm install -g eslint
npm install -g prettier

# Install Playwright browsers
npx playwright install
```

## Development Environment

### Package Scripts

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "format": "prettier --write .",
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "analyze": "ANALYZE=true next build"
  }
}
```

### Development Server

```bash
# Start development server
npm run dev

# Start with specific port
npm run dev -- -p 3001

# Start with turbopack (faster)
npm run dev -- --turbo
```

### Database Setup (if applicable)

```bash
# Run database migrations
npm run db:migrate

# Seed development data
npm run db:seed

# Reset database
npm run db:reset
```

## IDE Configuration

### VS Code Extensions

Install these recommended extensions:

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "ms-playwright.playwright",
    "vitest.explorer",
    "bradlc.vscode-tailwindcss",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json"
  ]
}
```

### VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ],
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  }
}
```

### Launch Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    },
    {
      "name": "Next.js: debug full stack",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/next",
      "args": ["dev"],
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

## Testing Setup

### Unit Testing with Vitest

Configuration in `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    setupFiles: ['./src/test-utils/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test-utils/',
        '**/*.d.ts',
        '**/*.config.*',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### E2E Testing with Playwright

Configuration in `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Test Commands

```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run specific test file
npm run test src/components/Button.test.tsx

# Run tests matching pattern
npm run test -- --run --reporter=verbose chat
```

## Performance Monitoring

### Setup Performance Monitoring

```typescript
// src/lib/monitoring.ts
import { initializeWebVitals } from '@/monitoring/vitals';
import { initializeAnalytics } from '@/monitoring/analytics';
import { initializeServiceWorker } from '@/utils/service-worker';

export function initializeMonitoring() {
  // Initialize Web Vitals tracking
  initializeWebVitals();
  
  // Initialize user analytics
  initializeAnalytics();
  
  // Initialize service worker for offline support
  initializeServiceWorker();
}
```

### Performance Testing

```bash
# Run Lighthouse CI
npm run lighthouse

# Analyze bundle size
npm run analyze

# Performance testing with Playwright
npm run test:e2e -- --grep "performance"
```

## Debugging Tools

### React Developer Tools

Install browser extensions:
- React Developer Tools
- Redux DevTools (if using Redux)
- React Hook Form DevTools

### Next.js Debugging

```typescript
// next.config.js - Enable debugging
const nextConfig = {
  experimental: {
    instrumentationHook: true,
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};
```

### Custom Debug Utilities

```typescript
// src/lib/debug.ts
export const debug = {
  log: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${message}`, data);
    }
  },
  
  error: (message: string, error?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[ERROR] ${message}`, error);
    }
  },
  
  performance: (label: string, fn: () => any) => {
    if (process.env.NODE_ENV === 'development') {
      console.time(label);
      const result = fn();
      console.timeEnd(label);
      return result;
    }
    return fn();
  },
};
```

### Network Debugging

```typescript
// src/lib/api-debug.ts
export function debugApiCall(url: string, options: RequestInit) {
  if (process.env.NODE_ENV === 'development') {
    console.group(`API Call: ${options.method || 'GET'} ${url}`);
    console.log('Options:', options);
    console.log('Headers:', options.headers);
    if (options.body) {
      console.log('Body:', options.body);
    }
    console.groupEnd();
  }
}
```

## Deployment

### Build Process

```bash
# Type check
npm run type-check

# Lint code
npm run lint

# Run tests
npm run test

# Build application
npm run build

# Test production build locally
npm run start
```

### Environment-Specific Builds

```bash
# Development build
NODE_ENV=development npm run build

# Production build
NODE_ENV=production npm run build

# Staging build with debugging
NODE_ENV=production DEBUG=true npm run build
```

### Docker Setup (optional)

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### Deployment Checklist

- [ ] Environment variables configured
- [ ] Build passes without errors
- [ ] All tests pass
- [ ] Performance metrics meet targets
- [ ] Accessibility compliance verified
- [ ] Security headers configured
- [ ] Monitoring setup verified

## Troubleshooting

### Common Issues

#### Node.js Version Conflicts

```bash
# Check Node.js version
node --version

# Use nvm to manage versions
nvm install 18
nvm use 18
```

#### Package Installation Issues

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Use specific registry
npm install --registry https://registry.npmjs.org/
```

#### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Clear TypeScript cache
rm -rf .tsbuildinfo

# Check for TypeScript errors
npm run type-check
```

#### Port Conflicts

```bash
# Find process using port 3000
lsof -ti:3000

# Kill process
kill -9 $(lsof -ti:3000)

# Use different port
npm run dev -- -p 3001
```

### Performance Issues

```bash
# Analyze bundle size
npm run analyze

# Check for memory leaks
node --inspect npm run dev

# Profile React components
# Use React DevTools Profiler
```

### Testing Issues

```bash
# Clear test cache
npm run test -- --clearCache

# Run tests with verbose output
npm run test -- --reporter=verbose

# Update snapshots
npm run test -- -u
```

## Development Workflow

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/new-feature

# Stage changes
git add .

# Commit with conventional message
git commit -m "feat: add new chat functionality"

# Push branch
git push origin feature/new-feature

# Create pull request
```

### Code Quality Checks

```bash
# Run all quality checks
npm run lint && npm run type-check && npm run test

# Pre-commit hook setup
npx husky install
npx husky add .husky/pre-commit "npm run lint-staged"
```

### Daily Development Commands

```bash
# Start development session
npm run dev

# Run tests in watch mode (separate terminal)
npm run test:watch

# Check for TypeScript errors
npm run type-check

# Format code
npm run format
```

## Additional Resources

### Documentation Links

- [Next.js Documentation](https://nextjs.org/docs)
- [React 19 Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)

### Useful Commands Reference

```bash
# Package management
npm install <package>              # Install package
npm install <package> --save-dev   # Install dev dependency
npm update                         # Update all packages
npm audit                          # Check for vulnerabilities

# Development
npm run dev                        # Start dev server
npm run build                      # Build for production
npm run start                      # Start production server
npm run lint                       # Run linter
npm run test                       # Run tests

# Debugging
npm run dev -- --inspect          # Enable Node.js inspector
npm run build -- --debug          # Build with debug info
```

This setup guide should get you up and running with the AI Tutor development environment. If you encounter any issues not covered here, please check the troubleshooting section or reach out to the development team.