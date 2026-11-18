import { attachTheme } from '@rio-m3e/tokens';
import { describe, expect, onTestFinished, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-vue';
import { defineComponent, h, nextTick, reactive } from 'vue';
import Switch from './Switch.vue';

const touch = (el: Element, type: string, clientX: number, pointerType = 'touch') =>
  el.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      isPrimary: true,
      pointerId: 3,
      pointerType,
      clientX,
      buttons: type === 'pointerdown' ? 1 : 0,
    }),
  );

const handleLeft = (root: Element) =>
  getComputedStyle(root.querySelector('.rio-switch__handle')!).insetInlineStart;

/** The switch's input, which has the role, and the track around it */
const parts = (screen: { getByRole: (role: 'switch') => { element(): Element } }) => {
  const input = screen.getByRole('switch').element() as HTMLInputElement;
  return { input, track: input.closest<HTMLElement>('.rio-switch')! };
};

/** A switch in a form, as an app would write it, with its state kept by the app */
const inForm = async (attrs: Record<string, unknown> = {}, selected = false) => {
  const state = reactive({ selected, submitted: 0 });
  const screen = await render(
    defineComponent(
      () => () =>
        h(
          'form',
          {
            onSubmit: (event: Event) => {
              event.preventDefault();
              state.submitted++;
            },
          },
          [
            h(Switch, {
              ...attrs,
              selected: state.selected,
              'onUpdate:selected': (next: boolean) => (state.selected = next),
            }),
            // With a submit button, Enter in any of the form's inputs may submit it.
            h('button', 'Send'),
          ],
        ),
    ),
  );
  const form = screen.container.querySelector('form')!;
  return { screen, state, form, ...parts(screen) };
};

