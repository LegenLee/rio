import type { PartAttrs, PartNode } from '../parts';
import { resolveProps } from '../utils/object';

/**
 * M3E toolbar variants. A docked toolbar spans the width of the window, at its bottom; a floating
 * toolbar is only as large as its items, and floats above the content.
 */
export const TOOLBAR_VARIANTS = ['docked', 'floating'] as const;
export type ToolbarVariant = (typeof TOOLBAR_VARIANTS)[number];

/** The toolbar's colors: standard, low emphasis, or vibrant, to draw attention to its controls. */
export const TOOLBAR_COLORS = ['standard', 'vibrant'] as const;
export type ToolbarColor = (typeof TOOLBAR_COLORS)[number];

/** How a floating toolbar lays out its items. A docked toolbar is always horizontal. */
export const TOOLBAR_ORIENTATIONS = ['horizontal', 'vertical'] as const;
export type ToolbarOrientation = (typeof TOOLBAR_ORIENTATIONS)[number];

export interface ToolbarProps {
  /** Defaults to `'docked'`. */
  variant?: ToolbarVariant;
  /** Defaults to `'standard'`. */
  color?: ToolbarColor;
  /** A floating toolbar's layout. Defaults to `'horizontal'`; a docked toolbar ignores it. */
  orientation?: ToolbarOrientation;
  /** Takes a floating toolbar's shadow off, as on a background distinct from it. */
  flat?: boolean;
}

export const toolbarDefaults = {
  variant: 'docked',
  color: 'standard',
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
    return p.variant === 'floating' ? p.orientation : 'horizontal';
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
          'data-variant': p.variant,
          'data-color': p.color,
          'data-orientation': orientation(),
          'data-flat': p.variant === 'floating' && p.flat ? '' : undefined,
        };
      },
    },
    orientation,
  };
}
