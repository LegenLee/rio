// Sample for verifying the build pipeline. To be replaced with the real M3E switch.

export interface SwitchProps {
  checked?: boolean;
  disabled?: boolean;
}

export const switchDefaults = {
  checked: false,
  disabled: false,
} satisfies Required<SwitchProps>;

export interface SwitchOptions {
  /** Returns the current prop values. The adapter owns the state. */
  props: () => SwitchProps;
  /** Called when the value should change. Adapters wire it to v-model, onChange, and so on. */
  onCheckedChange: (checked: boolean) => void;
}

export interface SwitchApi {
  toggle: () => void;
  rootAttrs: () => Record<string, string | undefined>;
}

export function createSwitch(options: SwitchOptions): SwitchApi {
  return {
    toggle() {
      const p = options.props();
      if (!p.disabled) options.onCheckedChange(!p.checked);
    },
    rootAttrs() {
      const p = options.props();
      return {
        role: 'switch',
        'aria-checked': p.checked ? 'true' : 'false',
        'aria-disabled': p.disabled ? 'true' : undefined,
        'data-state': p.checked ? 'on' : 'off',
      };
    },
  };
}
