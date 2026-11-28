// Rio's icons from Material Design Icons: `@mdi/js` holds each icon's SVG path, and a bundler
// keeps only the ones imported. Give them to Rio once: `app.use(createRio({ icons }))`.
import {
  mdiCalendar,
  mdiCheck,
  mdiChevronDown,
  mdiChevronLeft,
  mdiChevronRight,
  mdiClockOutline,
  mdiClose,
  mdiGestureSwipeVertical,
  mdiKeyboardOutline,
  mdiMenuDown,
  mdiMenuRight,
  mdiPencil,
} from '@mdi/js';
import type { RioIcons } from '@rio-m3e/vue';

const svg = (path: string) => ({ type: 'svg', path }) as const;

export const icons: RioIcons = {
  aliases: {
    dropdown: svg(mdiMenuDown),
    previous: svg(mdiChevronLeft),
    next: svg(mdiChevronRight),
    edit: svg(mdiPencil),
    calendar: svg(mdiCalendar),
    keyboard: svg(mdiKeyboardOutline),
    clock: svg(mdiClockOutline),
    swipe: svg(mdiGestureSwipeVertical),
    remove: svg(mdiClose),
    menu: svg(mdiChevronDown),
    check: svg(mdiCheck),
    submenu: svg(mdiMenuRight),
    close: svg(mdiClose),
  },
};
