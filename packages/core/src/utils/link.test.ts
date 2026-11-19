import { describe, expect, test } from 'vitest';
import { linkAttrs } from './link';

describe('linkAttrs', () => {
  test('an available link: its href, and nothing else', () => {
    expect(linkAttrs({ href: '/docs' })).toEqual({
      href: '/docs',
      role: undefined,
      'aria-disabled': undefined,
      tabindex: undefined,
    });
  });

  test('disabled: no href, a disabled link role, out of the tab order', () => {
    expect(linkAttrs({ href: '/docs', disabled: true })).toEqual({
      href: undefined,
      role: 'link',
      'aria-disabled': 'true',
      tabindex: undefined,
    });
  });

  test('soft-disabled: the same, and it keeps the focus', () => {
    expect(linkAttrs({ href: '/docs', softDisabled: true })).toEqual({
      href: undefined,
      role: 'link',
      'aria-disabled': 'true',
      tabindex: '0',
    });
  });

  test('disabled wins over soft-disabled', () => {
    expect(linkAttrs({ href: '/docs', disabled: true, softDisabled: true }).tabindex).toBe(
      undefined,
    );
  });
});
