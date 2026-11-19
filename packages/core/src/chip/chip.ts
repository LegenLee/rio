// Chips (assist, filter, input, and suggestion) and the chip set: props, parts, and what a press
// or a key asks for.

import type { ChipMessages } from '../locale/messages';
import type { CancelableEvent, PartAttrs, PartNode } from '../parts';
import { disabledAttrs, isBlocked } from '../utils/disabled';
import { hasModifier } from '../utils/keyboard';
import { linkAttrs } from '../utils/link';
import { resolveProps } from '../utils/object';

/** Identifies a filter chip inside a chip set that keeps a selection, through its `value` prop. */
export type ChipValue = string | number;

/** Whether the set's filter chips can be selected: on their own, one at a time, or any number. */
export const CHIP_SET_SELECTIONS = ['none', 'single', 'multiple'] as const;
export type ChipSetSelection = (typeof CHIP_SET_SELECTIONS)[number];

/** The selected value for `single` (or `undefined`), or the selected values for `multiple`. */
export type ChipSetSelected = ChipValue | ChipValue[] | undefined;

interface ChipCommonProps {
  /** Native disabled: not focusable and not pressable. This is the spec's behavior. */
  disabled?: boolean;
  /**
   * Disabled but still focusable, so it stays discoverable. Presses are blocked in JavaScript
   * instead. This deviates from the spec, which says disabled components can't be focused.
   */
  softDisabled?: boolean;
}

export interface AssistChipProps extends ChipCommonProps {
  /** Lifts the chip off a busy background, such as an image, instead of outlining it. */
  elevated?: boolean;
  /**
   * Makes it a link to this address, an `<a>` that looks the same. Disabled, it keeps no `href`,
   * so nothing can follow it.
   */
  href?: string;
}

export type SuggestionChipProps = AssistChipProps;

export interface FilterChipProps extends ChipCommonProps {
  /** Whether the filter is on. */
  selected?: boolean;
  /** Lifts the chip off a busy background, such as an image, instead of outlining it. */
  elevated?: boolean;
  /**
   * Identifies the chip inside a chip set that keeps a selection. Such a set decides whether the
   * chip is selected.
   */
  value?: ChipValue;
  /**
   * Makes the chip open a menu, which the app anchors to it: a press asks to open or close it
   * (`open`) rather than to select the chip, whose `selected` the app sets, as a filter applies.
   */
  menu?: boolean;
  /** Whether the menu a `menu` chip opens is open. */
  open?: boolean;
}

export interface InputChipProps extends ChipCommonProps {
  /**
   * The chip only removes: it has no action of its own, so the remove button is its one focusable
   * element, named after the chip, and a press anywhere on the chip removes it. Otherwise a press
   * on the chip is its own action, such as editing what it holds.
   */
  removeOnly?: boolean;
}

export const chipDefaults = {
  elevated: false,
  selected: false,
  menu: false,
  open: false,
  removeOnly: false,
  disabled: false,
  softDisabled: false,
} as const;

/**
 * Where the chip stands in a chip set's tab order: the set's one tab stop (`true`), another chip
 * (`false`), or neither, outside a set or before the set has picked one (`undefined`).
 */
type TabStop = () => boolean | undefined;

const tabindexOf = (tabStop: boolean | undefined) =>
  tabStop === undefined ? undefined : tabStop ? '0' : '-1';

/**
 * `data-chip-focus` marks each element a chip set moves the focus through with the arrow keys,
 * with the chip's key, while the chip is in a set and the element can take the focus.
 */
const focusMark = (key: string | undefined, focusable: boolean) =>
  key !== undefined && focusable ? key : undefined;

interface ChipSetMembership {
  /** The chip's key in its chip set, from the adapter. Without it, the chip isn't in a set. */
  key?: () => string | undefined;
  tabStop?: TabStop;
}

// Assist and suggestion chips

/** What the adapter has to put in the chip, which only the adapter can see. */
export interface ActionChipContent {
  /** Whether there is a leading icon. */
  icon: boolean;
}

export interface ActionChipOptions<
  E extends CancelableEvent = MouseEvent,
