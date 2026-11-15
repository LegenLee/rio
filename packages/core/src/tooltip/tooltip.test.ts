import { describe, expect, test } from 'vitest';
import { createTooltip, type TooltipContent, type TooltipProps } from './tooltip';

const ids = { root: 't', subhead: 't-subhead', supportingText: 't-text' };
const setup = (props: TooltipProps = {}, content?: TooltipContent) =>
  createTooltip({ props: () => props, content: content && (() => content), ids });

describe('createTooltip', () => {
  test('a plain tooltip by default, with the tooltip role, above its element', () => {
    const tooltip = setup();
    expect(tooltip.parts.root()).toEqual({
      class: 'rio-tooltip',
      id: 't',
      role: 'tooltip',
      'aria-labelledby': undefined,
      'data-variant': 'plain',
    });
    expect(tooltip.parts.trigger()).toEqual({ class: 'rio-tooltip-trigger' });
    expect(tooltip.parts.supportingText()).toEqual({
      class: 'rio-tooltip__supporting-text',
      id: 't-text',
    });
    expect(tooltip.placement()).toEqual({ side: 'top', align: 'center', offset: 4 });
  });

  test('a rich tooltip shows below its element, start edges lined up', () => {
    expect(setup({ variant: 'rich' }).placement()).toEqual({
      side: 'bottom',
      align: 'start',
      offset: 4,
    });
    expect(setup({ variant: 'rich', side: 'end', align: 'center', offset: 8 }).placement()).toEqual(
      { side: 'end', align: 'center', offset: 8 },
    );
  });

  test('a subhead and actions show in a rich tooltip only', () => {
    const both = { subhead: true, actions: true };
    const plain = setup({}, both);
    expect([plain.showsSubhead(), plain.showsActions(), plain.interactive()]).toEqual([
      false,
      false,
      false,
    ]);
    const rich = setup({ variant: 'rich' }, both);
    expect([rich.showsSubhead(), rich.showsActions(), rich.interactive()]).toEqual([
      true,
      true,
      true,
    ]);
  });

  test('with actions, a rich tooltip is a dialog named by its subhead, or else its text', () => {
    const named = setup({ variant: 'rich' }, { subhead: true, actions: true });
    expect(named.parts.root()).toMatchObject({ role: 'dialog', 'aria-labelledby': 't-subhead' });
    const unnamed = setup({ variant: 'rich' }, { subhead: false, actions: true });
    expect(unnamed.parts.root()).toMatchObject({ role: 'dialog', 'aria-labelledby': 't-text' });
    const text = setup({ variant: 'rich' }, { subhead: true, actions: false });
    expect(text.parts.root()).toMatchObject({ role: 'tooltip', 'aria-labelledby': undefined });
  });

  test('only a rich tooltip can be persistent', () => {
    expect(setup({ persistent: true }).persistent()).toBe(false);
    expect(setup({ variant: 'rich', persistent: true }).persistent()).toBe(true);
    expect(setup({ variant: 'rich' }).persistent()).toBe(false);
  });
});
