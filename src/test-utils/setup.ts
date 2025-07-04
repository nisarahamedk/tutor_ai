import '@testing-library/jest-dom/vitest'; // Or just '@testing-library/jest-dom' if using Vitest's expect
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll } from 'vitest';
import { server } from './mock-server'; // This file will be created next

// Setup MSW
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' })); // Added onUnhandledRequest based on common MSW v2 best practice
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());
