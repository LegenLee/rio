import type { CancelableEvent, PartAttrs, PartNode } from '../parts';
import { disabledAttrs, isBlocked } from '../utils/disabled';
import { resolveProps } from '../utils/object';

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
  /** Called with the requested value. Adapters wire it to v-model, a callback prop, and so on. */
  onChange: (selected: boolean) => void;
}

/**
 * The switch's markup, part by part. `switchSkeleton` says how the adapter nests them.
 */
export interface SwitchParts {
  /** The track */
  root: () => PartAttrs;
  /**
   * A native checkbox with the switch role, over the track and out to the 48px target. It takes
   * the presses and the focus, and submits the switch with a form.
   */
  input: () => PartAttrs;
  /** The circle around the handle where the state layer and the ripple draw */
  state: () => PartAttrs;
  handle: () => PartAttrs;
  icon: () => PartAttrs;
}

/**
 * How the adapter renders the switch's parts. The icon holds the selected icon when
 * `showsSelectedIcon()`, otherwise the unselected one.
 */
export const switchSkeleton: PartNode<keyof SwitchParts, 'showsIcon'> = {
  part: 'root',
  tag: 'span',
  children: [
    { part: 'input', tag: 'input' },
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
  /** Whether a press can't change it now: disabled or soft-disabled. For `attachCheckable`. */
  blocked: () => boolean;
  /**
   * Attach to the input's `keydown`. Enter toggles it, as Space does natively, and doesn't submit
   * the form; held down, it toggles once. Enter with Alt, Ctrl, or Meta, or one already handled,
   * is left alone.
   */
  handleKeydown: (event: SwitchKeyEvent) => void;
}

/** What `handleKeydown` reads from a key event: a DOM one, or a framework's own */
export interface SwitchKeyEvent extends CancelableEvent {
  key: string;
  repeat: boolean;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  defaultPrevented: boolean;
}

export function createSwitch(options: SwitchOptions): SwitchApi {
  const props = () => resolveProps(switchDefaults, options.props());
  const showsIcon = () => {
    const content = options.content?.();
    return !!(props().selected ? content?.selectedIcon : content?.unselectedIcon);
  };
  const blocked = () => isBlocked(props());

  return {
    parts: {
      root() {
        const p = props();
        return {
          class: 'rio-switch',
          'data-selected': String(p.selected),
          'data-icon': showsIcon() ? '' : undefined,
          'data-disabled': blocked() ? '' : undefined,
        };
      },
      input() {
        const p = props();
        return {
          class: 'rio-switch__input',
          type: 'checkbox',
          role: 'switch',
          ...disabledAttrs(p),
        };
      },
      state: () => ({ class: 'rio-switch__state', 'aria-hidden': 'true' }),
      handle: () => ({ class: 'rio-switch__handle', 'aria-hidden': 'true' }),
      icon: () => ({ class: 'rio-switch__icon' }),
    },
    showsIcon,
    showsSelectedIcon: () => props().selected && !!options.content?.().selectedIcon,
    blocked,
    handleKeydown(event) {
      if (event.key !== 'Enter' || event.defaultPrevented) return;
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      // Enter would otherwise submit the form the switch is in.
      event.preventDefault();
      if (!event.repeat && !blocked()) options.onChange(!props().selected);
    },
  };
}
