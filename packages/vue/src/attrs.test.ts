// The app's own attributes on the element that takes them, next to the attributes from core's
// parts (`mergePartAttrs`): what core leaves out keeps the app's value, what core sets wins, and
// id lists add up, the app's ids first.
import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-vue';
import { defineComponent, h, reactive, type VNode } from 'vue';
import Checkbox from './checkbox/Checkbox.vue';
import Menu from './menu/Menu.vue';
import MenuItem from './menu/MenuItem.vue';
import SubMenu from './menu/SubMenu.vue';
import Radio from './radio/Radio.vue';
import RadioGroup from './radio/RadioGroup.vue';
import Select from './select/Select.vue';
import SelectOption from './select/SelectOption.vue';
import TextField from './text-field/TextField.vue';

/** What the app gives every component: an id list, a class, and `false` for the attribute core sets */
const app = (set: string) => ({ 'aria-describedby': 'hint', class: 'app', [set]: 'false' });

interface Case {
  /** The component with the app's attributes, and `error` (or `disabled`) from `state` */
  vnode: (state: { on: boolean }) => VNode;
  /** The element the attributes go to */
  target: string;
  /** The attribute core sets while `state.on`, and its value then */
  set: [string, string];
  /** With `state.on`, the id core adds to `aria-describedby`, if any */
  describedBy?: (target: Element) => string;
}

const CASES: [string, Case][] = [
  [
    'RioTextField',
    {
      vnode: ({ on }) =>
        h(TextField, {
          ...app('aria-invalid'),
          error: on,
          supportingText: on ? 'Hint' : undefined,
        }),
      target: 'input',
      set: ['aria-invalid', 'true'],
      describedBy: (input) =>
        input.closest('.rio-text-field')!.querySelector('.rio-text-field__supporting-text')!.id,
    },
  ],
  [
    'RioSelect',
    {
      vnode: ({ on }) =>
        h(
          Select,
          {
            ...app('aria-invalid'),
            label: 'Size',
            error: on,
            supportingText: on ? 'Hint' : undefined,
          },
          () => h(SelectOption, { value: 's' }, () => 'Small'),
        ),
      target: '[role="combobox"]',
      set: ['aria-invalid', 'true'],
      describedBy: (field) =>
        field.closest('.rio-select')!.querySelector('.rio-text-field__supporting-text')!.id,
    },
  ],
  [
    'RioCheckbox',
    {
      vnode: ({ on }) => h(Checkbox, { ...app('aria-invalid'), error: on }),
      target: 'input',
      set: ['aria-invalid', 'true'],
    },
  ],
  [
    'RioRadio',
    {
      vnode: ({ on }) =>
        h(RadioGroup, { label: 'Size' }, () =>
          h(Radio, { ...app('aria-disabled'), value: 's', softDisabled: on }),
        ),
      target: 'input',
      set: ['aria-disabled', 'true'],
    },
  ],
  [
    'RioSubMenu',
    {
      vnode: ({ on }) =>
        h(Menu, { label: 'Edit' }, () =>
          h(SubMenu, { ...app('aria-disabled'), label: 'Share', disabled: on }, () =>
            h(MenuItem, () => 'Email'),
          ),
        ),
      target: '[aria-haspopup="menu"]',
      set: ['aria-disabled', 'true'],
    },
  ],
];

describe.each(CASES)('%s', (_, { vnode, target, set, describedBy }) => {
  const setup = async () => {
    const state = reactive({ on: false });
    const screen = await render(defineComponent(() => () => vnode(state)));
    const element = () => (screen.container as HTMLElement).querySelector(target)!;
    return { state, element };
  };

  test('keeps the app’s attributes where core sets none, and its class', async () => {
    const { element } = await setup();
    expect(element().getAttribute('aria-describedby')).toBe('hint');
    expect(element().getAttribute(set[0])).toBe('false');
    if (target === '[aria-haspopup="menu"]') expect(element().classList.contains('app')).toBe(true);
  });

  test('core’s own value wins while it has one, and gives the app’s back after', async () => {
    const { state, element } = await setup();
    state.on = true;
    await expect.poll(() => element().getAttribute(set[0])).toBe(set[1]);
    state.on = false;
    await expect.poll(() => element().getAttribute(set[0])).toBe('false');
  });

  if (describedBy) {
    test('aria-describedby lists the app’s ids, then core’s', async () => {
      const { state, element } = await setup();
      state.on = true;
      await vi.waitFor(() =>
        expect(element().getAttribute('aria-describedby')).toBe(`hint ${describedBy(element())}`),
      );
    });
  }
});