describe('RioSwitch', () => {
  test('is an off native checkbox with the switch role, on a track of the spec size', async () => {
    const screen = await render(Switch);
    const { input, track } = parts(screen);
    expect([input.type, input.checked]).toEqual(['checkbox', false]);
    const style = getComputedStyle(track);
    expect([style.width, style.height]).toEqual(['52px', '32px']);
  });

  test('clicking requests the opposite value; the parent owns the state', async () => {
    const screen = await render(Switch);
    const { input } = parts(screen);
    await userEvent.click(input);
    expect(screen.emitted('update:selected')).toEqual([[true]]);
    // The app didn't follow, so it shows off again.
    await vi.waitFor(() => expect(input.checked).toBe(false));
    await screen.rerender({ selected: true });
    await vi.waitFor(() => expect(input.checked).toBe(true));
  });

  test('Space and Enter both toggle, as the spec says', async () => {
    const screen = await render(Switch);
    parts(screen).input.focus();
    await userEvent.keyboard(' ');
    await userEvent.keyboard('{Enter}');
    expect(screen.emitted('update:selected')).toHaveLength(2);
  });

  test('disabled is not focusable and emits nothing', async () => {
    const screen = await render(Switch, { props: { disabled: true } });
    const { input } = parts(screen);
    input.focus();
    expect(document.activeElement).not.toBe(input);
    await userEvent.click(input, { force: true });
    expect(screen.emitted('update:selected')).toBeUndefined();
  });

  test('softDisabled stays focusable but emits nothing, even when dragged', async () => {
    const screen = await render(Switch, { props: { softDisabled: true } });
    const { input } = parts(screen);
    input.focus();
    expect(document.activeElement).toBe(input);
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    touch(input, 'pointerdown', 10);
    touch(input, 'pointermove', 60);
    touch(input, 'pointerup', 60);
    expect(screen.emitted('update:selected')).toBeUndefined();
    expect(input.checked).toBe(false);
  });

  describe('in a form', () => {
    test('submits its value under its name while on, and nothing while off', async () => {
      const off = await inForm({ name: 'wifi' });
      expect(new FormData(off.form).has('wifi')).toBe(false);
      off.screen.unmount();
      const on = await inForm({ name: 'wifi' }, true);
      await vi.waitFor(() => expect(new FormData(on.form).get('wifi')).toBe('on'));
      on.screen.unmount();
      const custom = await inForm({ name: 'wifi', value: 'yes' }, true);
      await vi.waitFor(() => expect(new FormData(custom.form).get('wifi')).toBe('yes'));
    });

    test('a click or Enter toggles it, and never submits the form', async () => {
      const { state, input } = await inForm({ name: 'wifi' });
      await userEvent.click(input);
      expect(state.selected).toBe(true);
      input.focus();
      await userEvent.keyboard('{Enter}');
      expect(state.selected).toBe(false);
      expect(state.submitted).toBe(0);
    });

    test('Enter with Ctrl is left to the app', async () => {
      const { state, input } = await inForm({ name: 'wifi' });
      // Whether the switch let Enter through, as the form sees it bubble
      const prevented: boolean[] = [];
      input.form!.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') prevented.push(event.defaultPrevented);
      });
      input.focus();
      await userEvent.keyboard('{Control>}{Enter}{/Control}');
      expect(state.selected).toBe(false);
      expect(prevented).toEqual([false]);
    });

    test('required: the form is invalid until it is on', async () => {
      const { form, input, state } = await inForm({ name: 'terms', required: true });
      expect(form.checkValidity()).toBe(false);
      expect(input.validity.valueMissing).toBe(true);
      state.selected = true;
      await vi.waitFor(() => expect(form.checkValidity()).toBe(true));
    });

    test('a reset leaves the app’s state, which the switch keeps showing', async () => {
      const { form, input } = await inForm({ name: 'wifi' }, true);
      await vi.waitFor(() => expect(input.checked).toBe(true));
      form.reset();
      await vi.waitFor(() => expect(input.checked).toBe(true));
    });
  });

  test('a <label> around it names it, and a click on its text toggles it', async () => {
    const state = reactive({ selected: false });
    const screen = await render(
      defineComponent(
        () => () =>
          h('label', null, [
            h('span', 'Wi-Fi'),
            h(Switch, {
              selected: state.selected,
              'onUpdate:selected': (next: boolean) => (state.selected = next),
            }),
          ]),
      ),
    );
    await expect.element(screen.getByRole('switch', { name: 'Wi-Fi' })).toBeVisible();
    await userEvent.click(screen.getByText('Wi-Fi'));
    expect(state.selected).toBe(true);
  });

  test('class and style dress the track; every other attribute goes to the input', async () => {
    const screen = await render(Switch, {
      attrs: { class: 'mine', style: 'margin: 3px', id: 'wifi', 'aria-label': 'Wi-Fi' },
    });
    const { input, track } = parts(screen);
    expect(track.classList.contains('mine')).toBe(true);
    expect(track.style.margin).toBe('3px');
    expect([input.id, input.getAttribute('aria-label')]).toEqual(['wifi', 'Wi-Fi']);
    expect(track.hasAttribute('id')).toBe(false);
  });

  test('keyboard focus shows the state layer around the handle and rings the track', async () => {
    const theme = attachTheme(document.documentElement, {
      sourceColor: '#6750a4',
      colorScheme: false,
    });
    onTestFinished(() => theme.detach());
    const screen = await render(Switch);
    const { input, track } = parts(screen);
    const layer = track.querySelector('.rio-switch__state')!;
    expect(getComputedStyle(layer, '::before').opacity).toBe('0');
    await userEvent.tab();
    expect(input.matches(':focus-visible')).toBe(true);
    await expect.poll(() => getComputedStyle(layer, '::before').opacity).toBe('0.1');
    expect(getComputedStyle(track).outlineStyle).toBe('solid');
  });

  test('shows the icon for the current state and grows the handle for it', async () => {
    const screen = await render(Switch, {
      props: { selected: true },
      slots: { 'selected-icon': () => '✓' },
    });
    const { track } = parts(screen);
    expect(track.hasAttribute('data-icon')).toBe(true);
    expect(track.querySelector('.rio-switch__icon')?.textContent).toBe('✓');
    await screen.rerender({ selected: false });
    expect(track.hasAttribute('data-icon')).toBe(false);
    expect(track.querySelector('.rio-switch__icon')).toBeNull();
  });

  test('puts the handle at the start when off and at the end when on', async () => {
    const screen = await render(Switch);
    const { track } = parts(screen);
    // Off: center 16px, size 16px, inside a 2px outline → 16 - 8 - 2
    expect(handleLeft(track)).toBe('6px');
    await screen.rerender({ selected: true });
    // On: center 36px, size 24px → 36 - 12 - 2
    await vi.waitFor(() => expect(handleLeft(track)).toBe('22px'));
  });

  test('a press grows the handle', async () => {
    const screen = await render(Switch);
    const { input, track } = parts(screen);
    const press = { bubbles: true, isPrimary: true, pointerType: 'mouse' };
    input.dispatchEvent(new PointerEvent('pointerdown', { ...press, buttons: 1 }));
    await nextTick();
    await vi.waitFor(() =>
      expect(getComputedStyle(track).getPropertyValue('--rio-switch-handle-size-target')).toBe(
        '28px',
      ),
    );
    input.dispatchEvent(new PointerEvent('pointerup', press));
  });

  test('ripples in the circle around the handle, not on the track', async () => {
    const screen = await render(Switch);
    const { track } = parts(screen);
    expect(track.hasAttribute('data-ripple')).toBe(false);
    expect(track.querySelector('.rio-switch__state')!.hasAttribute('data-ripple')).toBe(true);
  });

  test('dragging the handle across with touch turns it on, once', async () => {
    const screen = await render(Switch);
    const { input } = parts(screen);
    touch(input, 'pointerdown', 10);
    touch(input, 'pointermove', 40);
    touch(input, 'pointerup', 45);
    input.click(); // the browser's click after the gesture is swallowed
    expect(screen.emitted('update:selected')).toEqual([[true]]);
  });

  test('a short touch is a tap', async () => {
    const screen = await render(Switch);
    const { input } = parts(screen);
    touch(input, 'pointerdown', 10);
    touch(input, 'pointermove', 12);
    touch(input, 'pointerup', 12);
    input.click();
    expect(screen.emitted('update:selected')).toEqual([[true]]);
  });

  test('the mouse clicks instead of dragging, as the spec says', async () => {
    const screen = await render(Switch);
    const { input } = parts(screen);
    touch(input, 'pointerdown', 10, 'mouse');
    touch(input, 'pointermove', 40, 'mouse');
    touch(input, 'pointerup', 40, 'mouse');
    input.click();
    expect(screen.emitted('update:selected')).toEqual([[true]]);
  });

  test.each(['ltr', 'rtl'])('the 48px target is centered on the track, %s', async (dir) => {
    const screen = await render(defineComponent(() => () => h('div', { dir }, [h(Switch)])));
    const { input, track } = parts(screen);
    const target = input.getBoundingClientRect();
    const box = track.getBoundingClientRect();
    expect([target.width, target.height]).toEqual([52, 48]);
    // Within half a pixel: engines round layout differently (WebKit to 1/64px).
    expect(target.left + target.width / 2).toBeCloseTo(box.left + box.width / 2, 0);
    expect(target.top + target.height / 2).toBeCloseTo(box.top + box.height / 2, 0);
  });
});
