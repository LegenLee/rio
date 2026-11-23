import type { PartAttrs, PartNode } from '../parts';
import { resolveProps } from '../utils/object';

/**
 * M3E app bars: small, one row; medium flexible and large flexible, with a larger headline in a
 * row of its own under the buttons.
 */
export const APP_BAR_VARIANTS = ['small', 'medium-flexible', 'large-flexible'] as const;
export type AppBarVariant = (typeof APP_BAR_VARIANTS)[number];

/** Where the headline and subtitle sit: at the start, or in the middle. */
export const APP_BAR_ALIGNS = ['start', 'center'] as const;
export type AppBarAlign = (typeof APP_BAR_ALIGNS)[number];

/** The level of the headline's heading element, `h1` to `h6` */
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface AppBarProps {
  /** Defaults to `'small'`. */
  variant?: AppBarVariant;
  /** Defaults to `'start'`. */
  align?: AppBarAlign;
  /** The headline's heading level. Defaults to 1. */
  headingLevel?: HeadingLevel;
  /**
   * Whether content is scrolled under the bar, which fills its container. Without it, the bar
   * follows its scroll target (`attachAppBar`).
   */
  scrolled?: boolean;
}

export const appBarDefaults = {
  variant: 'small',
  align: 'start',
  headingLevel: 1,
} satisfies Omit<Required<AppBarProps>, 'scrolled'>;

/** What the app puts in the bar */
export interface AppBarContent {
  /** A leading button, such as Back or a menu */
  leading: boolean;
  headline: boolean;
  subtitle: boolean;
  /** Trailing buttons or an avatar */
  trailing: boolean;
}

export interface AppBarOptions {
  /** Returns the current prop values. The adapter owns the state. */
  props: () => AppBarProps;
  /** What the app puts in it. Defaults to nothing. */
  content?: () => AppBarContent;
  /** Whether the scroll target is scrolled, as `attachAppBar` reports it and the adapter keeps it */
  scrolled?: () => boolean;
}

export interface AppBarParts {
  root: () => PartAttrs;
  leading: () => PartAttrs;
  /** The headline and the subtitle */
  text: () => PartAttrs;
  headline: () => PartAttrs;
  subtitle: () => PartAttrs;
  trailing: () => PartAttrs;
}

type AppBarPart = keyof AppBarParts;
type AppBarWhen =
  | 'showsLeading'
  | 'showsText'
  | 'showsHeadline'
  | 'showsSubtitle'
  | 'showsTrailing';

/** The app bar's markup, with its headline at a heading level */
export const appBarSkeleton = (level: HeadingLevel = 1): PartNode<AppBarPart, AppBarWhen> => ({
  part: 'root',
  tag: 'header',
  children: [
    { part: 'leading', tag: 'div', when: 'showsLeading', content: true },
    {
      part: 'text',
      tag: 'div',
      when: 'showsText',
      children: [
        { part: 'headline', tag: `h${level}`, when: 'showsHeadline', content: true },
        { part: 'subtitle', tag: 'p', when: 'showsSubtitle', content: true },
      ],
    },
    { part: 'trailing', tag: 'div', when: 'showsTrailing', content: true },
  ],
});

export interface AppBarApi extends Record<AppBarWhen, () => boolean> {
  parts: AppBarParts;
  /** The headline's element, `h1` to `h6` */
  headingTag: () => `h${HeadingLevel}`;
  /** Whether it shows scrolled: the `scrolled` prop, or else what the scroll target reports */
  scrolled: () => boolean;
}

const NO_CONTENT: AppBarContent = {
  leading: false,
  headline: false,
  subtitle: false,
  trailing: false,
};

export function createAppBar(options: AppBarOptions): AppBarApi {
  const props = () => resolveProps(appBarDefaults, options.props());
  const content = () => options.content?.() ?? NO_CONTENT;
  const scrolled = () => props().scrolled ?? options.scrolled?.() ?? false;

  return {
    parts: {
      root() {
        const p = props();
        return {
          class: 'rio-app-bar',
          'data-variant': p.variant,
          'data-align': p.align,
          'data-scrolled': scrolled() ? '' : undefined,
        };
      },
      leading: () => ({ class: 'rio-app-bar__leading' }),
      text: () => ({ class: 'rio-app-bar__text' }),
      headline: () => ({ class: 'rio-app-bar__headline' }),
      subtitle: () => ({ class: 'rio-app-bar__subtitle' }),
      trailing: () => ({ class: 'rio-app-bar__trailing' }),
    },
    showsLeading: () => content().leading,
    showsText: () => content().headline || content().subtitle,
    showsHeadline: () => content().headline,
    showsSubtitle: () => content().subtitle,
    showsTrailing: () => content().trailing,
    headingTag: () => `h${props().headingLevel}`,
    scrolled,
  };
}
