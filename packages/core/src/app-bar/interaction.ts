// The app bar's behavior in the DOM: whether content is scrolled under it.
//
// - It watches its scroll target, the window unless the adapter gives an element, and reports
//   whether it is scrolled from the top (`onScrolledChange`), for the adapter to keep and the root
//   part to render.
// - `update` follows a new scroll target, and reports again.

export interface AppBarDomOptions {
  /** The element whose scrolling the bar follows, or `undefined` for the window */
  target: () => HTMLElement | undefined;
  /** It started or stopped being scrolled from the top. */
  onScrolledChange: (scrolled: boolean) => void;
}

export interface AppBarHandle {
  /** Follows the scroll target the options give now. Call it after it changes. */
  update(): void;
  detach(): void;
}

export function attachAppBar(root: HTMLElement, options: AppBarDomOptions): AppBarHandle {
  const view = root.ownerDocument.defaultView!;
  let target: HTMLElement | Window | undefined;
  let reported: boolean | undefined;

  const scrolledNow = () =>
    target === view ? view.scrollY > 0 : (target as HTMLElement).scrollTop > 0;

  const onScroll = () => {
    const scrolled = scrolledNow();
    if (scrolled === reported) return;
    reported = scrolled;
    options.onScrolledChange(scrolled);
  };

  const update = () => {
    const next = options.target() ?? view;
    if (next !== target) {
      target?.removeEventListener('scroll', onScroll);
      target = next;
      target.addEventListener('scroll', onScroll, { passive: true });
    }
    onScroll();
  };

  update();
  return {
    update,
    detach() {
      target?.removeEventListener('scroll', onScroll);
    },
  };
}
