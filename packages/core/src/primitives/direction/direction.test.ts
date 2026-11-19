import { afterEach, describe, expect, test } from 'vitest';
import { isRtl } from './direction';

const made: Element[] = [];
const add = <E extends Element>(el: E) => {
  document.body.append(el);
  made.push(el);
  return el;
};

afterEach(() => {
  for (const el of made.splice(0)) el.remove();
});

describe('isRtl', () => {
  test('left to right by default', () => {
    expect(isRtl(add(document.createElement('div')))).toBe(false);
  });

  test('right to left from dir, on the element or around it', () => {
    const outer = add(document.createElement('div'));
    outer.dir = 'rtl';
    const inner = outer.appendChild(document.createElement('span'));
    expect(isRtl(outer)).toBe(true);
    expect(isRtl(inner)).toBe(true);
    inner.dir = 'ltr';
    expect(isRtl(inner)).toBe(false);
  });

  test('right to left from the stylesheet', () => {
    const el = add(document.createElement('div'));
    el.style.direction = 'rtl';
    expect(isRtl(el)).toBe(true);
  });

  test('in an iframe too', () => {
    const frame = add(document.createElement('iframe'));
    const inner = frame.contentDocument!;
    inner.documentElement.dir = 'rtl';
    expect(isRtl(inner.body)).toBe(true);
  });
});
