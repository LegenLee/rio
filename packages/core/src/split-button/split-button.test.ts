import { describe, expect, test, vi } from 'vitest';
import { createSplitButton, type SplitButtonContent, type SplitButtonProps } from './split-button';

const setup = (props: Partial<SplitButtonProps> = {}, content?: SplitButtonContent) => {
  const onClick = vi.fn();
  const onChange = vi.fn();
  const button = createSplitButton({
    props: () => ({ menuLabel: 'More watch options', ...props }),
    content: content && (() => content),
    onClick,
    onChange,
  });
  return { button, onClick, onChange };
};

const click = () => ({ preventDefault: vi.fn() }) as unknown as MouseEvent;

describe('parts', () => {
  test('the leading button is a small, filled, round button', () => {
    expect(setup().button.parts.leading()).toMatchObject({
      class: 'rio-button rio-state-layer rio-focus-ring rio-split-button__leading',
      type: 'button',
      'data-variant': 'filled',
      'data-size': 'small',
      'data-shape': 'round',
      'aria-pressed': undefined,
    });
  });

  test('the trailing button is named, says what it opens, and whether it is open', () => {
    const closed = setup().button.parts.trailing();
    expect(closed).toMatchObject({
      class: 'rio-button rio-state-layer rio-focus-ring rio-split-button__trailing',
      type: 'button',
      'aria-label': 'More watch options',
      'aria-haspopup': 'menu',
      'aria-expanded': 'false',
      'data-open': undefined,
    });
    expect(setup({ open: true, popup: 'dialog' }).button.parts.trailing()).toMatchObject({
      'aria-haspopup': 'dialog',
      'aria-expanded': 'true',
      'data-open': '',
    });
  });

  test('the trailing button never submits, whatever the leading one does', () => {
    const { parts } = setup({ type: 'submit' }).button;
    expect(parts.leading().type).toBe('submit');
    expect(parts.trailing().type).toBe('button');
  });

  test('variant, size, and disabled reach both buttons', () => {
    const { parts } = setup({ variant: 'outlined', size: 'large', disabled: true }).button;
    for (const part of [parts.leading(), parts.trailing()]) {
      expect(part).toMatchObject({
        'data-variant': 'outlined',
        'data-size': 'large',
        disabled: '',
      });
    }
  });

  test('an icon-only leading button is named by label', () => {
    const { parts } = setup({ label: 'Watch later' }, { icon: true, label: false }).button;
    expect(parts.leading()['aria-label']).toBe('Watch later');
  });

  test('label text keeps naming the leading button, so label is ignored (WCAG 2.5.3)', () => {
    for (const content of [undefined, { icon: true, label: true }]) {
      const { parts } = setup({ label: 'Something else' }, content).button;
      expect(parts.leading()['aria-label']).toBeUndefined();
    }
  });

  test('the inner parts carry their classes', () => {
    const { parts } = setup().button;
    expect(parts.root()).toEqual({ class: 'rio-split-button' });
    expect(parts.touch()).toEqual({
      class: 'rio-button__touch rio-touch-target',
      'aria-hidden': 'true',
    });
    expect(parts.menuIcon()).toEqual({
      class: 'rio-split-button__menu-icon',
      'aria-hidden': 'true',
    });
  });
});

describe('content', () => {
  test('follows what the adapter reports', () => {
    const { button } = setup({}, { icon: true, label: false });
    expect([button.showsIcon(), button.showsLabel()]).toEqual([true, false]);
  });

  test('is a label alone without any content', () => {
    const { button } = setup();
    expect([button.showsIcon(), button.showsLabel()]).toEqual([false, true]);
  });
});

describe('clicks', () => {
  test('the leading button reports clicks and leaves the menu alone', () => {
    const { button, onClick, onChange } = setup();
    const event = click();
    button.handleLeadingClick(event);
    expect(onClick).toHaveBeenCalledWith(event);
    expect(onChange).not.toHaveBeenCalled();
  });

  test('the trailing button requests the opposite of open', () => {
    const closed = setup();
    closed.button.handleTrailingClick(click());
    expect(closed.onChange).toHaveBeenCalledWith(true);
    const open = setup({ open: true });
    open.button.handleTrailingClick(click());
    expect(open.onChange).toHaveBeenCalledWith(false);
    expect(open.onClick).not.toHaveBeenCalled();
  });

  test.each<Partial<SplitButtonProps>>([{ disabled: true }, { softDisabled: true }])(
    'blocks both buttons when %o',
    (props) => {
      const { button, onClick, onChange } = setup(props);
      const events = [click(), click()];
      button.handleLeadingClick(events[0]!);
      button.handleTrailingClick(events[1]!);
      expect(onClick).not.toHaveBeenCalled();
      expect(onChange).not.toHaveBeenCalled();
      for (const event of events) expect(event.preventDefault).toHaveBeenCalled();
    },
  );
});
