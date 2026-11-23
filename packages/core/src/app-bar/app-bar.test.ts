import { describe, expect, test } from 'vitest';
import { appBarSkeleton, createAppBar, type AppBarContent, type AppBarProps } from './app-bar';

const all: AppBarContent = { leading: true, headline: true, subtitle: true, trailing: true };

describe('createAppBar', () => {
  test('small, at the start, an h1, not scrolled, by default', () => {
    const bar = createAppBar({ props: () => ({}) });
    expect(bar.parts.root()).toEqual({
      class: 'rio-app-bar',
      'data-variant': 'small',
      'data-align': 'start',
      'data-scrolled': undefined,
    });
    expect(bar.headingTag()).toBe('h1');
  });

  test('scrolled: the prop wins over what the scroll target reports', () => {
    let reported = true;
    const props: AppBarProps = {};
    const bar = createAppBar({ props: () => props, scrolled: () => reported });
    expect(bar.scrolled()).toBe(true);
    expect(bar.parts.root()['data-scrolled']).toBe('');
    props.scrolled = false;
    expect(bar.scrolled()).toBe(false);
    props.scrolled = undefined;
    reported = false;
    expect(bar.scrolled()).toBe(false);
  });

  test('renders the parts the app fills; the text with a headline or a subtitle', () => {
    const content = { ...all };
    const bar = createAppBar({ props: () => ({}), content: () => content });
    expect([bar.showsLeading(), bar.showsText(), bar.showsTrailing()]).toEqual([true, true, true]);
    Object.assign(content, { headline: false, leading: false });
    expect([bar.showsLeading(), bar.showsText(), bar.showsHeadline(), bar.showsSubtitle()]).toEqual(
      [false, true, false, true],
    );
    content.subtitle = false;
    expect(bar.showsText()).toBe(false);
  });

  test('the headline is a heading at its level', () => {
    const bar = createAppBar({ props: () => ({ headingLevel: 2, variant: 'large-flexible' }) });
    expect(bar.headingTag()).toBe('h2');
    expect(bar.parts.root()['data-variant']).toBe('large-flexible');
    const headline = appBarSkeleton(2).children![1]!.children![0]!;
    expect([headline.part, headline.tag]).toEqual(['headline', 'h2']);
    expect(appBarSkeleton().tag).toBe('header');
  });
});
