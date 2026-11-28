import { describe, expect, test } from 'vitest';
import { createToolbar, type ToolbarProps } from './toolbar';

const root = (props: ToolbarProps) => createToolbar({ props: () => props }).parts.root();

describe('createToolbar', () => {
  test('a docked, standard toolbar by default, named a toolbar', () => {
    expect(root({})).toEqual({
      class: 'rio-toolbar',
      role: 'toolbar',
      'aria-orientation': undefined,
      'data-type': 'docked',
      'data-variant': 'standard',
      'data-orientation': 'horizontal',
      'data-flat': undefined,
    });
  });

  test('a vertical floating toolbar says so, and a docked one stays horizontal', () => {
    const floating = root({ type: 'floating', orientation: 'vertical' });
    expect([floating['aria-orientation'], floating['data-orientation']]).toEqual([
      'vertical',
      'vertical',
    ]);
    const docked = root({ type: 'docked', orientation: 'vertical' });
    expect([docked['aria-orientation'], docked['data-orientation']]).toEqual([
      undefined,
      'horizontal',
    ]);
  });

  test('vibrant, and a flat floating toolbar; a docked one has no shadow to take off', () => {
    expect(root({ variant: 'vibrant' })['data-variant']).toBe('vibrant');
    expect(root({ type: 'floating', flat: true })['data-flat']).toBe('');
    expect(root({ type: 'docked', flat: true })['data-flat']).toBeUndefined();
  });

  test('reads the props on every call', () => {
    const props: ToolbarProps = { type: 'floating' };
    const toolbar = createToolbar({ props: () => props });
    expect(toolbar.orientation()).toBe('horizontal');
    props.orientation = 'vertical';
    expect(toolbar.orientation()).toBe('vertical');
  });
});
