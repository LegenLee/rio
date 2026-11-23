/**
 * The elements that take the focus themselves, for a field to leave a press on one of them alone
 * rather than taking the focus from it.
 */
export const FOCUSABLE_SELECTOR =
  'a[href], button, input, select, textarea, [tabindex], [contenteditable]';

const TABBABLE = [
  'a[href]',
  'area[href]',
  'button',
  'input:not([type="hidden"])',
  'select',
  'textarea',
  'iframe',
  'audio[controls]',
  'video[controls]',
  'summary',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]',
].join(',');

/** Whether an element is a radio button */
export const isRadio = (element: Element): element is HTMLInputElement =>
  element.localName === 'input' && (element as HTMLInputElement).type === 'radio';

const visible = (element: HTMLElement) =>
  typeof element.checkVisibility === 'function'
    ? element.checkVisibility({ visibilityProperty: true })
    : element.getClientRects().length > 0;

/**
 * The elements Tab stops at in `root`, in order: enabled, shown, and not inert. Tab stops at one
 * radio button of a group: the checked one, or else the first. Elements inside shadow roots aren't
 * found.
 */
export const tabbablesIn = (root: HTMLElement) => {
  const all = [...root.querySelectorAll<HTMLElement>(TABBABLE)].filter(
    (element) =>
      element.tabIndex >= 0 &&
      !element.matches(':disabled') &&
      !element.closest('[inert]') &&
      visible(element),
  );
  return all.filter((element) => {
    if (!isRadio(element) || !element.name) return true;
    const group = all.filter(
      (other) => isRadio(other) && other.name === element.name && other.form === element.form,
    ) as HTMLInputElement[];
    const checked = group.find((radio) => radio.checked);
    return element === (checked ?? group[0]);
  });
};
