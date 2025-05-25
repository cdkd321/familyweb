import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
    key: (index) => Object.keys(store)[index] || null,
    get length() {
      return Object.keys(store).length;
    }
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock Vue Router
const mockRouterPush = vi.fn();
const mockRouterReplace = vi.fn(); // If you use router.replace
const mockRouterCurrentRoute = { value: { meta: {} } }; // Mock currentRoute if needed by guards or store logic

vi.mock('vue-router', async () => {
  const actual = await vi.importActual('vue-router'); // Import actual to extend
  return {
    ...actual, // Spread actual exports
    useRouter: () => ({
      push: mockRouterPush,
      replace: mockRouterReplace,
      // currentRoute: mockRouterCurrentRoute, // Add if router.currentRoute is used in stores
    }),
    // If you directly import createRouter, createWebHistory etc. and need to mock them:
    // createRouter: vi.fn().mockReturnValue({ beforeEach: vi.fn(), push: mockRouterPush, replace: mockRouterReplace }),
    // createWebHistory: vi.fn()
  };
});

// Global beforeEach to clear mocks
beforeEach(() => {
  localStorage.clear();
  mockRouterPush.mockClear();
  mockRouterReplace.mockClear();
  // Reset currentRoute if it's mutable and used
  // mockRouterCurrentRoute.value = { meta: {} }; 
});

// If Axios is used across many store tests, you might consider a global mock setup here too,
// but often it's clearer to mock it per-test-file or per-describe-block for specific endpoint responses.
// vi.mock('axios'); // This would make it globally mocked.
```
