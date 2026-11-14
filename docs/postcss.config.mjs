import { postcssIsolateStyles } from 'vitepress';

// The files postcssIsolateStyles works on, as in its defaults
const isolated = [/vp-doc\.css/, /base\.css/];

/**
 * Writes `::before` as `*::before` (and `:root` as `*:root`), which means the same. In a selector
 * that starts with a pseudo-element or pseudo-class, postcssIsolateStyles puts its prefix in front
 * of the whitespace after the comma, so `*, ::before` became `:not(…) ::before`: a descendant
 * combinator, which matched the pseudo-elements of every element inside `.vp-raw` too. With the
 * `*`, the prefix goes after it, as in `*:not(…)::before` (VitePress 2.0.0-alpha.21).
 */
const explicitUniversal = {
  postcssPlugin: 'explicit-universal',
  Once(root) {
    const file = root.source?.input.file;
    if (!file || !isolated.some((re) => re.test(file))) return;
    root.walkRules((rule) => {
      rule.selectors = rule.selectors.map((selector) =>
        selector.startsWith(':') ? `*${selector}` : selector,
      );
    });
  },
};

// Keeps VitePress's vp-doc.css and base.css away from elements inside `.vp-raw`, which wraps every
// live example.
export default {
  plugins: [explicitUniversal, postcssIsolateStyles({ includeFiles: isolated })],
};
