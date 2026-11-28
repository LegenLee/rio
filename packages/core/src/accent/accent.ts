/**
 * A color of the theme with an accent color's four roles: `primary`, `secondary`, `tertiary`,
 * `error`, or the name of a static color the theme adds (`staticColors` in `@rio-m3e/tokens`), as
 * `success`. The theme writes each as `--rio-color-<name>`, `-on-<name>`, `-<name>-container`, and
 * `-on-<name>-container`, with a camelCase name in kebab-case. Another role of the theme, as
 * `surface`, has only some of the four, and mixes with the spec's colors.
 */
export type AccentColor = 'primary' | 'secondary' | 'tertiary' | 'error' | (string & {});

/** A name the theme can write, camelCase or kebab-case: nothing else reaches a style. */
const NAME = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/**
 * The accent variables for `color`, as a part's `style`: `--rio-accent`, `--rio-on-accent`,
 * `--rio-accent-container`, and `--rio-on-accent-container`, the four roles of the color it names.
 * Stylesheets draw a component's accent through them, with the spec's roles as fallbacks, and the
 * elements inside inherit them. Nothing without a color, or for a name the theme can't write.
 */
export function accentStyle(color: AccentColor | undefined): string | undefined {
  if (color === undefined) return undefined;
  const name = kebab(color);
  if (!NAME.test(name)) return undefined;
  return [
    `--rio-accent: var(--rio-color-${name})`,
    `--rio-on-accent: var(--rio-color-on-${name})`,
    `--rio-accent-container: var(--rio-color-${name}-container)`,
    `--rio-on-accent-container: var(--rio-color-on-${name}-container)`,
  ].join('; ');
}
