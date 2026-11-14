import { mdiCheck, mdiClose } from '@mdi/js';
import { describe, expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';
import { h } from 'vue';
import { icon, keyboardFocus, renderGallery, SCHEMES } from '../test/vrt';
import Switch from './Switch.vue';

const selectedIcon = { 'selected-icon': () => icon(mdiCheck) };
const bothIcons = { ...selectedIcon, 'unselected-icon': () => icon(mdiClose) };

describe('RioSwitch', () => {
  test.each(SCHEMES)('states and icons, %s', async (scheme) => {
    const gallery = await renderGallery(scheme, () => [
      [h(Switch), h(Switch, { selected: true })],
      [h(Switch, null, selectedIcon), h(Switch, { selected: true }, selectedIcon)],
      [h(Switch, null, bothIcons), h(Switch, { selected: true }, bothIcons)],
      [h(Switch, { disabled: true }), h(Switch, { disabled: true, selected: true })],
      [
        h(Switch, { disabled: true }, bothIcons),
        h(Switch, { disabled: true, selected: true }, bothIcons),
      ],
    ]);
    await expect.element(gallery).toMatchScreenshot(`states-${scheme}`);
  });

  test('keyboard focus and hover', async () => {
    const gallery = await renderGallery('light', () => [
      [h(Switch, { selected: true }), h(Switch)],
    ]);
    const [focused, hovered] = gallery.getByRole('switch').elements() as HTMLElement[];
    await keyboardFocus(focused!);
    expect(focused!.matches(':focus-visible')).toBe(true);
    await userEvent.hover(hovered!);
    await expect.element(gallery).toMatchScreenshot('interaction');
  });
});
