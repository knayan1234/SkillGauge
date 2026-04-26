import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";

// Node 24+ ships an experimental global `localStorage` that lacks clear()/removeItem() and
// shadows jsdom's full Storage. This polyfill restores real Storage semantics under Jest.
class MemoryStorage {
  private store = new Map<string, string>();
  get length() {
    return this.store.size;
  }
  clear() {
    this.store.clear();
  }
  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null;
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
  setItem(key: string, value: string) {
    this.store.set(key, String(value));
  }
}

Object.defineProperty(globalThis, "localStorage", {
  value: new MemoryStorage(),
  writable: true,
  configurable: true,
});
Object.defineProperty(globalThis, "sessionStorage", {
  value: new MemoryStorage(),
  writable: true,
  configurable: true,
});

// jsdom doesn't ship ResizeObserver; recharts (used by ScoreRadial) hard-requires it.
// Minimal stub — noop methods are enough because we don't assert on chart geometry in
// tests; we only care that the component renders without throwing.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
Object.defineProperty(globalThis, "ResizeObserver", {
  value: ResizeObserverStub,
  writable: true,
  configurable: true,
});

// jsdom's matchMedia is undefined too; sonner (Toaster) probes it for reduced-motion
// preference. Always-false stub so toasts behave normally in tests.
Object.defineProperty(globalThis, "matchMedia", {
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
  writable: true,
  configurable: true,
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});
