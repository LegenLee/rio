// The selection rules of a group whose items are chosen one at a time or any number at a time:
// button groups, chip sets, lists, menus, and selects.

/** Whether a group's items can be selected: none, one at a time, or any number. */
export type GroupSelection = 'none' | 'single' | 'multiple';

/** A group's selected value (`single`) or values (`multiple`), as a list */
export const selectedValues = <V>(selected: V | V[] | undefined): V[] =>
  selected === undefined ? [] : Array.isArray(selected) ? selected : [selected];

/**
 * The selection after turning `value` on or off: a single selection turns the previous value off,
 * and `required` keeps the last one on. `undefined` when nothing changes.
 */
export function nextSelection<V>(
  p: { selection: GroupSelection; required?: boolean; selected?: V | V[] },
  value: V,
  on: boolean,
): { selected: V | V[] | undefined } | undefined {
  if (p.selection === 'none') return undefined;
  const current = selectedValues(p.selected);
  if (current.includes(value) === on) return undefined;
  if (!on && p.required && current.length === 1) return undefined;
  if (p.selection === 'single') return { selected: on ? value : undefined };
  return { selected: on ? [...current, value] : current.filter((other) => other !== value) };
}
