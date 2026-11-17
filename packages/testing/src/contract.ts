// Contract tests: checks that the adapter renders a component's markup the way core's skeleton
// says, with every part carrying the attributes core gives it. See "Core output" in
// `docs/conventions.md`.
import type { PartAttrs, PartNode } from '@rio-m3e/core';
import { expect } from 'vitest';

/** The parts of a core API, and the decisions its skeleton refers to (`showsIcon`). */
export type ContractApi<P extends string, W extends string> = {
  parts: Record<P, () => PartAttrs>;
} & Record<W, () => boolean>;

/** Attributes that change what assistive technology reads or reaches. */
const isAccessibility = (name: string) =>
  name.startsWith('aria-') || name === 'role' || name === 'tabindex';

/**
 * Walks the rendered element and the skeleton together and checks, at every part:
 * - the tag;
 * - every attribute of the part's bundle: class names as tokens, `style` declaration by
 *   declaration, `undefined` as absent;
 * - on parts inside the root, no `aria-*`, `role`, or `tabindex` that core didn't give. The root
 *   may carry more, since the app can pass attributes through to it. Other extra attributes, such
 *   as a primitive's `data-ripple`, are allowed everywhere;
 * - no text outside the parts that hold content: it would end up in the accessible name;
 * - the parts inside, in order, with none missing and none extra, leaving out those whose
 *   decision (`when`) is false.
 *
 * Inside a part that holds content (`content: true`), nothing is checked.
 *
 * @param api The core API built from the same props and content the component got.
 */
export function expectSkeleton<P extends string, W extends string>(
  element: Element,
  node: PartNode<P, W>,
  api: ContractApi<P, W>,
): void {
  check(element, node, api, node.part, false);
}

function check<P extends string, W extends string>(
  element: Element,
  node: PartNode<P, W>,
  api: ContractApi<P, W>,
  path: string,
  inner: boolean,
): void {
  expect(element.tagName.toLowerCase(), `${path}: tag`).toBe(node.tag);

  const attrs = api.parts[node.part]();
  for (const [name, value] of Object.entries(attrs)) {
    if (name === 'class') {
      for (const token of value?.split(/\s+/).filter(Boolean) ?? []) {
        expect(element.classList.contains(token), `${path}: class ${token}`).toBe(true);
      }
    } else if (value === undefined) {
      expect(element.hasAttribute(name), `${path}: no ${name}`).toBe(false);
    } else if (name === 'style') {
      // The browser writes `style` back its own way, so each declaration is read from it.
      for (const declaration of value.split(';').filter((part) => part.trim())) {
        const [property, ...rest] = declaration.split(':');
        const style = (element as HTMLElement).style;
        expect(style.getPropertyValue(property!.trim()).trim(), `${path}: style ${property}`).toBe(
          rest.join(':').trim(),
        );
      }
    } else {
      expect(element.getAttribute(name), `${path}: ${name}`).toBe(value);
    }
  }
  if (inner) {
    const extra = [...element.attributes]
      .map((attribute) => attribute.name)
      .filter((name) => isAccessibility(name) && !(name in attrs));
    expect(extra, `${path}: accessibility attributes core didn't give`).toEqual([]);
  }

  if (node.content) return;
  // Comments are fine: Vue leaves one where a v-if renders nothing.
  const text = [...element.childNodes]
    .filter((child) => child.nodeType === Node.TEXT_NODE && child.textContent!.trim())
    .map((child) => child.textContent);
  expect(text, `${path}: text outside the parts that hold content`).toEqual([]);

  const expected = rendered(node, api);
  const actual = [...element.children];
  expect(actual.length, `${path}: number of parts inside`).toBe(expected.length);
  expected.forEach((child, i) => check(actual[i]!, child, api, `${path} > ${child.part}`, true));
}

/** The children of a skeleton node that render, given the API's decisions. */
const rendered = <P extends string, W extends string>(
  node: PartNode<P, W>,
  api: ContractApi<P, W>,
) => (node.children ?? []).filter((child) => child.when === undefined || api[child.when]());

/**
 * The element of the named part, found by walking the skeleton, or `undefined` when the part
 * doesn't render. Use it after `expectSkeleton`, to check what a content part holds.
 */
export function findPart<P extends string, W extends string>(
  element: Element,
  node: PartNode<P, W>,
  part: P,
  api: ContractApi<P, W>,
): Element | undefined {
  if (node.part === part) return element;
  if (node.content) return undefined;
  for (const [i, child] of rendered(node, api).entries()) {
    const found = element.children[i] && findPart(element.children[i], child, part, api);
    if (found) return found;
  }
  return undefined;
}
