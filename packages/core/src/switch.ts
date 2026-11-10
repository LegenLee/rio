// 빌드 파이프라인 검증용 샘플. 실제 M3E 스위치 구현으로 갈아엎을 것.

export interface SwitchProps {
  checked?: boolean
  disabled?: boolean
}

export const switchDefaults = {
  checked: false,
  disabled: false,
} satisfies Required<SwitchProps>

export interface SwitchOptions {
  /** 현재 prop 값을 돌려준다. 상태의 주인은 어댑터다. */
  props: () => SwitchProps
  /** 값을 바꿔야 할 때 호출된다. 어댑터가 v-model, onChange 등으로 잇는다. */
  onCheckedChange: (checked: boolean) => void
}

export interface SwitchApi {
  toggle: () => void
  rootAttrs: () => Record<string, string | undefined>
}

export function createSwitch(options: SwitchOptions): SwitchApi {
  return {
    toggle() {
      const p = options.props()
      if (!p.disabled) options.onCheckedChange(!p.checked)
    },
    rootAttrs() {
      const p = options.props()
      return {
        role: 'switch',
        'aria-checked': p.checked ? 'true' : 'false',
        'aria-disabled': p.disabled ? 'true' : undefined,
        'data-state': p.checked ? 'on' : 'off',
      }
    },
  }
}
