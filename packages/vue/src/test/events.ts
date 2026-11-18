// What leaves an overlay: the events from inside it that reach the page around it.
import { onTestFinished } from 'vitest';

const TYPES = ['click', 'pointerdown', 'pointerup', 'mousedown', 'mouseup', 'keydown'];

/** Records the type of each event from inside `overlay` that bubbles out to the document's body. */
export function eventsLeaving(overlay: () => Element): string[] {
  const seen: string[] = [];
  const listen = (event: Event) => {
    if (overlay().contains(event.target as Node)) seen.push(event.type);
  };
  for (const type of TYPES) document.body.addEventListener(type, listen);
  onTestFinished(() => {
    for (const type of TYPES) document.body.removeEventListener(type, listen);
  });
  return seen;
}
