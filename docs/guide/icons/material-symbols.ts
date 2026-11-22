// Rio's icons from Material Symbols, an icon font whose ligatures draw an icon for its name. Load
// the font with the icons the app uses, their names in alphabetical order, in the page's <head>:
//
// <link
//   rel="stylesheet"
//   href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined&icon_names=arrow_drop_down,arrow_right,calendar_today,check,chevron_left,chevron_right,close,edit,keyboard,keyboard_arrow_down,schedule,swipe_vertical&display=block"
// />
//
// Then give them to Rio once: `app.use(createRio({ icons }))`. `resolve` takes any of the font's
// names, as in `<RioIcon icon="home" />`, once `home` is in the list too.
import type { RioIcons } from '@rio-m3e/vue';

export const icons: RioIcons = {
  aliases: {
    dropdown: 'arrow_drop_down',
    previous: 'chevron_left',
    next: 'chevron_right',
    edit: 'edit',
    calendar: 'calendar_today',
    keyboard: 'keyboard',
    clock: 'schedule',
    swipe: 'swipe_vertical',
    remove: 'close',
    menu: 'keyboard_arrow_down',
    check: 'check',
    submenu: 'arrow_right',
  },
  resolve: (name) => ({ type: 'ligature', name, className: 'material-symbols-outlined' }),
};
