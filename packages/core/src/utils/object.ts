/** What `resolveProps` returns: a prop that has a default is never `undefined`. */
export type ResolvedProps<D extends object, P extends object> = Omit<P, keyof D> & {
  [K in keyof D]: K extends keyof P ? Exclude<P[K], undefined> | D[K] : D[K];
};

/**
 * The props over the defaults, as every component's API reads its props. A prop that is
 * `undefined`, as an adapter may pass one the app left out, takes the default, as a missing one
 * does; `null`, `false`, `0`, and `''` are values and stay.
 */
export function resolveProps<D extends object, P extends object>(
  defaults: D,
  props: P,
): ResolvedProps<D, P> {
  const own = Object.entries(props).filter(([, value]) => value !== undefined);
  return { ...defaults, ...Object.fromEntries(own) } as ResolvedProps<D, P>;
}
