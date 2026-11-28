import { describe, expect, test } from 'vitest';
import { accentStyle } from './accent';

describe('accentStyle', () => {
  test('nothing without a color', () => {
    expect(accentStyle(undefined)).toBeUndefined();
  });

  test("the four accent variables, from the color's roles", () => {
    expect(accentStyle('error')).toBe(
      '--rio-accent: var(--rio-color-error); ' +
        '--rio-on-accent: var(--rio-color-on-error); ' +
        '--rio-accent-container: var(--rio-color-error-container); ' +
        '--rio-on-accent-container: var(--rio-color-on-error-container)',
    );
  });

  test('a static color named in camelCase, as the theme writes it', () => {
    expect(accentStyle('brandBlue')).toContain('--rio-accent: var(--rio-color-brand-blue)');
    expect(accentStyle('brand-blue')).toContain(
      '--rio-on-accent-container: var(--rio-color-on-brand-blue-container)',
    );
  });

  test("nothing for a name the theme can't write, so no other style gets in", () => {
    for (const color of ['', 'Error', '1st', 'red; color: red', 'a--b', 'error)'])
      expect(accentStyle(color), color).toBeUndefined();
  });
});
