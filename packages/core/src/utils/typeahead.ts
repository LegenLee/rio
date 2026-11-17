// Moving to an item by typing the start of its label, as menus and lists of options do.
//
// - Characters typed within `TYPEAHEAD_MS` of each other add up to one search.
// - Repeating one letter cycles through the items that start with it.
// - A single letter looks from the item after the current one; a longer search may still match
//   the current one.
// - Labels are compared trimmed, without case.

/** How long typed characters add up to one search */
export const TYPEAHEAD_MS = 500;

export interface Typeahead {
  /**
   * Adds a typed character to the search, and returns the index of the item it moves to, or -1
   * when no label matches. `current` is the index of the item the search starts from, or -1.
   */
  find(key: string, labels: readonly string[], current: number): number;
  /** Whether characters typed a moment ago still add up, so a space is part of the search */
  typing(): boolean;
  /** Forgets the search, as when the list closes. */
  reset(): void;
}

export function createTypeahead(): Typeahead {
  let typed = '';
  let typedAt = 0;
  const typing = () => typed !== '' && performance.now() - typedAt <= TYPEAHEAD_MS;

  return {
    find(key, labels, current) {
      const letter = key.toLowerCase();
      typed = typing() ? typed + letter : letter;
      typedAt = performance.now();
      const search = [...typed].every((each) => each === typed[0]) ? typed[0]! : typed;
      const start = Math.max(current + (search.length === 1 ? 1 : 0), 0);
      for (let step = 0; step < labels.length; step++) {
        const index = (start + step) % labels.length;
        if (labels[index]!.trim().toLowerCase().startsWith(search)) return index;
      }
      return -1;
    },
    typing,
    reset() {
      typed = '';
    },
  };
}
