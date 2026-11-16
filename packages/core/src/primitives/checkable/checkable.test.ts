import { afterEach, describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { attachCheckable, type CheckableOptions } from './checkable';

const cleanup: (() => void)[] = [];
afterEach(() => cleanup.splice(0).forEach((undo) => undo()));

const checkbox = (options: Partial<CheckableOptions> = {}) => {
  const input = document.body.appendChild(document.createElement('input'));
  input.type = 'checkbox';
  const state = { checked: false, indeterminate: false, blocked: false };
  const onChange = vi.fn();
  const handle = attachCheckable(input, {
    checked: () => state.checked,
    indeterminate: () => state.indeterminate,
    blocked: () => state.blocked,
    onChange,
    ...options,
  });
  cleanup.push(() => {
    handle.detach();
    input.remove();
  });
  return { input, state, onChange, handle };
};

describe('attachCheckable', () => {
  test('shows the state as attached, including indeterminate', () => {
    const { input, state, handle } = checkbox();
    expect(input.checked).toBe(false);
    state.checked = true;
    state.indeterminate = true;
    handle.sync();
    expect([input.checked, input.indeterminate]).toEqual([true, true]);
  });

  test('reports a click, and keeps showing it until sync', async () => {
    const { input, onChange, handle } = checkbox();
    await userEvent.click(input);
    expect(onChange).toHaveBeenCalledExactlyOnceWith(true);
    expect(input.checked).toBe(true);
    // The adapter kept it unchecked.
    handle.sync();
    expect(input.checked).toBe(false);
  });

  test('blocked: a click changes nothing and reports nothing', () => {
    const { input, state, onChange } = checkbox();
    state.blocked = true;
    input.click();
    expect(input.checked).toBe(false);
    expect(onChange).not.toHaveBeenCalled();
  });

  test('blocked: a change that gets through is put back', () => {
    const { input, state, onChange } = checkbox();
    state.blocked = true;
    input.checked = true;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    expect(input.checked).toBe(false);
    expect(onChange).not.toHaveBeenCalled();
  });

  test("a form's reset leaves the adapter's state showing", async () => {
    const form = document.body.appendChild(document.createElement('form'));
    cleanup.push(() => form.remove());
    const { input, state, handle } = checkbox();
    form.append(input);
    state.checked = true;
    handle.sync();
    form.reset();
    expect(input.checked).toBe(false);
    await vi.waitFor(() => expect(input.checked).toBe(true));
  });

  test('detach stops reporting', async () => {
    const { input, onChange, handle } = checkbox();
    handle.detach();
    await userEvent.click(input);
    expect(onChange).not.toHaveBeenCalled();
  });
});
