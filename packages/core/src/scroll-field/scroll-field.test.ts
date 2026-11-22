import { describe, expect, test, vi } from 'vitest';
import {
  completeScrollFieldText,
  createScrollField,
  readScrollFieldText,
  scrollFieldCopies,
  scrollFieldDefaults,
  scrollFieldIndex,
  scrollFieldText,
  scrollFieldValues,
  type ScrollFieldProps,
} from './scroll-field';

const setup = (props: ScrollFieldProps = {}, center?: number) => {
  const onChange = vi.fn();
  const onEditingChange = vi.fn();
  const field = createScrollField({
    props: () => props,
    ids: { options: 'f' },
    center: () => center,
    onChange,
    onEditingChange,
  });
  return { field, onChange, onEditingChange };
};

const key = (
  name: string,
  mods: Partial<Record<'altKey' | 'ctrlKey' | 'metaKey', boolean>> = {},
) => {
  const event = {
    key: name,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    defaultPrevented: false,
    ...mods,
    preventDefault: vi.fn(() => {
      event.defaultPrevented = true;
    }),
  };
  return event;
};

describe('values', () => {
  test('by default, 0 to 100, a step apart, finite, out of editing', () => {
    expect(scrollFieldDefaults).toMatchObject({ min: 0, max: 100, step: 1, loop: false });
    expect(scrollFieldValues({})).toHaveLength(101);
  });

  test('the numbers of the range, steps such as 0.1 rounded', () => {
    expect(scrollFieldValues({ min: 0, max: 0.3, step: 0.1 })).toEqual([0, 0.1, 0.2, 0.3]);
    // As a native range input: max below min is min, and a step not above zero is 1.
    expect(scrollFieldValues({ min: 5, max: 2 })).toEqual([5]);
    expect(scrollFieldValues({ min: 0, max: 2, step: 0 })).toEqual([0, 1, 2]);
    // A max that isn't on a step: the last step below it
    expect(scrollFieldValues({ min: 0, max: 10, step: 4 })).toEqual([0, 4, 8]);
  });

  test('options in place of the range', () => {
    expect(scrollFieldValues({ options: ['g', 'kg'], min: 0, max: 9 })).toEqual(['g', 'kg']);
    expect(scrollFieldValues({ options: [], max: 2 })).toEqual([0, 1, 2]);
  });

  test('a value’s place: the nearest step in a range, the first for one it doesn’t take', () => {
    expect(scrollFieldIndex(7, { min: 0, max: 59 })).toBe(7);
    expect(scrollFieldIndex(7.4, { min: 0, max: 59 })).toBe(7);
    expect(scrollFieldIndex(99, { min: 0, max: 59 })).toBe(59);
    expect(scrollFieldIndex('kg', { options: ['g', 'kg'] })).toBe(1);
    expect(scrollFieldIndex('lb', { options: ['g', 'kg'] })).toBe(0);
    expect(scrollFieldIndex(undefined, {})).toBe(0);
  });

  test('written: numbers with at least two digits, in the language’s; text as it is; or by format', () => {
    expect(scrollFieldText(7, {})).toBe('07');
    expect(scrollFieldText(107, {})).toBe('107');
    expect(scrollFieldText(7, { locale: 'ar-EG' })).toBe('٠٧');
    expect(scrollFieldText('kg', {})).toBe('kg');
    expect(scrollFieldText(7, { format: (v) => `${v} min` })).toBe('7 min');
  });
});

