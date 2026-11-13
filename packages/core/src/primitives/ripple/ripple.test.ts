import { afterEach, describe, expect, test, vi, type MockInstance } from 'vitest';
import { attachRipple, type RippleHandle } from './ripple';

let handle: RippleHandle | undefined;
let element: HTMLButtonElement;
let animate: MockInstance<HTMLElement['animate']>;

const setup = (attrs: Record<string, string> = {}) => {
  element = document.createElement('button');
  element.style.cssText = 'width: 120px; height: 40px;';
  for (const [k, v] of Object.entries(attrs)) element.setAttribute(k, v);
  document.body.append(element);
  animate = vi.spyOn(element, 'animate');
  handle = attachRipple(element);
  return element;
};

const pointer = (type: string, init: PointerEventInit = {}) =>
  element.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      isPrimary: true,
      pointerId: 1,
      pointerType: 'mouse',
      buttons: type === 'pointerdown' ? 1 : 0,
      clientX: 10,
      clientY: 10,
      ...init,
    }),
  );

const pressed = () => 'pressed' in element.dataset;

/** Each ripple started so far, as its first and last keyframes. */
const ripples = () =>
  animate.mock.calls.map(([keyframes, options]) => {
    expect((options as KeyframeAnimationOptions).pseudoElement).toBe('::after');
    const frames = keyframes as Keyframe[];
    return { from: frames[0]!, to: frames.at(-1)! };
  });

const onlyRipple = () => {
  const all = ripples();
  expect(all).toHaveLength(1);
  return all[0]!;
};

afterEach(() => {
  handle?.detach();
  element?.remove();
});

describe('attachRipple', () => {
  test('marks the element and unmarks it on detach', () => {
    setup();
    expect(element.dataset.ripple).toBe('');
    handle!.detach();
    expect('ripple' in element.dataset).toBe(false);
  });

  test('a mouse press ripples from the press point toward the center', () => {
    setup();
    pointer('pointerdown', { clientX: element.getBoundingClientRect().left + 10 });
    expect(pressed()).toBe(true);
    const { from, to } = onlyRipple();
    expect(from['--rio-ripple-x']).toBe('10px');
    expect(to['--rio-ripple-x']).toBe('60px');
  });

  test('a release stays pressed for the minimum time', async () => {
    setup();
    pointer('pointerdown');

    pointer('pointerup');
    expect(pressed()).toBe(true); // held for the minimum press time
    await vi.waitFor(() => expect(pressed()).toBe(false), { timeout: 1000 });
  });

  test('a touch press waits for the touch delay', async () => {
    setup();
    pointer('pointerdown', { pointerType: 'touch', buttons: 1 });
    expect(pressed()).toBe(false);
    await vi.waitFor(() => expect(pressed()).toBe(true), { timeout: 1000 });
  });

  test('a tap shorter than the touch delay still ripples', () => {
    setup();
    pointer('pointerdown', { pointerType: 'touch', buttons: 1 });
    pointer('pointerup', { pointerType: 'touch' });
    expect(pressed()).toBe(true);
  });

  test('a click without a pointer (keyboard) ripples from the center', () => {
    setup();
    element.click();
    expect(pressed()).toBe(true);
    const { from } = onlyRipple();
    expect(from['--rio-ripple-x']).toBe('60px');
    expect(from['--rio-ripple-y']).toBe('20px');
  });

  test('a click that follows a pointer press does not ripple twice', () => {
    setup();
    pointer('pointerdown');
    pointer('pointerup');
    element.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    expect(ripples()).toHaveLength(1);
  });

  test.each<Record<string, string>>([{ disabled: '' }, { 'aria-disabled': 'true' }])(
    'ignores disabled elements (%o)',
    (attrs) => {
      setup(attrs);
      pointer('pointerdown');
      element.click();
      expect(pressed()).toBe(false);
      expect(ripples()).toHaveLength(0);
    },
  );

  test('stops reacting after detach', () => {
    setup();
    handle!.detach();
    pointer('pointerdown');
    expect(pressed()).toBe(false);
  });
});
