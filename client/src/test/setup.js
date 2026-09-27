/**
 * client/src/test/setup.js
 * Vitest setup — runs before each test file (see vitest.config.js `setupFiles`).
 *
 * Two jobs:
 *  1. jest-dom matchers for @testing-library assertions.
 *  2. Minimal jsdom polyfills for globals some components touch at render time.
 *
 * This changes the *harness environment*, never test assertions.
 */
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// --- jsdom gaps that some components touch at import/render time ---
if (!window.matchMedia) {
  window.matchMedia = () => ({
    matches: false,
    media: '',
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
if (!window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
if (!window.scrollTo) {
  window.scrollTo = () => {};
}

afterEach(() => {
  cleanup();
});