describe('typed text', () => {
  test('a value written as the field writes it, in any case', () => {
    const units = { options: ['g', 'kg', 'lb'] };
    expect(readScrollFieldText(' KG ', units)).toBe('kg');
    expect(readScrollFieldText('oz', units)).toBeUndefined();
    expect(readScrollFieldText('', units)).toBeUndefined();
  });

  test('a number of the range, in the language’s digits or Latin ones, on a step', () => {
    const minutes = { min: 0, max: 59, locale: 'ar-EG' };
    expect(readScrollFieldText('42', minutes)).toBe(42);
    expect(readScrollFieldText('٤٢', minutes)).toBe(42);
    // Not as the field writes it, '٠٧', but in the language's digits all the same
    expect(readScrollFieldText('٧', minutes)).toBe(7);
    expect(readScrollFieldText('07', minutes)).toBe(7);
    expect(readScrollFieldText('75', minutes)).toBeUndefined();
    expect(readScrollFieldText('4.5', minutes)).toBeUndefined();
    expect(readScrollFieldText('0.3', { min: 0, max: 1, step: 0.1 })).toBe(0.3);
    expect(readScrollFieldText('1e2', minutes)).toBeUndefined();
  });

  test('a number among numeric options', () => {
    expect(readScrollFieldText('400', { options: [100, 200, 400] })).toBe(400);
    expect(readScrollFieldText('300', { options: [100, 200, 400] })).toBeUndefined();
  });

  test('completes to the first text value that starts with it, in any case', () => {
    const units = { options: ['grams', 'Kilograms', 'kilometers', 7] };
    expect(completeScrollFieldText('k', units)).toBe('Kilograms');
    expect(completeScrollFieldText('kilom', units)).toBe('kilometers');
    expect(completeScrollFieldText('0', units)).toBeUndefined();
    expect(completeScrollFieldText('', units)).toBeUndefined();
  });
});

describe('looping', () => {
  test('one copy, or enough to scroll 40 items past either end', () => {
    expect(scrollFieldCopies(12, false)).toBe(1);
    expect(scrollFieldCopies(12, true)).toBe(9);
    expect(scrollFieldCopies(60, true)).toBe(3);
    expect(scrollFieldCopies(0, true)).toBe(1);
  });

  test('the value’s item: in the middle copy, or the copy nearest an item', () => {
    const { field } = setup({ min: 0, max: 11, loop: true, value: 3 });
    expect(field.items()).toHaveLength(9 * 12);
    expect(field.targetIndex()).toBe(4 * 12 + 3);
    expect(field.targetIndex(13)).toBe(12 + 3);
    expect(field.targetIndex(11)).toBe(12 + 3);
    expect(field.targetIndex(8)).toBe(3);
    expect(field.targetIndex(5000)).toBe(8 * 12 + 3);
    expect(field.itemText(12 + 5)).toBe('05');
  });
});

