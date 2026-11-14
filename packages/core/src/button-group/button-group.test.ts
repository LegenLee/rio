import { describe, expect, test, vi } from 'vitest';
import { createButtonGroup, type ButtonGroupProps } from './button-group';

const setup = (props: ButtonGroupProps = {}) => {
  const onChange = vi.fn();
  const group = createButtonGroup({ props: () => props, onChange });
  return { group, onChange };
};

describe('createButtonGroup', () => {
  test('is a group, small, round, and standard by default', () => {
    expect(setup().group.rootAttrs()).toEqual({
      role: 'group',
      'data-variant': 'standard',
      'data-size': 'small',
      'data-shape': 'round',
    });
  });

  test('keeps no selection unless asked to', () => {
    const { group, onChange } = setup({ selected: 'a' });
    expect(group.isSelected('a')).toBe(false);
    group.select('b', true);
    expect(onChange).not.toHaveBeenCalled();
  });

  describe('single', () => {
    test('selecting a button replaces the previous one', () => {
      const { group, onChange } = setup({ selection: 'single', selected: 'a' });
      expect(group.isSelected('a')).toBe(true);
      group.select('b', true);
      expect(onChange).toHaveBeenCalledWith('b');
    });

    test('the selected button can be turned off', () => {
      const { group, onChange } = setup({ selection: 'single', selected: 'a' });
      group.select('a', false);
      expect(onChange).toHaveBeenCalledWith(undefined);
    });

    test('required keeps it on', () => {
      const { group, onChange } = setup({
        selection: 'single',
        required: true,
        selected: 'a',
      });
      group.select('a', false);
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('multiple', () => {
    test('adds and removes values', () => {
      const { group, onChange } = setup({ selection: 'multiple', selected: ['a'] });
      group.select('b', true);
      expect(onChange).toHaveBeenLastCalledWith(['a', 'b']);
      group.select('a', false);
      expect(onChange).toHaveBeenLastCalledWith([]);
    });

    test('required keeps the last one on', () => {
      const { group, onChange } = setup({
        selection: 'multiple',
        required: true,
        selected: [1, 2],
      });
      group.select(1, false);
      expect(onChange).toHaveBeenLastCalledWith([2]);
      onChange.mockClear();
      const last = setup({ selection: 'multiple', required: true, selected: [2] });
      last.group.select(2, false);
      expect(last.onChange).not.toHaveBeenCalled();
    });

    test('treats a missing model as nothing selected', () => {
      const { group, onChange } = setup({ selection: 'multiple' });
      expect(group.isSelected('a')).toBe(false);
      group.select('a', true);
      expect(onChange).toHaveBeenCalledWith(['a']);
    });
  });

  test('ignores requests that change nothing', () => {
    const { group, onChange } = setup({ selection: 'multiple', selected: ['a'] });
    group.select('a', true);
    group.select('b', false);
    expect(onChange).not.toHaveBeenCalled();
  });
});
