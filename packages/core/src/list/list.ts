// M3 Expressive lists: a vertical index of items, each with an optional leading element, a label
// with an optional overline above it and supporting text under it, and an optional trailing
// element. Props, parts, roles, and the selection.
//
// - Without `selection`, a list holds static items and action items. An action item is a link
//   (`href`) or a button (`action`): its primary action covers the item, and what takes the focus
//   in its trailing element is its secondary actions.
// - With `selection`, a list is a list box: its items are options, chosen by a press, Space, or
//   Enter. Their leading and trailing elements take no presses and no focus (`list.css` and
//   `attachList`), so a checkbox, a radio button, or a switch there shows the item's state, the
//   item takes the presses, and their text stays part of the option's name. Each option draws the
//   list's selection control (`control`) in its position (`controlPosition`), unless the app has
//   content there: a radio button with one, a checkbox with several.
// - An item has one, two, or three lines: three with an overline and supporting text, or with
//   supporting text that wraps (`attachListItem` reports it). Three lines align to the top.

import type { PartAttrs, PartNode } from '../parts';
import { linkAttrs } from '../utils/link';
import { resolveProps } from '../utils/object';
import { nextSelection, selectedValues } from '../utils/selection';

/** M3 Expressive list styles: standard, or segmented, its items apart with rounded ends. */
export const LIST_VARIANTS = ['standard', 'segmented'] as const;
export type ListVariant = (typeof LIST_VARIANTS)[number];

/** Whether a list's items can be selected: none, one at a time, or any number. */
export const LIST_SELECTIONS = ['none', 'single', 'multiple'] as const;
export type ListSelection = (typeof LIST_SELECTIONS)[number];

/**
 * The selection control a list box's options draw: a radio button with `single`, a checkbox or a
 * switch with `multiple`, or none, for an icon or another style the app shows the state with.
 */
export const LIST_CONTROLS = ['checkbox', 'radio', 'switch', 'none'] as const;
export type ListControl = (typeof LIST_CONTROLS)[number];

/** Where an option draws the selection control: before its text, or after it. */
export const LIST_CONTROL_POSITIONS = ['leading', 'trailing'] as const;
export type ListControlPosition = (typeof LIST_CONTROL_POSITIONS)[number];

/** The controls each selection takes, its own first */
const SELECTION_CONTROLS: Record<ListSelection, readonly ListControl[]> = {
  none: ['none'],
  single: ['radio', 'none'],
  multiple: ['checkbox', 'switch', 'none'],
};

/** Identifies an item in a list with a selection, through its `value` prop. */
export type ListValue = string | number;
/** The selected value (`single`) or values (`multiple`). */
export type ListSelected = ListValue | ListValue[] | undefined;

export interface ListProps {
  /** Defaults to `'standard'`. */
  variant?: ListVariant;
  /** Makes the list a list box whose items, with their `value`, are chosen. Defaults to `'none'`. */
  selection?: ListSelection;
  /** With a selection, keeps one item selected: the last one can't be turned off. */
  required?: boolean;
  /** The selected value (`single`) or values (`multiple`). */
  selected?: ListSelected;
  /**
   * The selection control each option draws: by default a radio button with `single` and a
   * checkbox with `multiple`. A control the selection doesn't take, such as a checkbox with
   * `single`, gives way to its own.
   */
  control?: ListControl;
  /** Where the options draw the control. Defaults to `'trailing'`. */
  controlPosition?: ListControlPosition;
  /** Names the list for assistive technology. A list box's name says what is chosen. */
  label?: string;
}

export const listDefaults = {
  variant: 'standard',
  selection: 'none',
  required: false,
  controlPosition: 'trailing',
} satisfies Required<Pick<ListProps, 'variant' | 'selection' | 'required' | 'controlPosition'>>;

export interface ListOptions {
  props: () => ListProps;
  /** The key of the item the list's tab stop is on, as the adapter keeps it (`attachList`). */
  tabStop: () => string | undefined;
  /** Called with the requested selection. */
  onChange: (selected: ListSelected) => void;
}

export interface ListParts {
  /** A `<ul>`: a list, or with a selection, a list box */
  root: () => PartAttrs;
}

/** The list's markup: a `<ul>` whose children are the items (`listItemSkeleton`). */
export const listSkeleton: PartNode<'root'> = { part: 'root', tag: 'ul', content: true };

