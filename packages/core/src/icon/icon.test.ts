import { describe, expect, test } from 'vitest';
import {
  ICON_ALIASES,
  MIRRORED_ICON_ALIASES,
  createIcon,
  iconOf,
  iconFontSkeleton,
  iconOfAlias,
  iconOfName,
  iconSvgSkeleton,
  isIconSource,
  type IconRegistry,
  type IconSource,
} from './icon';

const check: IconSource = { type: 'svg', path: 'M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z' };
const ligature = (name: string): IconSource => ({
  type: 'ligature',
  name,
  className: 'material-symbols-outlined',
});

describe('the app’s icons', () => {
  test('an alias’s icon, or the one its name resolves to, or none', () => {
    const icons: IconRegistry = {
      aliases: { check, dropdown: 'arrow_drop_down' },
      resolve: ligature,
    };
    expect(iconOfAlias(icons, 'check')).toBe(check);
    expect(iconOfAlias(icons, 'dropdown')).toEqual(ligature('arrow_drop_down'));
    // An alias the app left out isn't taken for a name.
    expect(iconOfAlias(icons, 'menu')).toBeUndefined();
    expect(iconOfAlias({ aliases: { dropdown: 'arrow_drop_down' } }, 'dropdown')).toBeUndefined();
    expect(iconOfAlias(undefined, 'check')).toBeUndefined();
  });

  test('a name resolves through the app’s resolve, without one to none', () => {
    expect(iconOfName({ resolve: ligature }, 'home')).toEqual(ligature('home'));
    expect(iconOfName({}, 'home')).toBeUndefined();
    expect(iconOfName(undefined, 'home')).toBeUndefined();
  });

  test('the aliases, one for each icon a component draws on its own', () => {
    expect(ICON_ALIASES).toEqual([
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
    ]);
  });
});

describe('telling and finding icons', () => {
  test('an icon source, or something else an adapter draws, as a component', () => {
    expect(isIconSource(check)).toBe(true);
    expect(isIconSource(ligature('home'))).toBe(true);
    expect(isIconSource({ type: 'class', className: 'mdi mdi-home' })).toBe(true);
    expect(isIconSource({ type: 'component' })).toBe(false);
    expect(isIconSource({ render: () => null })).toBe(false);
    expect(isIconSource(() => null)).toBe(false);
    expect(isIconSource(null)).toBe(false);
  });

  test('the icon to draw: the alias’s, or the icon, or the name’s', () => {
    const icons: IconRegistry = { aliases: { check }, resolve: ligature };
    expect(iconOf(icons, { alias: 'check', icon: 'home' })).toBe(check);
    expect(iconOf(icons, { alias: 'menu' })).toBeUndefined();
    expect(iconOf(icons, { icon: 'home' })).toEqual(ligature('home'));
    expect(iconOf(icons, { icon: check })).toBe(check);
    expect(iconOf(undefined, { icon: check })).toBe(check);
  });
});

describe('createIcon', () => {
  test('right to left, the icons of aliases pointing along the line are mirrored', () => {
    expect(MIRRORED_ICON_ALIASES).toEqual(['previous', 'next', 'submenu']);
    const mirrored = (alias?: (typeof ICON_ALIASES)[number]) =>
      createIcon({ source: () => check, alias: () => alias }).parts.root()['data-mirrored'];
    expect([mirrored('previous'), mirrored('next'), mirrored('submenu')]).toEqual(['', '', '']);
    expect([mirrored('clock'), mirrored('dropdown'), mirrored()]).toEqual([
      undefined,
      undefined,
      undefined,
    ]);
  });

  test('an icon the adapter draws itself: no skeleton, the root part for its root', () => {
    const icon = createIcon({ source: () => undefined, alias: () => 'next' });
    expect(icon.skeleton()).toBeUndefined();
    expect(icon.parts.root()).toEqual({
      class: 'rio-icon',
      viewBox: undefined,
      'aria-hidden': 'true',
      'data-type': 'component',
      'data-mirrored': '',
    });
    expect([icon.parts.path(), icon.parts.glyph()]).toEqual([{}, {}]);
  });

  test('SVG paths: an svg in a 24 by 24 view box, hidden from assistive technology', () => {
    const icon = createIcon({ source: () => check });
    expect(icon.skeleton()).toBe(iconSvgSkeleton);
    expect(icon.parts.root()).toEqual({
      class: 'rio-icon',
      viewBox: '0 0 24 24',
      'aria-hidden': 'true',
      'data-type': 'svg',
      'data-mirrored': undefined,
    });
    expect(icon.parts.path()).toEqual({ d: check.path });
  });

  test('paths given apart are drawn as one, in their own view box', () => {
    const icon = createIcon({
      source: () => ({
        type: 'svg',
        path: ['M0 0h10v10H0z', 'M20 20h4v4h-4z'],
        viewBox: '0 0 48 48',
      }),
    });
    expect(icon.parts.root().viewBox).toBe('0 0 48 48');
    expect(icon.parts.path()).toEqual({ d: 'M0 0h10v10H0z M20 20h4v4h-4z' });
  });

  test('a ligature: its name on the glyph, which the stylesheet draws, in the font’s class', () => {
    const icon = createIcon({ source: () => ligature('arrow_drop_down') });
    expect(icon.skeleton()).toBe(iconFontSkeleton);
    expect(icon.parts.root()).toEqual({
      class: 'rio-icon',
      viewBox: undefined,
      'aria-hidden': 'true',
      'data-type': 'ligature',
      'data-mirrored': undefined,
    });
    expect(icon.parts.glyph()).toEqual({
      class: 'material-symbols-outlined',
      'data-ligature': 'arrow_drop_down',
    });
  });

  test('a font’s class: the glyph carries it', () => {
    const icon = createIcon({ source: () => ({ type: 'class', className: 'mdi mdi-home' }) });
    expect(icon.skeleton()).toBe(iconFontSkeleton);
    expect(icon.parts.root()['data-type']).toBe('class');
    expect(icon.parts.glyph()).toEqual({ class: 'mdi mdi-home', 'data-ligature': undefined });
  });
});