> extends ChipSetMembership {
  /** Returns the current prop values. */
  props: () => AssistChipProps;
  /** Returns what content the adapter has. Without it, the chip has no icon. */
  content?: () => ActionChipContent;
  /** Called for a click that isn't blocked, with the event `handleClick` got. */
  onClick: (event: E) => void;
}

/** An assist or suggestion chip's markup, part by part. `actionChipSkeleton` nests them. */
export interface ActionChipParts {
  root: () => PartAttrs;
  /** Extends the 32px chip to the 48px target. */
  touch: () => PartAttrs;
  /** Where the state layer and the ripple draw. */
  state: () => PartAttrs;
  icon: () => PartAttrs;
  label: () => PartAttrs;
}

export const actionChipSkeleton: PartNode<keyof ActionChipParts, 'showsIcon'> = {
  part: 'root',
  tag: 'button',
  children: [
    { part: 'touch', tag: 'span' },
    { part: 'state', tag: 'span' },
    { part: 'icon', tag: 'span', when: 'showsIcon', content: true },
    { part: 'label', tag: 'span', content: true },
  ],
};

/** The same parts in an `<a>`, while `isLink()` */
export const actionChipLinkSkeleton: PartNode<keyof ActionChipParts, 'showsIcon'> = {
  ...actionChipSkeleton,
  tag: 'a',
};

export interface ActionChipApi<E extends CancelableEvent = MouseEvent> {
  parts: ActionChipParts;
  showsIcon: () => boolean;
  /** Whether the root is an `<a>` (`actionChipLinkSkeleton`) rather than a `<button>`. */
  isLink: () => boolean;
  /** Whether a press can't act now: disabled or soft-disabled. */
  blocked: () => boolean;
  /** Attach to the root element's `click`. */
  handleClick: (event: E) => void;
}

/** The state part, the same in every chip */
const statePart = () => ({ class: 'rio-chip__state', 'aria-hidden': 'true' });

function createActionChip<E extends CancelableEvent>(
  type: 'assist' | 'suggestion',
  options: ActionChipOptions<E>,
): ActionChipApi<E> {
  const props = () => resolveProps(chipDefaults, options.props());
  const isLink = () => options.props().href !== undefined;
  const showsIcon = () => !!options.content?.().icon;

  return {
    parts: {
      root() {
        const p = props();
        const key = options.key?.();
        const tabStop = options.tabStop?.();
        const common = {
          class: 'rio-chip rio-focus-ring',
          'data-type': type,
          'data-elevated': p.elevated ? '' : undefined,
          'data-icon': showsIcon() ? '' : undefined,
        };
        if (isLink()) {
          const link = linkAttrs(p);
          return {
            ...common,
            ...link,
            // In a set, the set's tab stop; outside one, the link's own.
            tabindex: p.disabled ? undefined : (tabindexOf(tabStop) ?? link.tabindex),
            'data-disabled': isBlocked(p) ? '' : undefined,
            'data-chip-focus': focusMark(key, !p.disabled),
          };
        }
        return {
          ...common,
          type: 'button',
          ...disabledAttrs(p),
          tabindex: p.disabled ? undefined : tabindexOf(tabStop),
          'data-disabled': isBlocked(p) ? '' : undefined,
          'data-chip-focus': focusMark(key, !p.disabled),
        };
      },
      touch: () => ({ class: 'rio-chip__touch rio-touch-target', 'aria-hidden': 'true' }),
      state: statePart,
      // The icon only decorates; the label names the chip.
      icon: () => ({ class: 'rio-chip__icon', 'aria-hidden': 'true' }),
      label: () => ({ class: 'rio-chip__label' }),
    },
    showsIcon,
    isLink,
    blocked: () => isBlocked(props()),
    handleClick(event) {
      if (isBlocked(props())) {
        event.preventDefault();
        return;
      }
      options.onClick(event);
    },
  };
}

/** An assist chip: a smart or automated action, such as adding an event to a calendar. */
export function createAssistChip<E extends CancelableEvent = MouseEvent>(
  options: ActionChipOptions<E>,
): ActionChipApi<E> {
  return createActionChip('assist', options);
}

