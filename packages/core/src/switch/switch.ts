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

export interface SwitchOptions {
  /** Returns the current prop values. The adapter owns the state. */
  props: () => SwitchProps;
  /** Called with the requested value. Adapters wire it to v-model, onChange, and so on. */
  onSelectedChange: (selected: boolean) => void;
}

export interface SwitchApi {
  rootAttrs: () => Record<string, string | undefined>;
  /** Attach to the root element's `click`. */
  handleClick: (event: MouseEvent) => void;
}

export function createSwitch(options: SwitchOptions): SwitchApi {
  return {
    rootAttrs() {
      const p = options.props();
      const selected = String(!!p.selected);
      return {
        // A switch never submits a form.
        type: 'button',
        role: 'switch',
        'aria-checked': selected,
        disabled: p.disabled ? '' : undefined,
        'aria-disabled': p.softDisabled && !p.disabled ? 'true' : undefined,
        'data-selected': selected,
      };
    },
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
