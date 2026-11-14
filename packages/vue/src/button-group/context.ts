import type {
  ButtonGroupSelection,
  ButtonGroupValue,
  ButtonShape,
  ButtonSize,
} from '@rio-m3e/core';
import { inject, type InjectionKey } from 'vue';

/** What `RioButtonGroup` provides to the buttons inside it. */
export interface ButtonGroupContext {
  size: () => ButtonSize;
  shape: () => ButtonShape;
  selection: () => ButtonGroupSelection;
  isSelected: (value: ButtonGroupValue) => boolean;
  select: (value: ButtonGroupValue, selected: boolean) => void;
}

export const buttonGroupKey: InjectionKey<ButtonGroupContext> = Symbol('RioButtonGroup');

interface GroupItemProps {
  size?: ButtonSize;
  shape?: ButtonShape;
  toggle?: boolean;
  selected?: boolean;
  value?: ButtonGroupValue;
}

/**
 * For `RioButton` and `RioIconButton`: takes the size and shape of the button group around the
 * button unless the button sets its own, and, in a group that keeps a selection, makes a button
 * with a `value` a toggle whose state the group owns. Outside a group it changes nothing.
 */
export function useButtonGroupItem<P extends GroupItemProps>(
  /** Returns the button's own props. A function, so destructured props stay reactive. */
  props: () => P,
  /** Reports a change of `selected` when no group owns it, usually by emitting `update:selected`. */
  emitChange: (selected: boolean) => void,
) {
  const group = inject(buttonGroupKey, null);
  const grouped = () => !!group && group.selection() !== 'none' && props().value !== undefined;

  return {
    /** The props to pass to core, with the group's values filled in. */
    props: (): P => {
      const own = props();
      return {
        ...own,
        size: own.size ?? group?.size(),
        shape: own.shape ?? group?.shape(),
        ...(grouped() ? { toggle: true, selected: group!.isSelected(own.value!) } : {}),
      };
    },
    /** The `onChange` to pass to core: to the group if it owns the state, otherwise to the app. */
    onChange(selected: boolean) {
      if (grouped()) group!.select(props().value!, selected);
      else emitChange(selected);
    },
  };
}
