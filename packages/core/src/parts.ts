/**
 * The attributes of one part of a component's markup, in HTML form: names as HTML spells them
 * (`class`, `aria-pressed`, `data-size`) and string values, with `undefined` leaving an attribute
 * out. Each component's `parts` returns one of these per part. See "Core output" in
 * `docs/conventions.md`.
 */
export type PartAttrs = Record<string, string | undefined>;
