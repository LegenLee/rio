import { isBlocked, type DisabledProps } from './disabled';

export interface LinkProps extends DisabledProps {
  href?: string;
}

/**
 * An `<a>`'s attributes as a link: its `href`, or while disabled or soft-disabled none, which
 * leaves nothing to follow. Without `href`, an `<a>` is a placeholder; the role makes it a link
 * again, disabled. Only the soft variant keeps the focus.
 */
export function linkAttrs(p: LinkProps) {
  const unavailable = isBlocked(p);
  return {
    href: unavailable ? undefined : p.href,
    role: unavailable ? 'link' : undefined,
    'aria-disabled': unavailable ? 'true' : undefined,
    tabindex: p.softDisabled && !p.disabled ? '0' : undefined,
  };
}
