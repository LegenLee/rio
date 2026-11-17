import { afterEach, describe, expect, test, vi } from 'vitest';
import { createTypeahead, TYPEAHEAD_MS } from './typeahead';

const LABELS = ['Cut', 'Copy', 'Paste', ' delete '];

describe('createTypeahead', () => {
  afterEach(() => vi.useRealTimers());

  test('a letter moves to the next label that starts with it, from the current one on', () => {
    const search = createTypeahead();
    expect(search.find('p', LABELS, 0)).toBe(2);
  });

  test('repeating one letter cycles through its labels', () => {
    const search = createTypeahead();
    expect(search.find('c', LABELS, -1)).toBe(0);
    expect(search.find('c', LABELS, 0)).toBe(1);
    expect(search.find('c', LABELS, 1)).toBe(0);
  });

  test('letters typed together add up, and may match the current label', () => {
    const search = createTypeahead();
    expect(search.find('C', LABELS, 1)).toBe(0);
    expect(search.find('o', LABELS, 0)).toBe(1);
    expect(search.find('p', LABELS, 1)).toBe(1);
  });

  test('labels are trimmed and compared without case', () => {
    expect(createTypeahead().find('D', LABELS, -1)).toBe(3);
  });

  test('nothing matches: -1', () => {
    expect(createTypeahead().find('x', LABELS, 0)).toBe(-1);
  });

  test('a pause starts a new search, and ends typing', () => {
    vi.useFakeTimers();
    const search = createTypeahead();
    expect(search.typing()).toBe(false);
    search.find('c', LABELS, -1);
    expect(search.typing()).toBe(true);
    vi.advanceTimersByTime(TYPEAHEAD_MS + 1);
    expect(search.typing()).toBe(false);
    // Not "cp": a new search for "p"
    expect(search.find('p', LABELS, 0)).toBe(2);
  });

  test('reset forgets the search', () => {
    const search = createTypeahead();
    search.find('c', LABELS, -1);
    search.reset();
    expect(search.typing()).toBe(false);
    expect(search.find('o', LABELS, -1)).toBe(-1);
  });
});
