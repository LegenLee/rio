import type { PartAttrs, PartNode } from '../parts';

export interface SwitchProps {
  /** Whether the switch is on. */
  selected?: boolean;
  /** Native disabled: not focusable and not pressable. This is the spec's behavior. */
  disabled?: boolean;
  /**
   * Disabled but still focusable, so it stays discoverable. Presses and drags are blocked in
   * JavaScript instead. This deviates from the spec, which says disabled components can't be
   * focused.
   */
  softDisabled?: boolean;
}

export const switchDefaults = {
  selected: false,
  disabled: false,
  softDisabled: false,
} satisfies Required<SwitchProps>;

/** What the adapter has to put in the switch, which only the adapter can see. */
export interface SwitchContent {
  /** Whether there is an icon for the handle while the switch is on. */
  selectedIcon: boolean;
  /** Whether there is an icon for the handle while the switch is off. */
  unselectedIcon: boolean;
}

export interface SwitchOptions {
  /** Returns the current prop values. The adapter owns the state. */
  props: () => SwitchProps;
  /** Returns what content the adapter has. Without it, the handle has no icons. */
  content?: () => SwitchContent;
  /** Called with the requested value. Adapters wire it to v-model, onChange, and so on. */
  onSelectedChange: (selected: boolean) => void;
}

/**
 * The switch's markup, part by part. `switchSkeleton` says how the adapter nests them.
 */
export interface SwitchParts {
  root: () => PartAttrs;
  /** Extends the 32px track to the 48px target. */
  touch: () => PartAttrs;
  state: () => PartAttrs;
  handle: () => PartAttrs;
  icon: () => PartAttrs;
}

/**
 * How the adapter renders the switch's parts. The state part is the circle where the state layer
 * and the ripple draw. The icon holds the selected icon when `showsSelectedIcon()`, otherwise the
 * unselected one.
 */
export const switchSkeleton: PartNode<keyof SwitchParts, 'showsIcon'> = {
  part: 'root',
  tag: 'button',
  children: [
    { part: 'touch', tag: 'span' },
    { part: 'state', tag: 'span' },
    {
      part: 'handle',
      tag: 'span',
      children: [{ part: 'icon', tag: 'span', when: 'showsIcon', content: true }],
    },
  ],
};

export interface SwitchApi {
  parts: SwitchParts;
  /** Whether the handle shows an icon in the current state, which also makes it bigger. */
  showsIcon: () => boolean;
  /** Whether the icon part shows the selected icon: the switch is on and has one. */
  showsSelectedIcon: () => boolean;
  /** Attach to the root element's `click`. */
  handleClick: (event: MouseEvent) => void;
}

export function createSwitch(options: SwitchOptions): SwitchApi {
  const showsIcon = () => {
    const content = options.content?.();
    return !!(options.props().selected ? content?.selectedIcon : content?.unselectedIcon);
  };

  return {
    parts: {
      root() {
        const p = options.props();
        const selected = String(!!p.selected);
        return {
          class: 'rio-switch rio-focus-ring',
          // A switch never submits a form.
          type: 'button',
          role: 'switch',
          'aria-checked': selected,
          disabled: p.disabled ? '' : undefined,
          'aria-disabled': p.softDisabled && !p.disabled ? 'true' : undefined,
          'data-selected': selected,
          'data-icon': showsIcon() ? '' : undefined,
        };
      },
      touch: () => ({ class: 'rio-switch__touch', 'aria-hidden': 'true' }),
      state: () => ({ class: 'rio-switch__state', 'aria-hidden': 'true' }),
      handle: () => ({ class: 'rio-switch__handle', 'aria-hidden': 'true' }),
      icon: () => ({ class: 'rio-switch__icon' }),
    },
    showsIcon,
    showsSelectedIcon: () => !!(options.props().selected && options.content?.().selectedIcon),
    handleClick(event) {
      const p = options.props();
      if (p.disabled || p.softDisabled) {
        event.preventDefault();
        return;
      }
      options.onSelectedChange(!p.selected);
    },
  };
}
