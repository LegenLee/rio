/**
 * The attributes of one part of a component's markup, in HTML form: names as HTML spells them
 * (`class`, `aria-pressed`, `data-size`) and string values, with `undefined` leaving an attribute
 * out. Each component's `parts` returns one of these per part. See "Core output" in
 * `docs/conventions.md`.
 */
export type PartAttrs = Record<string, string | undefined>;

/**
 * An event a component's handler (`handleClick`) takes: a DOM event, or a framework's own, such
 * as React's synthetic events. Core only cancels it, and hands the same event back to the adapter
 * (`onClick`), so components are generic over its type, with `MouseEvent` as the default.
 */
export interface CancelableEvent {
  preventDefault(): void;
}

/**
 * One node of a component's skeleton: the markup an adapter renders, part by part. Adapters
 * render it their own way; contract tests check what they rendered against it. Each component
 * exports its skeleton (`buttonSkeleton`, `switchSkeleton`, ...).
 *
 * `Part` narrows the names to the component's parts, so a typo fails the build. `When` lists the
 * decisions the skeleton may use; leave it out when every part always renders. Skeletons are
 * shared objects, so everything is read-only.
 */
export interface PartNode<Part extends string = string, When extends string = never> {
  /** The part, named as in the component's `parts`. */
  readonly part: Part;
  /** The element the part is, as `tagName` in lower case. */
  readonly tag: keyof HTMLElementTagNameMap;
  /**
   * The component API's decision that says whether the part renders, such as `'showsIcon'`.
   * Without it, the part always renders.
   */
  readonly when?: When;
  /**
   * Content from the app (slots, children) goes inside. The content itself isn't checked against
   * the skeleton; where a component picks between contents, its contract test checks the pick.
   */
  readonly content?: true;
  readonly children?: readonly PartNode<Part, When>[];
}

/**
 * ARIA attributes that hold a list of ids, where the app's and the part's add up. `aria-errormessage`
 * holds one id in ARIA 1.2 and a list in 1.3.
 */
const ID_LISTS = new Set([
  'aria-controls',
  'aria-describedby',
  'aria-details',
  'aria-errormessage',
  'aria-flowto',
  'aria-labelledby',
  'aria-owns',
]);

/**
 * Puts a part's attributes over the ones the app gave the same element, for an adapter that passes
 * the app's attributes to an element of the component's own (see "Core output" in
 * docs/conventions.md):
 * - An attribute the part leaves out (`undefined`) keeps the app's value.
 * - One the part sets wins, except an id list (`aria-describedby`, `aria-labelledby`, ...), which
 *   takes the app's ids first and then the part's, each once.
 * - Everything else the app gave, such as listeners, passes through.
 *
 * `class` and `style` aren't merged: a part's `class` replaces the app's. Leave them out of `app`
 * and merge them the framework's way, as Vue does with `:class` next to `v-bind`.
 */
export function mergePartAttrs(
  app: Readonly<Record<string, unknown>>,
  part: PartAttrs,
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...app };
  for (const [name, value] of Object.entries(part)) {
    const own = app[name];
    if (value === undefined) {
      if (own === undefined || own === null) merged[name] = undefined;
    } else if (ID_LISTS.has(name) && typeof own === 'string') {
      const ids = [...own.split(/\s+/), ...value.split(/\s+/)].filter(Boolean);
      merged[name] = [...new Set(ids)].join(' ');
    } else {
      merged[name] = value;
    }
  }
  return merged;
}
