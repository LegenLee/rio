import { expect, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { keyboardFocus } from './vrt';

/**
 * Checks a focus ring that `@rio-m3e/styles/base/focus-ring.css` draws on another element than the
 * one with the focus: none until `focused` has keyboard focus, then 3px of the theme's secondary,
 * `offset` away. The page should keep the pointer off the component, so `:hover` doesn't count.
 * It presses Tab first: after a click, WebKit doesn't match `:focus-visible` on a scripted focus
 * until the focus has moved by keyboard.
 */
export async function expectRingOnFocus(focused: HTMLElement, ring: HTMLElement, offset = '2px') {
  expect(getComputedStyle(ring).outlineStyle).toBe('none');
  await userEvent.keyboard('{Tab}');
  await keyboardFocus(focused);
  await vi.waitFor(() => expect(getComputedStyle(ring).outlineStyle).toBe('solid'));
  const style = getComputedStyle(ring);
  expect([style.outlineWidth, style.outlineOffset]).toEqual(['3px', offset]);
  // The theme's secondary, as an element colored with it resolves it
  const probe = ring.parentElement!.appendChild(document.createElement('span'));
  probe.style.color = 'var(--rio-color-secondary)';
  expect(style.outlineColor).toBe(getComputedStyle(probe).color);
  probe.remove();
}
