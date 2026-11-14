// The button group's DOM behavior.
//
// - Arrow keys move the focus between the group's buttons, as the spec's keyboard table asks.
//   Tab still reaches every button, so the arrows only add a shortcut.
// - In a standard group, a pressed button grows by 15% of its width and its neighbors shrink to
//   make room, so the group keeps its width. The widths move on the `fast-spatial` spring and
//   return when the press ends. The press comes from the ripple's `data-pressed` on each button.
//   Connected groups skip this, as the spec says, and so does reduced motion.
// - A change of size (a button's `data-size`, or an icon button's `data-width`) resets the widths
//   at once, even mid-press. A label that changes while a button is pressed isn't noticed until
//   the next press: with an inline width on the button, nothing reports its own width changing.
//
// Every element child of the group counts as an item, in DOM order.

import {
  createSpring,
  prefersReducedMotion,
  readSpringParams,
  type Spring,
} from '../primitives/spring/spring';

export interface ButtonGroupInteractionOptions {
  /**
   * How much wider a pressed button gets, as a share of its width. Each neighbor gives up at most
   * the same share of its own width. Defaults to 0.15, the spec's 15%.
   */
  pressedWidthRatio?: number;
}

export interface ButtonGroupHandle {
  detach(): void;
}

const PRESSED_WIDTH_RATIO = 0.15;

export function attachButtonGroup(
  root: HTMLElement,
  options: ButtonGroupInteractionOptions = {},
): ButtonGroupHandle {
  const ratio = options.pressedWidthRatio ?? PRESSED_WIDTH_RATIO;
  const items = () => [...root.children].filter((el) => el instanceof HTMLElement);

  // Keyboard

  const onKeydown = (event: KeyboardEvent) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const focusable = items().filter((el) => !el.matches(':disabled') && el.tabIndex >= 0);
    const index = focusable.findIndex((el) => el.contains(document.activeElement));
    if (index === -1) return;
    // In right-to-left layouts the next button is on the left.
    const forward = (event.key === 'ArrowRight') !== (getComputedStyle(root).direction === 'rtl');
    const next = focusable[index + (forward ? 1 : -1)];
    if (!next) return;
    event.preventDefault();
    next.focus();
  };
  root.addEventListener('keydown', onKeydown);

  // Press widths

  const springs = new Map<HTMLElement, Spring>();
  const natural = new Map<HTMLElement, number>();

  const setWidth = (el: HTMLElement, value: number | undefined) =>
    value === undefined
      ? el.style.removeProperty('inline-size')
      : el.style.setProperty('inline-size', `${value}px`);

  const springOf = (el: HTMLElement) => {
    let spring = springs.get(el);
    if (!spring) {
      spring = createSpring({
        value: natural.get(el)!,
        onUpdate: (value) => setWidth(el, value),
        // Back at its own width, the button sizes itself again.
        onRest: () => {
          if (springs.get(el)?.target === natural.get(el)) setWidth(el, undefined);
        },
      });
      springs.set(el, spring);
    }
    return spring;
  };

  /**
   * A button's own width, without the width a spring wrote on it. The inline width comes off and
   * goes back within the same task, so it never shows.
   */
  const measure = (el: HTMLElement) => {
    const inline = el.style.inlineSize;
    el.style.removeProperty('inline-size');
    const width = el.getBoundingClientRect().width;
    el.style.setProperty('inline-size', inline);
    return width;
  };

  /** Sets every button's target width. `instant` skips the springs, for changes of size. */
  const layout = (instant = false) => {
    const all = items();
    // Measure every time: the group's size or a button's may have changed since the last press.
    for (const el of all) natural.set(el, measure(el));
    const targets = new Map(all.map((el) => [el, natural.get(el)!]));

    const pressed = all.findIndex((el) => el.hasAttribute('data-pressed'));
    const standard = root.getAttribute('data-variant') !== 'connected';
    if (pressed !== -1 && standard && !prefersReducedMotion()) {
      const growth = natural.get(all[pressed]!)! * ratio;
      const neighbors = [all[pressed - 1], all[pressed + 1]].filter((el) => el !== undefined);
      let gained = 0;
      for (const el of neighbors) {
        const width = natural.get(el)!;
        const given = Math.min(growth / neighbors.length, width * ratio);
        targets.set(el, width - given);
        gained += given;
      }
      targets.set(all[pressed]!, natural.get(all[pressed]!)! + gained);
    }

    const params = readSpringParams(root, 'fast-spatial');
    for (const [el, target] of targets) {
      const spring = springOf(el);
      // A resting button may have changed size since its spring last moved. Start from its width
      // now, not from where the spring stopped.
      if (!el.style.inlineSize && spring.value !== natural.get(el)) spring.jump(natural.get(el)!);
      if (spring.target === target) continue;
      if (params && !instant && !prefersReducedMotion()) spring.to(target, params);
      else spring.jump(target);
    }
  };

  // A press animates. A change of size, the group's or a single button's, applies at once: the
  // button's height and padding change in one step, so its width shouldn't trail behind.
  const observer = new MutationObserver((mutations) => {
    const own = mutations.filter((m) => m.target.parentElement === root);
    if (own.length > 0) layout(own.some((m) => m.attributeName !== 'data-pressed'));
  });
  observer.observe(root, {
    subtree: true,
    attributes: true,
    attributeFilter: ['data-pressed', 'data-size', 'data-width'],
  });

  return {
    detach() {
      root.removeEventListener('keydown', onKeydown);
      observer.disconnect();
      for (const [el, spring] of springs) {
        spring.stop();
        setWidth(el, undefined);
      }
    },
  };
}