/** A suggestion chip: a suggestion the product makes, such as a reply in a chat. */
export function createSuggestionChip<E extends CancelableEvent = MouseEvent>(
  options: ActionChipOptions<E>,
): ActionChipApi<E> {
  return createActionChip('suggestion', options);
}

// Filter chips

/** What the adapter has to put in the filter chip, which only the adapter can see. */
export interface FilterChipContent {
  /** Whether there is a leading icon for the unselected chip. */
  icon: boolean;
  /** Whether there is an icon for the selected chip, such as a checkmark. */
  selectedIcon: boolean;
  /** Whether there is a trailing icon for a `menu` chip, such as a dropdown arrow. */
  dropdownIcon: boolean;
}

export interface FilterChipOptions<
  E extends CancelableEvent = MouseEvent,
> extends ChipSetMembership {
  /** Returns the current prop values. The adapter (or a chip set) owns the state. */
  props: () => FilterChipProps;
  /** Returns what content the adapter has. Without it, the chip has no icons. */
  content?: () => FilterChipContent;
  /** Called for a click that isn't blocked, with the event `handleClick` got. */
  onClick: (event: E) => void;
  /** Called after an unblocked click on a chip without a menu, with the requested `selected`. */
  onChange: (selected: boolean) => void;
  /** Called after an unblocked click on a `menu` chip, with the requested `open`. */
  onOpenChange: (open: boolean) => void;
}

export interface FilterChipParts {
  root: () => PartAttrs;
  touch: () => PartAttrs;
  state: () => PartAttrs;
  /** Holds the selected icon while selected and there is one, otherwise the leading icon. */
  icon: () => PartAttrs;
  label: () => PartAttrs;
  /** Holds a `menu` chip's dropdown icon, which turns over while the menu is open. */
  trailing: () => PartAttrs;
}

export const filterChipSkeleton: PartNode<keyof FilterChipParts, 'showsIcon' | 'showsTrailing'> = {
  part: 'root',
  tag: 'button',
  children: [
    { part: 'touch', tag: 'span' },
    { part: 'state', tag: 'span' },
    { part: 'icon', tag: 'span', when: 'showsIcon', content: true },
    { part: 'label', tag: 'span', content: true },
    { part: 'trailing', tag: 'span', when: 'showsTrailing', content: true },
  ],
};

export interface FilterChipApi<E extends CancelableEvent = MouseEvent> {
  parts: FilterChipParts;
  /** Whether the icon part renders: the selected icon while selected, or the leading icon. */
  showsIcon: () => boolean;
  /** Whether the icon part holds the selected icon rather than the leading icon. */
  showsSelectedIcon: () => boolean;
  /** Whether the trailing part renders: a `menu` chip with a dropdown icon. */
  showsTrailing: () => boolean;
  blocked: () => boolean;
  /** Attach to the root element's `click`. */
  handleClick: (event: E) => void;
}

export function createFilterChip<E extends CancelableEvent = MouseEvent>(
  options: FilterChipOptions<E>,
): FilterChipApi<E> {
  const props = () => resolveProps(chipDefaults, options.props());
  const content = () =>
    options.content?.() ?? { icon: false, selectedIcon: false, dropdownIcon: false };
  const showsSelectedIcon = () => props().selected && content().selectedIcon;
  const showsIcon = () => showsSelectedIcon() || (!props().selected && content().icon);
  const showsTrailing = () => props().menu && content().dropdownIcon;

  return {
    parts: {
      root() {
        const p = props();
        const key = options.key?.();
        return {
          class: 'rio-chip rio-focus-ring',
          type: 'button',
          ...disabledAttrs(p),
          // A menu chip is a menu button; its selection shows, and its label says the filter.
          'aria-pressed': p.menu ? undefined : String(p.selected),
          'aria-haspopup': p.menu ? 'menu' : undefined,
          'aria-expanded': p.menu ? String(p.open) : undefined,
          tabindex: p.disabled ? undefined : tabindexOf(options.tabStop?.()),
          'data-type': 'filter',
          'data-selected': String(p.selected),
          'data-elevated': p.elevated ? '' : undefined,
          'data-icon': showsIcon() ? '' : undefined,
          'data-trailing': showsTrailing() ? '' : undefined,
          'data-disabled': isBlocked(p) ? '' : undefined,
          'data-chip-focus': focusMark(key, !p.disabled),
        };
      },
      touch: () => ({ class: 'rio-chip__touch rio-touch-target', 'aria-hidden': 'true' }),
      state: statePart,
      icon: () => ({ class: 'rio-chip__icon', 'aria-hidden': 'true' }),
      label: () => ({ class: 'rio-chip__label' }),
      trailing: () => ({ class: 'rio-chip__trailing', 'aria-hidden': 'true' }),
    },
    showsIcon,
    showsSelectedIcon,
    showsTrailing,
    blocked: () => isBlocked(props()),
    handleClick(event) {
      const p = props();
      if (isBlocked(p)) {
        event.preventDefault();
        return;
      }
      options.onClick(event);
      if (p.menu) options.onOpenChange(!p.open);
      else options.onChange(!p.selected);
    },
  };
}

