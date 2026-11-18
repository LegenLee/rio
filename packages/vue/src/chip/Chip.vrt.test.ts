import { mdiAccount, mdiCalendar, mdiCheck, mdiClose, mdiMenuDown } from '@mdi/js';
import { describe, expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';
import { h } from 'vue';
import { icon, keyboardFocus, renderGallery, SCHEMES } from '../test/vrt';
import AssistChip from './AssistChip.vue';
import ChipSet from './ChipSet.vue';
import FilterChip from './FilterChip.vue';
import InputChip from './InputChip.vue';
import SuggestionChip from './SuggestionChip.vue';

const calendar = { icon: () => icon(mdiCalendar) };
const check = { 'selected-icon': () => icon(mdiCheck) };
const close = { 'remove-icon': () => icon(mdiClose) };
const dropdown = { 'dropdown-icon': () => icon(mdiMenuDown) };
const avatar = {
  avatar: () =>
    h('svg', { viewBox: '0 0 24 24' }, [h('rect', { width: 24, height: 24, fill: '#b0437a' })]),
};
const label = (text: string) => ({ default: () => text });

describe('chips', () => {
  test.each(SCHEMES)('every type and state, %s', async (scheme) => {
    const gallery = await renderGallery(scheme, () => [
      [
        h(AssistChip, null, label('Assist')),
        h(AssistChip, null, { ...calendar, ...label('Add to calendar') }),
        h(AssistChip, { elevated: true }, { ...calendar, ...label('Elevated') }),
        h(AssistChip, { disabled: true }, { ...calendar, ...label('Disabled') }),
        h(AssistChip, { elevated: true, disabled: true }, label('Elevated, disabled')),
      ],
      [
        h(FilterChip, null, { ...check, ...label('Filter') }),
        h(FilterChip, { selected: true }, { ...check, ...label('Selected') }),
        h(FilterChip, { elevated: true }, { ...check, ...label('Elevated') }),
        h(FilterChip, { elevated: true, selected: true }, { ...check, ...label('Elevated, on') }),
        h(FilterChip, { menu: true }, { ...dropdown, ...label('Menu') }),
        h(
          FilterChip,
          { menu: true, open: true, selected: true },
          { ...dropdown, ...label('Open') },
        ),
        h(FilterChip, { disabled: true, selected: true }, { ...check, ...label('Disabled') }),
      ],
      [
        h(InputChip, null, { ...close, ...label('Input') }),
        h(InputChip, null, { ...close, ...avatar, ...label('Avatar') }),
        h(InputChip, null, { ...close, icon: () => icon(mdiAccount), ...label('Icon') }),
        h(InputChip, { removeOnly: true }, { ...close, ...label('Remove only') }),
        h(InputChip, { disabled: true }, { ...close, ...avatar, ...label('Disabled') }),
      ],
      [
        h(SuggestionChip, null, label('Suggestion')),
        h(SuggestionChip, null, { ...calendar, ...label('With an icon') }),
        h(SuggestionChip, { elevated: true }, label('Elevated')),
        h(SuggestionChip, { softDisabled: true }, label('Soft-disabled')),
      ],
    ]);
    await expect.element(gallery).toMatchScreenshot(`chips-${scheme}`);
  });

  test('keyboard focus on a chip and on a remove button, and hover', async () => {
    const gallery = await renderGallery('light', () => [
      [
        h(ChipSet, { 'aria-label': 'Filters' }, () => [
          h(FilterChip, { selected: true }, { ...check, ...label('Focused') }),
          h(FilterChip, null, { ...check, ...label('Hovered') }),
        ]),
        h(InputChip, null, { ...close, ...label('Remove focused') }),
      ],
    ]);
    const [focused, hovered] = gallery.getByRole('button').elements() as HTMLElement[];
    await keyboardFocus(focused!);
    expect(focused!.matches(':focus-visible')).toBe(true);
    await userEvent.hover(hovered!);
    await expect.element(gallery).toMatchScreenshot('interaction-chip');
    const remove = gallery.getByRole('button', { name: 'Remove Remove focused' });
    await keyboardFocus(remove.element() as HTMLElement);
    await expect.element(gallery).toMatchScreenshot('interaction-remove');
  });
});
