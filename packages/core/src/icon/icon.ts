// Icons: what Rio's components draw where an icon goes. Rio ships none; the app brings them.
//
// - A component's icon slot takes the app's icon. Without one, the component draws the icon the
//   app registered for what that place does, its alias, such as `dropdown` for a select's arrow,
//   and without that, nothing.
// - An icon is SVG path data in a view box, an icon font's ligature (Material Symbols), or a class
//   an icon font's stylesheet draws (the Material Design Icons webfont). A string the app
//   registers is a name its `resolve` turns into one, as an icon font takes any of its names.
// - Icons are drawn for their look: assistive technology doesn't see them, and the components
//   name what they do. A ligature's name isn't text in the page, so it is neither read, selected,
//   nor found.
// - Right to left, the icons of an alias that points along the line (`MIRRORED_ICON_ALIASES`) are
//   drawn mirrored, so the app registers their left-to-right form. The app's own icons in slots
//   are drawn as the app gives them.

import type { PartAttrs, PartNode } from '../parts';

/**
 * What Rio's components draw an icon for on their own, by what it does: the arrow that opens a
 * select or a menu chip's list, or a date picker's month and year list (`dropdown`); the date
 * picker's previous and next month; its switches to the text input (`edit`) and back to the
 * calendar; the time picker's switches to the text input (`keyboard`), back to the dial (`clock`),
 * and back to the scroll fields (`swipe`); an input chip's remove button; a split button's menu
 * button (`menu`); a selected filter chip's checkmark (`check`); an item's arrow to its submenu
 * (`submenu`); and a full-screen dialog's close button (`close`).
 */
export const ICON_ALIASES = [
  'dropdown',
  'previous',
  'next',
  'edit',
  'calendar',
  'keyboard',
  'clock',
  'swipe',
  'remove',
  'menu',
  'check',
  'submenu',
  'close',
] as const;
export type IconAlias = (typeof ICON_ALIASES)[number];

/** The aliases whose icons point along the line, mirrored right to left */
export const MIRRORED_ICON_ALIASES: readonly IconAlias[] = ['previous', 'next', 'submenu'];

/** An icon to draw */
export type IconSource =
  /**
   * SVG path data, as from `@mdi/js`, in a view box (`0 0 24 24` by default). Paths given apart
   * are drawn as one.
   */
  | { type: 'svg'; path: string | readonly string[]; viewBox?: string }
  /**
   * An icon font's ligature: the icon's name, set in the font a class of its stylesheet applies,
   * as `material-symbols-outlined` for Material Symbols.
   */
  | { type: 'ligature'; name: string; className: string }
  /** Classes an icon font's stylesheet draws the icon with, as `mdi mdi-home` */
  | { type: 'class'; className: string };

/**
 * The app's icons, given once for all the components. `Value` is what an icon can be: an
 * `IconSource`, or more an adapter draws, as a framework's component.
 */
export interface IconRegistry<Value = IconSource> {
  /** The icons for what Rio's components draw on their own: an icon, or a name for `resolve`. */
  aliases?: Partial<Record<IconAlias, Value | string>>;
  /** Turns an icon's name into the icon, as an icon font does with any of its names. */
  resolve?: (name: string) => Value | undefined;
}

/** Every kind of `IconSource`, so a new one can't be left out of `isIconSource` */
const SOURCE_TYPES: Record<IconSource['type'], true> = { svg: true, ligature: true, class: true };

/** Whether a value is an `IconSource`, rather than an icon an adapter draws, as a component */
export function isIconSource(value: unknown): value is IconSource {
  if (typeof value !== 'object' || value === null) return false;
  const { type } = value as { type?: unknown };
  return typeof type === 'string' && Object.hasOwn(SOURCE_TYPES, type);
}

/** The icon the app gave for an alias, or none */
export function iconOfAlias<Value>(
  icons: IconRegistry<Value> | undefined,
  alias: IconAlias,
): Value | undefined {
  const icon = icons?.aliases?.[alias];
  return typeof icon === 'string' ? icons?.resolve?.(icon) : icon;
}

/** The icon the app's `resolve` gives for a name, or none */
export const iconOfName = <Value>(icons: IconRegistry<Value> | undefined, name: string) =>
  icons?.resolve?.(name);

/**
 * The icon to draw: the app's for `alias`, or else `icon` itself, a name `resolve` turns into an
 * icon when it is a string.
 */
export function iconOf<Value>(
  icons: IconRegistry<Value> | undefined,
  request: { icon?: Value | string; alias?: IconAlias },
): Value | undefined {
  if (request.alias) return iconOfAlias(icons, request.alias);
  return typeof request.icon === 'string' ? iconOfName(icons, request.icon) : request.icon;
}

export interface IconParts {
  /**
   * An `<svg>` for SVG paths, a `<span>` for an icon font, or the root of an icon the adapter
   * draws itself, sized by the place it sits in
   */
  root: () => PartAttrs;
  /** The `<path>` inside an `<svg>` */
  path: () => PartAttrs;
  /** The `<span>` inside a `<span>`, in the icon font, sized to its box */
  glyph: () => PartAttrs;
}

type IconPart = 'root' | 'path' | 'glyph';

/** An SVG icon's markup */
export const iconSvgSkeleton: PartNode<IconPart> = {
  part: 'root',
  tag: 'svg',
  children: [{ part: 'path', tag: 'path' }],
};

/** An icon font's markup: the box, and the glyph in it */
export const iconFontSkeleton: PartNode<IconPart> = {
  part: 'root',
  tag: 'span',
  children: [{ part: 'glyph', tag: 'span' }],
};

export interface IconApi {
  parts: IconParts;
  /** `iconSvgSkeleton` or `iconFontSkeleton`'s; none for an icon the adapter draws itself */
  skeleton: () => PartNode<IconPart> | undefined;
}

export interface IconOptions {
  /** The icon to draw, or `undefined` for one the adapter draws itself, as a component */
  source: () => IconSource | undefined;
  /** The alias the icon is drawn for, if it is one */
  alias?: () => IconAlias | undefined;
}

export function createIcon(options: IconOptions): IconApi {
  const source = () => options.source();
  const mirrored = () => {
    const alias = options.alias?.();
    return alias !== undefined && MIRRORED_ICON_ALIASES.includes(alias);
  };
  return {
    skeleton() {
      const s = source();
      if (!s) return undefined;
      return s.type === 'svg' ? iconSvgSkeleton : iconFontSkeleton;
    },
    parts: {
      root() {
        const s = source();
        // Only the attributes that apply, with no key left `undefined`: an adapter passes them on
        // to an icon component's root too, where `undefined` would take off the component's own
        // attribute, as its `viewBox`.
        return {
          class: 'rio-icon',
          ...(s?.type === 'svg' ? { viewBox: s.viewBox ?? '0 0 24 24' } : {}),
          'aria-hidden': 'true',
          'data-type': s?.type ?? 'component',
          ...(mirrored() ? { 'data-mirrored': '' } : {}),
        };
      },
      path() {
        const s = source();
        if (s?.type !== 'svg') return {};
        return { d: typeof s.path === 'string' ? s.path : s.path.join(' ') };
      },
      glyph() {
        const s = source();
        if (!s || s.type === 'svg') return {};
        return {
          class: s.className,
          'data-ligature': s.type === 'ligature' ? s.name : undefined,
        };
      },
    },
  };
}