export interface ListApi {
  parts: ListParts;
  variant: () => ListVariant;
  selection: () => ListSelection;
  /** The selection control the options draw, one the selection takes: `none` without a selection. */
  control: () => ListControl;
  controlPosition: () => ListControlPosition;
  isSelected: (value: ListValue) => boolean;
  /** Turns the item with this value on or off, as the selection's rules allow. */
  toggle: (value: ListValue) => void;
  /**
   * Whether the item with this key is the list's tab stop, or `undefined` until `attachList` has
   * picked one, while every item keeps its own focus.
   */
  isTabStop: (key: string) => boolean | undefined;
}

export function createList(options: ListOptions): ListApi {
  const props = () => resolveProps(listDefaults, options.props());
  const isSelected = (value: ListValue) => {
    const p = props();
    return p.selection !== 'none' && selectedValues(p.selected).includes(value);
  };
  return {
    parts: {
      root() {
        const p = props();
        return {
          class: 'rio-list',
          role: p.selection === 'none' ? undefined : 'listbox',
          'aria-multiselectable': p.selection === 'multiple' ? 'true' : undefined,
          'aria-label': p.label,
          'data-variant': p.variant,
        };
      },
    },
    variant: () => props().variant,
    selection: () => props().selection,
    control() {
      const p = props();
      const takes = SELECTION_CONTROLS[p.selection];
      return p.control !== undefined && takes.includes(p.control) ? p.control : takes[0]!;
    },
    controlPosition: () => props().controlPosition,
    isSelected,
    toggle(value) {
      const next = nextSelection(props(), value, !isSelected(value));
      if (next) options.onChange(next.selected);
    },
    isTabStop: (key) => {
      const stop = options.tabStop();
      return stop === undefined ? undefined : stop === key;
    },
  };
}

// The items

/** What an item is, from its list and its props */
export type ListItemKind = 'static' | 'link' | 'button' | 'option';

export interface ListItemProps {
  /** Identifies the item in a list with a selection. */
  value?: ListValue;
  /** Makes the item a link to this address, its primary action. */
  href?: string;
  /** Makes the item a button, its primary action. The adapter sets it when the app listens for clicks. */
  action?: boolean;
  /** Disabled items stay focusable among the list's items, and nothing they do happens. */
  disabled?: boolean;
}

/** Which of the item's content the adapter has */
export interface ListItemContent {
  leading: boolean;
  overline: boolean;
  supporting: boolean;
  trailing: boolean;
}

export interface ListItemOptions {
  props: () => ListItemProps;
  /** The list around the item */
  list: () => Pick<
    ListApi,
    'selection' | 'control' | 'controlPosition' | 'isSelected' | 'toggle' | 'isTabStop'
  >;
  /** The item's key among the list's items, unique in the list */
  key: string;
  content: () => ListItemContent;
  /** Whether the supporting text runs over more than one line, as `attachListItem` reports it */
  multiline: () => boolean;
}

export interface ListItemParts {
  /** An `<li>`: with a selection, the option itself */
  root: () => PartAttrs;
  /** A link item's `<a>` or a button item's `<button>`, holding the leading element and the text */
  action: () => PartAttrs;
  leading: () => PartAttrs;
  /** The overline, the label, and the supporting text */
  text: () => PartAttrs;
  overline: () => PartAttrs;
  label: () => PartAttrs;
  supporting: () => PartAttrs;
  /** Beside the action, so it can hold secondary actions */
  trailing: () => PartAttrs;
}

type ListItemWhen = 'acts' | 'showsLeading' | 'showsOverline' | 'showsSupporting' | 'showsTrailing';
type ListItemPart =
  | 'root'
  | 'action'
  | 'leading'
  | 'text'
  | 'overline'
  | 'label'
  | 'supporting'
  | 'trailing';

const textSkeleton: PartNode<ListItemPart, ListItemWhen> = {
  part: 'text',
  tag: 'span',
  children: [
    { part: 'overline', tag: 'span', when: 'showsOverline', content: true },
    { part: 'label', tag: 'span', content: true },
    { part: 'supporting', tag: 'span', when: 'showsSupporting', content: true },
  ],
};

/** A static item or an option: the leading element, the text, and the trailing element */
export const listItemSkeleton: PartNode<ListItemPart, ListItemWhen> = {
  part: 'root',
  tag: 'li',
  children: [
    { part: 'leading', tag: 'span', when: 'showsLeading', content: true },
    textSkeleton,
    { part: 'trailing', tag: 'span', when: 'showsTrailing', content: true },
  ],
};

