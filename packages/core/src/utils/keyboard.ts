/** The modifier keys a key event reports: a DOM one, or a framework's own */
export interface ModifierKeys {
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
}

/**
 * Whether Alt, Ctrl, or Meta is held with the key, which makes it a shortcut that a component's
 * own keys leave to the browser, the system, or the app. Shift isn't one of them.
 */
export function hasModifier(event: ModifierKeys): boolean {
  return event.altKey || event.ctrlKey || event.metaKey;
}