// Input chips

/** What the adapter has to put in the input chip, which only the adapter can see. */
export interface InputChipContent {
  /** Whether there is a leading icon. */
  icon: boolean;
  /** Whether there is a leading image, such as a person's avatar. It wins over the icon. */
  avatar: boolean;
}

export interface InputChipOptions<
  E extends CancelableEvent = MouseEvent,
> extends ChipSetMembership {
  props: () => InputChipProps;
  content?: () => InputChipContent;
  /** The remove button's name, in the chip's language. */
  messages: () => ChipMessages;
  /** Ids for the label, which names the remove button too, and the remove button's own words. */
  ids: { label: string; removeBefore: string; removeAfter: string };
  /** Called for a click on the chip's action that isn't blocked (not on a `removeOnly` chip). */
  onClick: (event: E) => void;
  /** Called when the person asks to remove the chip: its remove button, or Backspace or Delete. */
  onRemove: () => void;
}

export interface InputChipParts {
  /** Holds the chip's action and its remove button. */
  root: () => PartAttrs;
  /** The chip's action: a `<button>`, or a `<span>` on a `removeOnly` chip. */
  action: () => PartAttrs;
  touch: () => PartAttrs;
  state: () => PartAttrs;
  icon: () => PartAttrs;
  avatar: () => PartAttrs;
  label: () => PartAttrs;
  /** Named after the label, with the words around it (`removeBefore`, `removeAfter`). */
  remove: () => PartAttrs;
  removeTouch: () => PartAttrs;
  /** Holds the app's remove icon. */
  removeIcon: () => PartAttrs;
  /** Hidden; hold the remove button's words before and after the label (`removeText`). */
  removeBefore: () => PartAttrs;
  removeAfter: () => PartAttrs;
}

type InputChipWhen =
  | 'isAction'
  | 'showsIcon'
  | 'showsAvatar'
  | 'showsRemoveBefore'
  | 'showsRemoveAfter';

const inputChipChildren = (
  tag: 'button' | 'span',
): PartNode<keyof InputChipParts, InputChipWhen> => ({
  part: 'action',
  tag,
  children: [
    { part: 'touch', tag: 'span' },
    { part: 'avatar', tag: 'span', when: 'showsAvatar', content: true },
    { part: 'icon', tag: 'span', when: 'showsIcon', content: true },
    { part: 'label', tag: 'span', content: true },
  ],
});

const inputChipSkeletonWith = (
  tag: 'button' | 'span',
): PartNode<keyof InputChipParts, InputChipWhen> => ({
  part: 'root',
  tag: 'span',
  children: [
    { part: 'state', tag: 'span' },
    inputChipChildren(tag),
    {
      part: 'remove',
      tag: 'button',
      children: [
        { part: 'removeTouch', tag: 'span' },
        { part: 'removeIcon', tag: 'span', content: true },
      ],
    },
    { part: 'removeBefore', tag: 'span', when: 'showsRemoveBefore', content: true },
    { part: 'removeAfter', tag: 'span', when: 'showsRemoveAfter', content: true },
  ],
});

export const inputChipSkeleton = inputChipSkeletonWith('button');

/** The same parts on a `removeOnly` chip, whose action is a `<span>`, while `!isAction()` */
export const inputChipRemoveOnlySkeleton = inputChipSkeletonWith('span');

