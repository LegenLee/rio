import type {
  AnchoredAlign,
  AnchoredSide,
} from '../primitives/anchored-position/anchored-position';
import type { PartAttrs, PartNode } from '../parts';
import { resolveProps } from '../utils/object';

/** M3 tooltip variants: a brief label, or a card with a subhead, text, and actions. */
export const TOOLTIP_VARIANTS = ['plain', 'rich'] as const;
export type TooltipVariant = (typeof TOOLTIP_VARIANTS)[number];

export interface TooltipProps {
  /** Defaults to `'plain'`. */
  variant?: TooltipVariant;
  /**
   * Rich only: opens on a click on its element rather than on hover or focus, and stays open
   * until the person interacts with something else.
   */
  persistent?: boolean;
  /** Whether the tooltip is shown. */
  open?: boolean;
  /** The side of its element it shows on. Defaults to `'top'` for plain, `'bottom'` for rich. */
  side?: AnchoredSide;
  /** Which edges line up with the element's. Defaults to `'center'` for plain, `'start'` for rich. */
  align?: AnchoredAlign;
  /**
   * Space between the element and the tooltip, in px. Defaults to 4, for an element with a visible
   * edge, such as a button; 8 suits one without, such as text.
   */
  offset?: number;
}

export const tooltipDefaults = {
  variant: 'plain',
  persistent: false,
  open: false,
  offset: 4,
} satisfies Omit<Required<TooltipProps>, 'side' | 'align'>;

/** What the adapter has to put in the tooltip, which only the adapter can see. */
export interface TooltipContent {
  /** A subhead above the text (rich only) */
  subhead: boolean;
  /** Text buttons below the text (rich only) */
  actions: boolean;
}

export interface TooltipOptions {
  props: () => TooltipProps;
  /** Without it, the tooltip has only its text. */
  content?: () => TooltipContent;
  /** Ids for the parts that others refer to, unique in the document. The adapter makes them. */
  ids: { root: string; subhead: string; supportingText: string };
}

export interface TooltipParts {
  /**
   * Wraps the element the tooltip is for, then the tooltip itself, without a box of its own. The
   * tooltip shows in the top layer, but comes right after its element in the focus order.
   */
  trigger: () => PartAttrs;
  /** The tooltip, shown in the top layer */
  root: () => PartAttrs;
  subhead: () => PartAttrs;
  supportingText: () => PartAttrs;
  /** Holds the text buttons. */
  actions: () => PartAttrs;
}

/** The trigger holds the app's element first, then the tooltip (`tooltipSkeleton`). */
export const tooltipTriggerSkeleton: PartNode<'trigger'> = {
  part: 'trigger',
  tag: 'span',
  content: true,
};

type TooltipPart = Exclude<keyof TooltipParts, 'trigger'>;
type TooltipWhen = 'showsSubhead' | 'showsActions';

/** Spans throughout, so a tooltip may sit inside a paragraph. */
export const tooltipSkeleton: PartNode<TooltipPart, TooltipWhen> = {
  part: 'root',
  tag: 'span',
  children: [
    { part: 'subhead', tag: 'span', when: 'showsSubhead', content: true },
    { part: 'supportingText', tag: 'span', content: true },
    { part: 'actions', tag: 'span', when: 'showsActions', content: true },
  ],
};

export interface TooltipPlacement {
  side: AnchoredSide;
  align: AnchoredAlign;
  offset: number;
}

export interface TooltipApi extends Record<TooltipWhen, () => boolean> {
  parts: TooltipParts;
  /**
   * Whether it holds actions, which take the focus: a rich tooltip with actions is a non-modal
   * dialog rather than a tooltip.
   */
  interactive: () => boolean;
  /** Whether it opens on a click and stays open (rich only). */
  persistent: () => boolean;
  /** Where it shows, with the defaults of its variant filled in. */
  placement: () => TooltipPlacement;
}

const NO_CONTENT: TooltipContent = { subhead: false, actions: false };

export function createTooltip(options: TooltipOptions): TooltipApi {
  const props = () => resolveProps(tooltipDefaults, options.props());
  const rich = () => props().variant === 'rich';
  const content = () => options.content?.() ?? NO_CONTENT;
  const showsSubhead = () => rich() && content().subhead;
  const showsActions = () => rich() && content().actions;
  const interactive = showsActions;
  const { ids } = options;

  return {
    parts: {
      trigger: () => ({ class: 'rio-tooltip-trigger' }),
      root() {
        const p = props();
        const dialog = interactive();
        return {
          class: 'rio-tooltip',
          id: ids.root,
          role: dialog ? 'dialog' : 'tooltip',
          // A dialog is named by its subhead, or else its text.
          'aria-labelledby': dialog
            ? showsSubhead()
              ? ids.subhead
              : ids.supportingText
            : undefined,
          'data-variant': p.variant,
        };
      },
      subhead: () => ({ class: 'rio-tooltip__subhead', id: ids.subhead }),
      supportingText: () => ({ class: 'rio-tooltip__supporting-text', id: ids.supportingText }),
      actions: () => ({ class: 'rio-tooltip__actions' }),
    },
    showsSubhead,
    showsActions,
    interactive,
    persistent: () => rich() && props().persistent,
    placement() {
      const p = props();
      return {
        side: p.side ?? (rich() ? 'bottom' : 'top'),
        align: p.align ?? (rich() ? 'start' : 'center'),
        offset: p.offset,
      };
    },
  };
}
