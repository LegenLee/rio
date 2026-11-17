import { mdiCheck, mdiRuler } from '@mdi/js';
import { describe, expect, test, vi } from 'vitest';
import { defineComponent, h, reactive } from 'vue';
import { icon, renderGallery, SCHEMES } from '../test/vrt';
import Select from './Select.vue';
import SelectOption from './SelectOption.vue';

/** Waits out the labels' motion. */
const settled = () => vi.waitFor(() => expect(document.getAnimations()).toHaveLength(0));

const SIZES = ['Small', 'Medium', 'Large', 'Extra large'];
const options = () =>
  SIZES.map((size) =>
    h(
      SelectOption,
      { value: size, disabled: size === 'Large' },
      {
        default: () => size,
        icon: ({ selected }: { selected: boolean }) => (selected ? icon(mdiCheck) : null),
      },
    ),
  );

const row = (variant: 'filled' | 'outlined') => [
  h(Select, { variant, label: 'Empty' }, options),
  h(Select, { variant, label: 'Size', modelValue: 'Medium' }, options),
  h(
    Select,
    { variant, label: 'Sizes', multiple: true, modelValue: ['Small', 'Medium', 'Extra large'] },
    { default: options, 'leading-icon': () => icon(mdiRuler) },
  ),
  h(
    Select,
    { variant, label: 'Size', required: true, error: true, errorText: 'Choose a size' },
    options,
  ),
  h(
    Select,
    { variant, label: 'Disabled', modelValue: 'Small', supportingText: 'Fixed', disabled: true },
    options,
  ),
];

describe('RioSelect', () => {
  test.each(SCHEMES)('variants and states, %s', async (scheme) => {
    const gallery = await renderGallery(scheme, () =>
      (['filled', 'outlined'] as const).flatMap((variant) => {
        const selects = row(variant);
        return [selects.slice(0, 3), selects.slice(3)];
      }),
    );
    await settled();
    await expect.element(gallery).toMatchScreenshot(`states-${scheme}`);
  });

  test.each(SCHEMES)('open, %s', async (scheme) => {
    const open = reactive({ value: false });
    const Open = defineComponent(
      () => () =>
        h('div', { style: { blockSize: '320px' } }, [
          h(
            Select,
            {
              label: 'Size',
              modelValue: 'Medium',
              instant: true,
              open: open.value,
              'onUpdate:open': (next: boolean) => (open.value = next),
            },
            options,
          ),
        ]),
    );
    const gallery = await renderGallery(scheme, () => [[h(Open)]]);
    open.value = true;
    const listbox = () => document.querySelector<HTMLElement>('[role="listbox"]')!;
    await vi.waitFor(() =>
      expect(listbox().matches(':popover-open') && listbox().dataset.side).toBeTruthy(),
    );
    (document.activeElement as HTMLElement | null)?.blur();
    await settled();
    await expect.element(gallery).toMatchScreenshot(`open-${scheme}`);
  });
});
