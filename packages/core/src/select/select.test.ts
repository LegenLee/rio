import { describe, expect, test, vi } from 'vitest';
import {
  createSelect,
  createSelectOption,
  type SelectContent,
  type SelectOptionInfo,
  type SelectProps,
} from './select';

const OPTIONS: SelectOptionInfo[] = [
  { value: 's', label: 'Small' },
  { value: 'm', label: 'Medium' },
  { value: 2, label: 'Large' },
];
const ids = { field: 'f', label: 'l', listbox: 'lb', supportingText: 'st' };

const setup = (props: SelectProps = {}, content?: SelectContent) => {
  const onChange = vi.fn();
  const onOpenChange = vi.fn();
  const select = createSelect({
    props: () => ({ label: 'Size', ...props }),
    options: () => OPTIONS,
    content: content && (() => content),
    ids,
    onChange,
    onOpenChange,
  });
  return { select, onChange, onOpenChange };
};

describe('createSelect', () => {
  test('a filled text field root, with its own class, that is empty and closed at first', () => {
    expect(setup().select.parts.root()).toEqual({
      class: 'rio-text-field rio-select',
      'data-variant': 'filled',
      'data-populated': undefined,
      'data-label': '',
      'data-leading-icon': undefined,
      'data-trailing-icon': '',
      'data-focused': undefined,
      'data-open': undefined,
      'data-error': undefined,
      'data-disabled': undefined,
    });
  });

  test('while open, the field looks focused', () => {
    const root = setup({ open: true }).select.parts.root();
    expect(root['data-open']).toBe('');
    expect(root['data-focused']).toBe('');
  });

  test('the field is a combobox named by the label, which controls the listbox', () => {
    const { parts } = setup({ open: true, required: true, error: true }).select;
    expect(parts.field()).toEqual({
      class: 'rio-text-field__input rio-select__field',
      id: 'f',
      role: 'combobox',
      tabindex: '0',
      'aria-labelledby': 'l',
      'aria-haspopup': 'listbox',
      'aria-expanded': 'true',
      'aria-controls': 'lb',
      'aria-required': 'true',
      'aria-invalid': 'true',
      'aria-disabled': undefined,
      'aria-describedby': undefined,
    });
    expect(parts.label()).toMatchObject({ id: 'l' });
    expect(parts.listbox()).toMatchObject({ id: 'lb', role: 'listbox', 'aria-labelledby': 'l' });
  });

  test('without a label, the list takes the name the app gave the field', () => {
    const select = (appName: { label?: string; labelledBy?: string }) =>
      createSelect({
        props: () => ({}),
        options: () => OPTIONS,
        ids,
        appName: () => appName,
        onChange: () => {},
        onOpenChange: () => {},
      });
    expect(select({ label: 'Size' }).parts.listbox()).toMatchObject({
      'aria-label': 'Size',
      'aria-labelledby': undefined,
    });
    expect(select({ labelledBy: 'heading' }).parts.listbox()).toMatchObject({
      'aria-label': undefined,
      'aria-labelledby': 'heading',
    });
    // The field keeps the app's own, which `mergePartAttrs` leaves in place.
    expect(select({ labelledBy: 'heading' }).parts.field()['aria-labelledby']).toBeUndefined();
    // With a label, the label names both.
    expect(setup().select.parts.listbox()['aria-label']).toBeUndefined();
  });

  test('disabled: out of the tab order, and it doesn’t open', () => {
    const { select, onOpenChange } = setup({ disabled: true });
    expect(select.parts.field().tabindex).toBeUndefined();
    expect(select.parts.field()['aria-disabled']).toBe('true');
    expect(select.parts.native().disabled).toBe('');
    select.setOpen(true);
    expect(onOpenChange).not.toHaveBeenCalled();
    select.setOpen(false);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  test('shows the selected option’s label', () => {
    const { select } = setup({ selected: 2 });
    expect(select.valueText()).toBe('Large');
    expect(select.parts.root()['data-populated']).toBe('');
  });

  test('multiple: the selected labels in the options’ order, separated by commas', () => {
    const { select } = setup({ multiple: true, selected: [2, 's', 'm'] });
    expect(select.valueText()).toBe('Small, Medium, Large');
    expect(select.selectedLabels()).toEqual(['Small', 'Medium', 'Large']);
    expect(select.parts.listbox()['aria-multiselectable']).toBe('true');
  });

  test('a selected value without an option shows nothing', () => {
    const { select } = setup({ selected: 'x' });
    expect(select.valueText()).toBe('');
    expect(select.parts.root()['data-populated']).toBeUndefined();
    expect(setup({ multiple: true, selected: ['x', 'm'] }).select.valueText()).toBe('Medium');
  });

  test('the field makes room for the label and every option', () => {
    expect(setup().select.sizerTexts()).toEqual(['Size', 'Small', 'Medium', 'Large']);
  });

  test('choosing selects and asks to close; choosing the selected one only closes', () => {
    const { select, onChange, onOpenChange } = setup({ selected: 's' });
    select.choose('m');
    expect(onChange).toHaveBeenCalledWith('m');
    expect(onOpenChange).toHaveBeenCalledWith(false);
    onChange.mockClear();
    select.choose('s');
    expect(onChange).not.toHaveBeenCalled();
  });

  test('multiple: choosing adds or takes out, and the list stays open', () => {
    const { select, onChange, onOpenChange } = setup({ multiple: true, selected: ['s'] });
    select.choose('m');
    expect(onChange).toHaveBeenLastCalledWith(['s', 'm']);
    select.choose('s');
    expect(onChange).toHaveBeenLastCalledWith([]);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  test('the native select’s values map back to the options’ own', () => {
    const single = setup({ selected: 's' });
    single.select.nativeChanged(['2']);
    expect(single.onChange).toHaveBeenCalledWith(2);
    single.onChange.mockClear();
    // No option: nothing to report
    single.select.nativeChanged(['']);
    expect(single.onChange).not.toHaveBeenCalled();

    const multiple = setup({ multiple: true });
    multiple.select.nativeChanged(['m', '2']);
    expect(multiple.onChange).toHaveBeenCalledWith(['m', 2]);
  });

  test('the native select carries the form attributes', () => {
    const { select } = setup({ name: 'size', autocomplete: 'off', required: true, multiple: true });
    expect(select.parts.native()).toEqual({
      class: 'rio-select__native',
      'aria-hidden': 'true',
      tabindex: '-1',
      name: 'size',
      autocomplete: 'off',
      multiple: '',
      required: '',
      disabled: undefined,
    });
    expect(select.nativeValue(2)).toBe('2');
  });

  test('the label ends with an asterisk when required', () => {
    expect(setup({ required: true }).select.labelText()).toBe('Size*');
  });

  test('error text replaces the supporting text, as an alert', () => {
    const { select } = setup({ supportingText: 'Pick one', error: true, errorText: 'Required' });
    expect(select.supportingTextNow()).toBe('Required');
    expect(select.showsErrorText()).toBe(true);
    expect(select.parts.supportingText().role).toBe('alert');
    expect(select.parts.field()['aria-describedby']).toBe('st');
  });

  test('the list takes the menu’s color style and motion', () => {
    expect(setup({ menuVariant: 'vibrant', instant: true }).select.parts.listbox()).toMatchObject({
      class: 'rio-menu rio-select__listbox',
      'data-variant': 'vibrant',
      'data-instant': '',
    });
  });
});

describe('createSelectOption', () => {
  const optionOf = (value: string, disabled = false, selected: string[] = []) => {
    const choose = vi.fn();
    const onClick = vi.fn();
    const option = createSelectOption({
      props: () => ({ value, disabled }),
      select: () => ({ isSelected: (v) => selected.includes(v as string), choose }),
      onClick,
    });
    return { option, choose, onClick };
  };

  test('a menu item’s look, with the option role', () => {
    expect(optionOf('s', false, ['s']).option.parts.root()).toEqual({
      class: 'rio-menu-item rio-state-layer rio-focus-ring rio-select-option',
      type: 'button',
      role: 'option',
      tabindex: '-1',
      'aria-selected': 'true',
      'aria-disabled': undefined,
      'data-selected': 'true',
      'data-focus-ring': 'inner',
    });
  });

  test('a click chooses it', () => {
    const { option, choose, onClick } = optionOf('m');
    const event = { preventDefault: vi.fn() } as unknown as MouseEvent;
    option.handleClick(event);
    expect(onClick).toHaveBeenCalledWith(event);
    expect(choose).toHaveBeenCalledWith('m');
  });

  test('disabled: still focusable, but a click chooses nothing', () => {
    const { option, choose } = optionOf('m', true);
    expect(option.parts.root()['aria-disabled']).toBe('true');
    const event = { preventDefault: vi.fn() } as unknown as MouseEvent;
    option.handleClick(event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(choose).not.toHaveBeenCalled();
  });
});
