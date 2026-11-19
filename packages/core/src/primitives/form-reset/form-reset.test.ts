import { afterEach, describe, expect, test, vi } from 'vitest';
import { attachFormReset, type FormResetHandle } from './form-reset';

let handle: FormResetHandle | undefined;
const forms: HTMLFormElement[] = [];

const form = () => {
  const el = document.createElement('form');
  const input = document.createElement('input');
  input.defaultValue = 'default';
  el.append(input);
  document.body.append(el);
  forms.push(el);
  return { form: el, input };
};

/** A task later, when a timer set now has run */
const nextTask = () => new Promise((resolve) => setTimeout(resolve));

afterEach(() => {
  handle?.detach();
  handle = undefined;
  for (const el of forms.splice(0)) el.remove();
});

describe('attachFormReset', () => {
  test('calls back once the form has put its controls back', async () => {
    const { form: el, input } = form();
    input.value = 'typed';
    let seen: string | undefined;
    handle = attachFormReset([input], () => (seen = input.value));
    el.reset();
    expect(seen).toBeUndefined();
    await nextTask();
    expect(seen).toBe('default');
  });

  test('only for the form of one of the controls, as it is at the time', async () => {
    const first = form();
    const second = form();
    const onReset = vi.fn();
    handle = attachFormReset([first.input], onReset);
    second.form.reset();
    await nextTask();
    expect(onReset).not.toHaveBeenCalled();
    second.form.id = 'second';
    first.input.setAttribute('form', 'second');
    second.form.reset();
    await nextTask();
    expect(onReset).toHaveBeenCalledOnce();
  });

  test('any of several controls; resets in a row call back once', async () => {
    const first = form();
    const second = form();
    const onReset = vi.fn();
    handle = attachFormReset([first.input, second.input], onReset);
    second.form.reset();
    second.form.reset();
    await nextTask();
    expect(onReset).toHaveBeenCalledOnce();
  });

  test('detached, it stops, a callback still to come included', async () => {
    const { form: el, input } = form();
    const onReset = vi.fn();
    handle = attachFormReset([input], onReset);
    el.reset();
    handle.detach();
    el.reset();
    await nextTask();
    expect(onReset).not.toHaveBeenCalled();
  });

  test('no controls, nothing to watch', () => {
    expect(() => attachFormReset([], vi.fn()).detach()).not.toThrow();
  });
});