/** A link or a button item: the action holds the leading element and the text. */
export const listItemActionSkeleton = (
  tag: 'a' | 'button',
): PartNode<ListItemPart, ListItemWhen> => ({
  part: 'root',
  tag: 'li',
  children: [
    {
      part: 'action',
      tag,
      children: [
        { part: 'leading', tag: 'span', when: 'showsLeading', content: true },
        textSkeleton,
      ],
    },
    { part: 'trailing', tag: 'span', when: 'showsTrailing', content: true },
  ],
});

export interface ListItemApi extends Record<ListItemWhen, () => boolean> {
  parts: ListItemParts;
  kind: () => ListItemKind;
  selected: () => boolean;
  /**
   * The selection control to draw in the leading or the trailing element: the list's, in its
   * position, when the adapter has no content there. Draw it with the item's `selected` and
   * `disabled`; like the app's content there, it takes neither presses nor the focus.
   */
  controlIn: (position: ListControlPosition) => Exclude<ListControl, 'none'> | undefined;
  /** One, two, or three lines */
  lines: () => 1 | 2 | 3;
  /**
   * Attach to the item's `click` (the option's, or the action's). It chooses an option; on a
   * disabled item it cancels the click. Returns whether the app's own click should run.
   */
  handleClick: (event: { preventDefault(): void }) => boolean;
}

export function createListItem(options: ListItemOptions): ListItemApi {
  const props = () => options.props();
  const list = () => options.list();
  const kind = (): ListItemKind => {
    if (list().selection() !== 'none') return 'option';
    if (props().href !== undefined) return 'link';
    return props().action ? 'button' : 'static';
  };
  const selected = () => {
    const { value } = props();
    return kind() === 'option' && value !== undefined && list().isSelected(value);
  };
  const controlIn = (position: ListControlPosition) => {
    if (kind() !== 'option' || options.content()[position]) return undefined;
    const control = list().control();
    return control !== 'none' && list().controlPosition() === position ? control : undefined;
  };
  const lines = (): 1 | 2 | 3 => {
    const { overline, supporting } = options.content();
    if ((overline && supporting) || (supporting && options.multiline())) return 3;
    return overline || supporting ? 2 : 1;
  };
  /** The element the keys move the focus to: the option, or the action */
  const focusable = () => {
    const stop = list().isTabStop(options.key);
    return {
      tabindex: stop === undefined ? undefined : stop ? '0' : '-1',
      'data-list-focus': options.key,
    };
  };

  return {
    acts: () => kind() === 'link' || kind() === 'button',
    showsLeading: () => options.content().leading || !!controlIn('leading'),
    showsOverline: () => options.content().overline,
    showsSupporting: () => options.content().supporting,
    showsTrailing: () => options.content().trailing || !!controlIn('trailing'),
    kind,
    selected,
    controlIn,
    lines,
    parts: {
      root() {
        const k = kind();
        const disabled = !!props().disabled;
        return {
          class: 'rio-list-item rio-focus-ring-target',
          'data-focus-ring': 'inner',
          ...(k === 'option'
            ? {
                role: 'option',
                'aria-selected': String(selected()),
                'aria-disabled': disabled ? 'true' : undefined,
                ...focusable(),
              }
            : {}),
          'data-kind': k,
          'data-lines': String(lines()),
          'data-selected': selected() ? '' : undefined,
          'data-disabled': disabled ? '' : undefined,
        };
      },
      action() {
        const p = props();
        // Disabled items stay focusable: a link keeps no `href`, and a button says it instead of
        // `disabled`, which would take it out of the keys' reach.
        const disabled = !!p.disabled;
        return {
          class: 'rio-list-item__action',
          ...(kind() === 'link'
            ? linkAttrs({ href: p.href, disabled: false, softDisabled: disabled })
            : { type: 'button', 'aria-disabled': disabled ? 'true' : undefined }),
          ...focusable(),
        };
      },
      leading: () => ({ class: 'rio-list-item__leading' }),
      text: () => ({ class: 'rio-list-item__text' }),
      overline: () => ({ class: 'rio-list-item__overline' }),
      label: () => ({ class: 'rio-list-item__label' }),
      supporting: () => ({ class: 'rio-list-item__supporting' }),
      trailing: () => ({ class: 'rio-list-item__trailing' }),
    },
    handleClick(event) {
      if (props().disabled) {
        event.preventDefault();
        return false;
      }
      const { value } = props();
      if (kind() === 'option') {
        if (value !== undefined) list().toggle(value);
        return false;
      }
      return true;
    },
  };
}
