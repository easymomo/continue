// This file will be executed before each test
// Add any global setup code here

// Import necessary utilities from vitest
import { afterEach, beforeEach, vi } from "vitest";

// Reset all mocks after each test
afterEach(() => {
  vi.resetAllMocks();
  vi.clearAllMocks();
});

// Global test environment setup
beforeEach(() => {
  // Add any before test setup here
});