describe('the parts', () => {
  test('a list box named by its label, its active option the value’s', () => {
    const { field } = setup({ min: 0, max: 59, value: 7, label: 'Minutes' });
    expect(field.parts.root()).toMatchObject({
      class: 'rio-scroll-field rio-focus-ring rio-focus-ring-target',
      role: 'listbox',
      tabindex: '0',
      'aria-label': 'Minutes',
      'aria-activedescendant': 'f-7',
      'data-size': 'small',
    });
  });

  test('the values are its options, named by their text, the value’s selected', () => {
    const { field } = setup({ options: ['g', 'kg'], value: 'kg', format: (v) => `${v}.` });
    expect(field.parts.item(0)).toMatchObject({
      role: 'option',
      id: 'f-0',
      'aria-label': 'g.',
      'aria-selected': 'false',
    });
    expect(field.parts.item(1)).toMatchObject({
      role: 'option',
      id: 'f-1',
      'aria-label': 'kg.',
      'aria-selected': 'true',
    });
  });

  test('looping, the middle copy’s items are the options; the other copies are hidden', () => {
    const { field } = setup({ min: 0, max: 11, loop: true, value: 3 });
    const middle = 4 * 12;
    expect(field.parts.item(middle + 3)).toMatchObject({
      role: 'option',
      id: 'f-3',
      'aria-selected': 'true',
      'aria-hidden': undefined,
    });
    expect(field.parts.item(3)).toMatchObject({
      role: undefined,
      id: undefined,
      'aria-hidden': 'true',
    });
    expect(field.parts.root()['aria-activedescendant']).toBe('f-3');
  });

  test('the size, by the longest value written, unless set', () => {
    const size = (props: ScrollFieldProps) => setup(props).field.size();
    expect(size({ min: 0, max: 59 })).toBe('small');
    expect(size({ min: 0, max: 100 })).toBe('medium');
    expect(size({ min: 0, max: 9999 })).toBe('large');
    expect(size({ options: ['kilograms'] })).toBe('large');
    expect(size({ min: 0, max: 9, size: 'large' })).toBe('large');
    // The ends, or a step's decimals, make the longest
    expect(size({ min: -99, max: 0 })).toBe('medium');
    expect(size({ min: 0, max: 9, step: 0.5 })).toBe('large');
    // By format, each value written
    expect(size({ min: 0, max: 10, format: (v) => (v === 5 ? 'five!' : String(v)) })).toBe('large');
  });

  test('the item in the middle, as reported, or the value’s before', () => {
    expect(setup({ value: 2 }).field.parts.item(2)['data-selected']).toBe('');
    const reported = setup({ value: 2 }, 5).field;
    expect([
      reported.parts.item(2)['data-selected'],
      reported.parts.item(5)['data-selected'],
    ]).toEqual([undefined, '']);
    expect(reported.parts.item(5)['data-text']).toBe('05');
  });

  describe('itemDeps', () => {
    interface State {
      props: ScrollFieldProps;
      center?: number;
      atOnce?: boolean;
    }
    const fieldOf = (state: State) =>
      createScrollField({
        props: () => state.props,
        ids: { options: 'f' },
        center: () => state.center,
        centerAtOnce: () => !!state.atOnce,
        onChange: vi.fn(),
        onEditingChange: vi.fn(),
      });
    const same = (a: readonly unknown[], b: readonly unknown[]) =>
      a.length === b.length && a.every((value, i) => Object.is(value, b[i]));
    const loop: State = { props: { options: ['a', 'b', 'c'], loop: true, value: 'a' }, center: 42 };
    const states: State[] = [
      loop,
      { ...loop, center: 43 },
      { ...loop, atOnce: true },
      { ...loop, props: { ...loop.props, value: 'b' } },
      { ...loop, props: { ...loop.props, loop: false }, center: 1 },
      { ...loop, props: { ...loop.props, options: ['a', 'b', 'c', 'd'] } },
      { ...loop, props: { ...loop.props, format: (v) => `${v}.` } },
      { props: { min: 0, max: 59, value: 7 } },
      { props: { min: 0, max: 59, value: 7, locale: 'ar-EG' } },
      { props: { min: 1, max: 60, value: 7 } },
    ];

    test('equal ones give the same part and text, whatever changed', () => {
      for (const a of states) {
        for (const b of states) {
          const [first, second] = [fieldOf(a), fieldOf(b)];
          const [before, after] = [first.itemDeps(), second.itemDeps()];
          for (const item of second.items()) {
            if (!same(before(item), after(item))) continue;
            expect(second.parts.item(item)).toEqual(first.parts.item(item));
            expect(second.itemText(item)).toBe(first.itemText(item));
          }
        }
      }
    });

    test('a new item in the middle, or a new value, changes only the two items concerned', () => {
      const changed = (next: State) => {
        const [before, after] = [fieldOf(loop).itemDeps(), fieldOf(next).itemDeps()];
        return fieldOf(next)
          .items()
          .filter((item) => !same(before(item), after(item)));
      };
      expect(changed({ ...loop, center: 43 })).toEqual([42, 43]);
      expect(changed({ ...loop, props: { ...loop.props, value: 'b' } })).toEqual([42, 43]);
      expect(changed({ ...loop, atOnce: true })).toEqual([42]);
    });
  });

  test('the column is out of the tab order, which a browser gives a scrolling element', () => {
    expect(setup().field.parts.viewport()).toEqual({
      class: 'rio-scroll-field__viewport',
      tabindex: '-1',
    });
  });

  test('editing: the input, named and checked; the root, no spin button', () => {
    const { field } = setup({ editing: true, invalid: true, label: 'Minutes', min: 0, max: 59 });
    expect(field.showsInput()).toBe(true);
    expect(field.parts.input()).toMatchObject({
      type: 'text',
      inputmode: 'numeric',
      'aria-label': 'Minutes',
      'aria-invalid': 'true',
    });
    expect(field.parts.root()).toMatchObject({
      role: undefined,
      tabindex: undefined,
      'aria-label': undefined,
      'aria-activedescendant': undefined,
      'data-editing': '',
      'data-invalid': '',
    });
    expect(setup({ options: ['g'], editing: true }).field.parts.input().inputmode).toBeUndefined();
  });

  test('the keyboard for typing: digits, with a decimal point for decimals, any below 0', () => {
    const mode = (props: ScrollFieldProps) => setup(props).field.parts.input().inputmode;
    expect(mode({ min: 0, max: 59 })).toBe('numeric');
    expect(mode({ min: 0, max: 5, step: 0.5 })).toBe('decimal');
    expect(mode({ options: [100, 200, 400] })).toBe('numeric');
    expect(mode({ options: [0.5, 1] })).toBe('decimal');
    expect(mode({ min: -10, max: 10 })).toBeUndefined();
  });

  test('disabled: out of the tab order; soft-disabled stays in it', () => {
    expect(setup({ disabled: true }).field.parts.root()).toMatchObject({
      tabindex: undefined,
      'aria-disabled': 'true',
      'data-disabled': '',
    });
    expect(setup({ softDisabled: true }).field.parts.root()).toMatchObject({
      tabindex: '0',
      'aria-disabled': 'true',
    });
  });

  test('with a name, a hidden input submits the value', () => {
    const { field } = setup({ name: 'minutes', value: 7, min: 0, max: 59 });
    expect(field.showsHiddenInput()).toBe(true);
    expect(field.parts.hiddenInput()).toEqual({
      type: 'hidden',
      name: 'minutes',
      value: '7',
      disabled: undefined,
    });
    expect(setup().field.showsHiddenInput()).toBe(false);
    // Disabled, it submits nothing, as a disabled native control
    expect(setup({ name: 'minutes', disabled: true }).field.parts.hiddenInput().disabled).toBe('');
  });
});

