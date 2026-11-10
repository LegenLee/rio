import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-vue';
import { defineComponent, h, withDirectives } from 'vue';
import { vRipple } from './ripple';

// A host with reactive props, so tests can flip the directive value and the class binding.
const Host = defineComponent({
  props: { enabled: { type: Boolean, default: undefined }, highlighted: Boolean },
  setup(props) {
    return () =>
      withDirectives(
        h('button', { type: 'button', class: { highlighted: props.highlighted } }, 'Go'),
        [[vRipple, props.enabled]],
      );
  },
});

const press = (el: Element) =>
  el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, isPrimary: true, buttons: 1 }));

describe('vRipple', () => {
  test('attaches a ripple on mount', async () => {
    const screen = await render(Host);
    const button = screen.getByRole('button').element();
    expect(button.hasAttribute('data-ripple')).toBe(true);
    press(button);
    expect(button.hasAttribute('data-pressed')).toBe(true);
  });

  test('`false` turns it off, and the value can change later', async () => {
    const screen = await render(Host, { props: { enabled: false } });
    const button = screen.getByRole('button').element();
    expect(button.hasAttribute('data-ripple')).toBe(false);

    await screen.rerender({ enabled: true });
    expect(button.hasAttribute('data-ripple')).toBe(true);

    await screen.rerender({ enabled: false });
    expect(button.hasAttribute('data-ripple')).toBe(false);
  });

  test('survives class changes from Vue', async () => {
    const screen = await render(Host);
    await screen.rerender({ highlighted: true });
    const button = screen.getByRole('button').element();
    expect(button.classList.contains('highlighted')).toBe(true);
    expect(button.hasAttribute('data-ripple')).toBe(true);
  });

  test('detaches on unmount', async () => {
    const screen = await render(Host);
    const button = screen.getByRole('button').element();
    await screen.unmount();
    press(button);
    expect(button.hasAttribute('data-ripple')).toBe(false);
    expect(button.hasAttribute('data-pressed')).toBe(false);
  });
});
