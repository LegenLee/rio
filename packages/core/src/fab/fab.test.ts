import { describe, expect, test, vi } from 'vitest';
import { createFab, FAB_SIZES, FAB_VARIANTS, type FabContent, type FabProps } from './fab';

const setup = (props: Partial<FabProps> = {}, content: FabContent | undefined = { icon: true }) => {
  const onClick = vi.fn();
  const fab = createFab({
    props: () => ({ label: 'Compose', ...props }),
    content: content && (() => content),
    onClick,
  });
  return { fab, onClick };
};

describe('createFab', () => {
  test('the spec’s three sizes, and its color styles as two variants of a color', () => {
    expect(FAB_SIZES).toEqual(['small', 'medium', 'large']);
    expect(FAB_VARIANTS).toEqual(['tonal', 'filled']);
  });

  test('defaults to a small tonal FAB in primary container, its icon only, named by its label', () => {
    const { fab } = setup();
    expect(fab.parts.root()).toEqual({
      class: 'rio-fab rio-state-layer rio-focus-ring',
      type: 'button',
      'aria-label': 'Compose',
      'data-size': 'small',
      'data-variant': 'tonal',
      'data-extended': undefined,
      'data-icon': '',
      style: undefined,
    });
    expect(fab.showsIcon()).toBe(true);
    expect(fab.showsLabel()).toBe(false);
  });

  test('extended, it shows its label beside the icon, still named by it', () => {
    const { fab } = setup({ extended: true, size: 'large', type: 'submit' });
    expect(fab.parts.root()).toMatchObject({
      type: 'submit',
      'aria-label': 'Compose',
      'data-size': 'large',
      'data-extended': '',
      'data-icon': '',
    });
    expect(fab.showsLabel()).toBe(true);
  });

  test('a color of the theme, filled or on its container, through the accent variables', () => {
    const { fab } = setup({ color: 'tertiary', variant: 'filled' });
    expect(fab.parts.root()).toMatchObject({
      'data-variant': 'filled',
      style:
        '--rio-accent: var(--rio-color-tertiary); --rio-on-accent: var(--rio-color-on-tertiary); ' +
        '--rio-accent-container: var(--rio-color-tertiary-container); ' +
        '--rio-on-accent-container: var(--rio-color-on-tertiary-container)',
    });
  });

  test('without an icon, it shows its label whatever `extended` says', () => {
    const { fab } = setup({}, { icon: false });
    expect(fab.showsIcon()).toBe(false);
    expect(fab.showsLabel()).toBe(true);
    expect(fab.parts.root()).toMatchObject({ 'data-extended': '', 'data-icon': undefined });
    // An adapter that reports no content has no icon.
    const bare = createFab({ props: () => ({ label: 'Compose' }), onClick: vi.fn() });
    expect(bare.showsLabel()).toBe(true);
  });

  test('the icon decorates and the label repeats the name, so both are hidden from assistive technology', () => {
    const { parts } = setup().fab;
    expect(parts.icon()).toEqual({ class: 'rio-fab__icon', 'aria-hidden': 'true' });
    expect(parts.label()).toEqual({ class: 'rio-fab__label', 'aria-hidden': 'true' });
    expect(parts.text()).toEqual({ class: 'rio-fab__text' });
  });

  test('with `href`, a link that looks the same, without `type`', () => {
    const { fab } = setup({ href: '/compose', type: 'submit' });
    expect(fab.isLink()).toBe(true);
    const root = fab.parts.root();
    expect(root).toMatchObject({ href: '/compose', 'aria-label': 'Compose' });
    expect(root).not.toHaveProperty('type');
    expect(root.role).toBeUndefined();
  });

  test('reports every click', () => {
    const { fab, onClick } = setup();
    const event = { preventDefault: vi.fn() } as unknown as MouseEvent;
    fab.handleClick(event);
    expect(onClick).toHaveBeenCalledWith(event);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });
});