describe('keys and presses', () => {
  test('up and down, home and end, stopping at the ends', () => {
    const { field, onChange } = setup({ min: 0, max: 9, value: 0 });
    field.handleKeydown(key('ArrowDown'));
    field.handleKeydown(key('End'));
    field.handleKeydown(key('ArrowUp'));
    expect(onChange.mock.calls).toEqual([[1], [9]]);
    const top = key('ArrowUp');
    field.handleKeydown(top);
    // At the end, nothing to ask for, but the key is still the field's
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(top.defaultPrevented).toBe(true);
  });

  test('looping, round the ends; Home and End go to the first and the last all the same', () => {
    const { field, onChange } = setup({ min: 0, max: 9, value: 0, loop: true });
    field.handleKeydown(key('ArrowUp'));
    field.handleKeydown(key('End'));
    expect(onChange.mock.calls).toEqual([[9], [9]]);
  });

  test('Enter and Space start editing; keys with Alt, Ctrl, or Meta are left alone', () => {
    const { field, onEditingChange, onChange } = setup();
    field.handleKeydown(key('Enter'));
    field.handleKeydown(key(' '));
    expect(onEditingChange.mock.calls).toEqual([[true], [true]]);
    field.handleKeydown(key('ArrowDown', { ctrlKey: true }));
    expect(onChange).not.toHaveBeenCalled();
  });

  test('blocked or editing, keys and presses ask for nothing', () => {
    for (const props of [{ disabled: true }, { softDisabled: true }, { editing: true }]) {
      const { field, onChange, onEditingChange } = setup(props);
      field.handleKeydown(key('ArrowDown'));
      field.handleKeydown(key('Enter'));
      field.selectItem(4);
      expect(onChange).not.toHaveBeenCalled();
      expect(onEditingChange).not.toHaveBeenCalled();
    }
  });

  test('an item asks for its value, from any copy', () => {
    const { field, onChange } = setup({ min: 0, max: 11, loop: true, value: 3 });
    field.selectItem(12 + 5);
    field.selectItem(4 * 12 + 3);
    expect(onChange.mock.calls).toEqual([[5]]);
  });
});
