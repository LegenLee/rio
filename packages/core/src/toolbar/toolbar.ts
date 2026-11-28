import type { PartAttrs, PartNode } from '../parts';
import { resolveProps } from '../utils/object';

/**
 * M3E toolbar types. A docked toolbar spans the width of the window, at its bottom; a floating
 * toolbar is only as large as its items, and floats above the content.
 */
export const TOOLBAR_TYPES = ['docked', 'floating'] as const;
export type ToolbarType = (typeof TOOLBAR_TYPES)[number];

/**
 * The toolbar's color variants, as the menu's: standard, low emphasis, or vibrant, to draw
 * attention to its controls.
 */
export const TOOLBAR_VARIANTS = ['standard', 'vibrant'] as const;
export type ToolbarVariant = (typeof TOOLBAR_VARIANTS)[number];

/** How a floating toolbar lays out its items. A docked toolbar is always horizontal. */
export const TOOLBAR_ORIENTATIONS = ['horizontal', 'vertical'] as const;
export type ToolbarOrientation = (typeof TOOLBAR_ORIENTATIONS)[number];

export interface ToolbarProps {
  /** Defaults to `'docked'`. */
  type?: ToolbarType;
  /** Defaults to `'standard'`. */
  variant?: ToolbarVariant;
  /** A floating toolbar's layout. Defaults to `'horizontal'`; a docked toolbar ignores it. */
  orientation?: ToolbarOrientation;
  /** Takes a floating toolbar's shadow off, as on a background distinct from it. */
  flat?: boolean;
}

export const toolbarDefaults = {
  type: 'docked',
  variant: 'standard',
  orientation: 'horizontal',
  flat: false,
} satisfies Required<ToolbarProps>;

export interface ToolbarOptions {
  /** Returns the current prop values. The adapter owns the state. */
  props: () => ToolbarProps;
}

/** The toolbar's markup. `toolbarSkeleton` says how the adapter renders it. */
export interface ToolbarParts {
  root: () => PartAttrs;
}

/** How the adapter renders the toolbar: one root, with its items as its children. */
export const toolbarSkeleton: PartNode<keyof ToolbarParts> = {
  part: 'root',
  tag: 'div',
  content: true,
};

export interface ToolbarApi {
  parts: ToolbarParts;
  /** The layout, with the default filled in: always horizontal for a docked toolbar. */
  orientation: () => ToolbarOrientation;
}

export function createToolbar(options: ToolbarOptions): ToolbarApi {
  const props = () => resolveProps(toolbarDefaults, options.props());
  const orientation = (): ToolbarOrientation => {
    const p = props();
    return p.type === 'floating' ? p.orientation : 'horizontal';
  };

  return {
    parts: {
      root() {
        const p = props();
        const vertical = orientation() === 'vertical';
        return {
          class: 'rio-toolbar',
          role: 'toolbar',
          // A toolbar is horizontal unless it says otherwise.
          'aria-orientation': vertical ? 'vertical' : undefined,
          'data-type': p.type,
          'data-variant': p.variant,
          'data-orientation': orientation(),
          'data-flat': p.type === 'floating' && p.flat ? '' : undefined,
        };
      },
    },
    orientation,
  };
}
