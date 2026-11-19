export interface LinkProps {
  href?: string;
  disabled?: boolean;
  softDisabled?: boolean;
}

/**
 * An `<a>`'s attributes as a link: its `href`, or while disabled or soft-disabled none, which
 * leaves nothing to follow. Without `href`, an `<a>` is a placeholder; the role makes it a link
 * again, disabled. Only the soft variant keeps the focus.
 */
export function linkAttrs(p: LinkProps) {
  const unavailable = !!p.disabled || !!p.softDisabled;
  return {
    href: unavailable ? undefined : p.href,
    role: unavailable ? 'link' : undefined,
    'aria-disabled': unavailable ? 'true' : undefined,
    tabindex: p.softDisabled && !p.disabled ? '0' : undefined,
  };
}
