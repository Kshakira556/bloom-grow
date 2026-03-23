import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Only mock modules if running in Vitest
if (typeof process !== "undefined" && process.env.VITEST) {
  // Mock problematic modules
  vi.mock("react-big-calendar/lib/css/react-big-calendar.css", () => ({}));
  vi.mock("file-saver", () => ({
    saveAs: vi.fn(),
  }));
}

// Polyfills for components that rely on browser APIs not implemented in jsdom
if (typeof window !== "undefined") {
  if (!window.matchMedia) {
    window.matchMedia = (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    });
  }

  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  if (!window.ResizeObserver) {
    window.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
  }

  if (!Element.prototype.scrollTo) {
    (Element.prototype as unknown as { scrollTo: () => void }).scrollTo = () => {};
  }
}