export interface InputChipApi<E extends CancelableEvent = MouseEvent> {
  parts: InputChipParts;
  /** Whether the action is a `<button>` (`inputChipSkeleton`), not a `removeOnly` chip's span. */
  isAction: () => boolean;
  showsIcon: () => boolean;
  showsAvatar: () => boolean;
  showsRemoveBefore: () => boolean;
  showsRemoveAfter: () => boolean;
  /** The remove button's words around the label, as the parts that hold them show them. */
  removeText: () => { before: string; after: string };
  blocked: () => boolean;
  /** Attach to the action's `click`. On a `removeOnly` chip, a click removes the chip. */
  handleClick: (event: E) => void;
  /** Attach to the remove button's `click`. */
  handleRemoveClick: (event: E) => void;
  /**
   * Attach to the root's `keydown`: Backspace and Delete remove the chip. With Alt, Ctrl, or Meta,
   * or once handled, they are left alone.
   */
  handleKeydown: (event: InputChipKeyEvent) => void;
}

/** What `handleKeydown` reads from a key event: a DOM one, or a framework's own */
export interface InputChipKeyEvent extends CancelableEvent {
  key: string;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  defaultPrevented: boolean;
}

/** A message with `{label}`, split around it */
const splitAroundLabel = (message: string) => {
  const at = message.indexOf('{label}');
  if (at < 0) return { before: message.trim(), after: '' };
  return { before: message.slice(0, at).trim(), after: message.slice(at + 7).trim() };
};

export function createInputChip<E extends CancelableEvent = MouseEvent>(
  options: InputChipOptions<E>,
): InputChipApi<E> {
  const props = () => resolveProps(chipDefaults, options.props());
  const content = () => options.content?.() ?? { icon: false, avatar: false };
  const removeText = () => splitAroundLabel(options.messages().remove);
  const showsAvatar = () => content().avatar;
  const showsIcon = () => !showsAvatar() && content().icon;
  const blocked = () => isBlocked(props());

  return {
    parts: {
      root() {
        const p = props();
        return {
          class: 'rio-chip',
          'data-type': 'input',
          'data-icon': showsIcon() ? '' : undefined,
          'data-avatar': showsAvatar() ? '' : undefined,
          'data-remove-only': p.removeOnly ? '' : undefined,
          'data-disabled': blocked() ? '' : undefined,
        };
      },
      action() {
        const p = props();
        const label = { class: 'rio-chip__action' };
        if (p.removeOnly) return label;
        return {
          ...label,
          type: 'button',
          ...disabledAttrs(p),
          tabindex: p.disabled ? undefined : tabindexOf(options.tabStop?.()),
          'data-chip-focus': focusMark(options.key?.(), !p.disabled),
        };
      },
      touch: () => ({ class: 'rio-chip__touch rio-touch-target', 'aria-hidden': 'true' }),
      state: statePart,
      icon: () => ({ class: 'rio-chip__icon', 'aria-hidden': 'true' }),
      avatar: () => ({ class: 'rio-chip__avatar', 'aria-hidden': 'true' }),
      label: () => ({ class: 'rio-chip__label', id: options.ids.label }),
      remove() {
        const p = props();
        const { before, after } = removeText();
        const tabStop = options.tabStop?.();
        return {
          class: 'rio-chip__remove rio-focus-ring',
          type: 'button',
          ...disabledAttrs(p),
          'aria-labelledby': [
            before ? options.ids.removeBefore : '',
            options.ids.label,
            after ? options.ids.removeAfter : '',
          ]
            .filter(Boolean)
            .join(' '),
          // In a set, the arrow keys reach the remove button of a chip with an action of its own.
          tabindex: p.disabled
            ? undefined
            : p.removeOnly
              ? tabindexOf(tabStop)
              : tabStop === undefined
                ? undefined
                : '-1',
          'data-chip-focus': focusMark(options.key?.(), !p.disabled),
        };
      },
      removeTouch: () => ({ class: 'rio-chip__touch rio-touch-target', 'aria-hidden': 'true' }),
      removeIcon: () => ({ class: 'rio-chip__remove-icon', 'aria-hidden': 'true' }),
      removeBefore: () => ({ id: options.ids.removeBefore, hidden: '' }),
      removeAfter: () => ({ id: options.ids.removeAfter, hidden: '' }),
    },
    isAction: () => !props().removeOnly,
    showsIcon,
    showsAvatar,
    showsRemoveBefore: () => removeText().before !== '',
    showsRemoveAfter: () => removeText().after !== '',
    removeText,
    blocked,
    handleClick(event) {
      if (blocked()) {
        event.preventDefault();
        return;
      }
      if (props().removeOnly) options.onRemove();
      else options.onClick(event);
    },
    handleRemoveClick(event) {
      if (blocked()) {
        event.preventDefault();
        return;
      }
      options.onRemove();
    },
    handleKeydown(event) {
      if (event.defaultPrevented || (event.key !== 'Backspace' && event.key !== 'Delete')) return;
      if (hasModifier(event)) return;
      event.preventDefault();
      if (!blocked()) options.onRemove();
    },
  };
}

