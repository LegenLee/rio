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
  props: P,
  onSelectedChange: (selected: boolean) => void,
) {
  const group = inject(buttonGroupKey, null);
  const grouped = () => !!group && group.selection() !== 'none' && props.value !== undefined;

  return {
    /** The props to pass to core, with the group's values filled in. */
    props: (): P => ({
      ...props,
      size: props.size ?? group?.size(),
      shape: props.shape ?? group?.shape(),
      ...(grouped() ? { toggle: true, selected: group!.isSelected(props.value!) } : {}),
    }),
    onSelectedChange(selected: boolean) {
      if (grouped()) group!.select(props.value!, selected);
      else onSelectedChange(selected);
    },
  };
}
