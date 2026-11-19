import { afterEach, describe, expect, test, vi } from 'vitest';
import { prefersReducedMotion } from './reduced-motion';

const prefers = (reduce: boolean) =>
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: reduce && query === '(prefers-reduced-motion: reduce)',
  }));

afterEach(() => vi.unstubAllGlobals());

describe('prefersReducedMotion', () => {
  test('follows the reduced motion media query', () => {
    prefers(true);
    expect(prefersReducedMotion()).toBe(true);
    prefers(false);
    expect(prefersReducedMotion()).toBe(false);
  });

  test('without matchMedia, as on a server, no', () => {
    vi.stubGlobal('matchMedia', undefined);
    expect(prefersReducedMotion()).toBe(false);
  });
});