// The chip set

export interface ChipSetProps {
  /**
   * Makes the filter chips that have a `value` keep their selection in the set. Defaults to
   * `'none'`, where every chip keeps its own.
   */
  selection?: ChipSetSelection;
  /** With a selection, keeps at least one chip selected: the last one can't be turned off. */
  required?: boolean;
  /** The selected value (`single`) or values (`multiple`). */
  selected?: ChipSetSelected;
  /** Keeps the chips on one row that scrolls sideways, instead of wrapping them to new rows. */
  scroll?: boolean;
}

export const chipSetDefaults = {
  selection: 'none',
  required: false,
  scroll: false,
} satisfies Omit<Required<ChipSetProps>, 'selected'>;

export interface ChipSetOptions {
  /** Returns the current prop values. The adapter owns the state. */
  props: () => ChipSetProps;
  /**
   * The key of the chip the set's one tab stop is on, as `attachChipSet` reports it
   * (`onTabStopChange`). The adapter keeps it.
   */
  tabStop: () => string | undefined;
  /** Called with the requested selection. Adapters wire it to v-model, a callback prop, and so on. */
  onChange: (selected: ChipSetSelected) => void;
}

export interface ChipSetParts {
  /** A toolbar, named the way the app names it. */
  root: () => PartAttrs;
}

/** One root, with the chips as its direct children. */
export const chipSetSkeleton: PartNode<keyof ChipSetParts> = {
  part: 'root',
  tag: 'div',
  content: true,
};

export interface ChipSetApi {
  parts: ChipSetParts;
  selection: () => ChipSetSelection;
  isSelected: (value: ChipValue) => boolean;
  /**
   * Requests turning the chip with this value on or off: a single selection turns the previous
   * chip off, and `required` keeps the last one on.
   */
  select: (value: ChipValue, selected: boolean) => void;
  /** For a chip's `tabStop` option: whether the chip with this key is the set's tab stop. */
  isTabStop: (key: string) => boolean | undefined;
}

const valuesOf = (selected: ChipSetSelected): ChipValue[] =>
  selected === undefined ? [] : Array.isArray(selected) ? selected : [selected];

export function createChipSet(options: ChipSetOptions): ChipSetApi {
  const props = () => resolveProps(chipSetDefaults, options.props());
  const isSelected = (value: ChipValue) => {
    const p = props();
    return p.selection !== 'none' && valuesOf(p.selected).includes(value);
  };

  return {
    parts: {
      root: () => ({
        class: 'rio-chip-set',
        role: 'toolbar',
        'data-scroll': props().scroll ? '' : undefined,
      }),
    },
    selection: () => props().selection,
    isSelected,
    select(value, selected) {
      const p = props();
      if (p.selection === 'none' || isSelected(value) === selected) return;
      const current = valuesOf(p.selected);
      if (!selected && p.required && current.length === 1) return;
      if (p.selection === 'single') options.onChange(selected ? value : undefined);
      else options.onChange(selected ? [...current, value] : current.filter((v) => v !== value));
    },
    isTabStop(key) {
      const stop = options.tabStop();
      return stop === undefined ? undefined : stop === key;
    },
  };
}
