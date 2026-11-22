// Reduced motion in JavaScript. When the user asks the OS to reduce motion, spatial motion driven
// from JavaScript goes straight to its end, or holds still, as
// `@rio-m3e/styles/base/reduced-motion.css` makes spatial motion in CSS instant.

/**
 * Whether the user asked for reduced motion. Spatial motion driven from JavaScript then goes
 * straight to its end, or holds still: springs jump to their target, the ripple's wave shows at
 * once, and a progress wave stops moving. See `docs/foundations.md`, section 3.
 */
export function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}
