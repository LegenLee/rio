import { describe, expect, test } from 'vitest';
import { createStateVariables, focusIndicatorVar, stateLayerOpacityVar } from './state';

// Transcribed from Material Web `_md-sys-state.scss` and `_md-sys-state-focus-indicator.scss`
// (v34.0.21), independently of the source.
const MWC: [string, string][] = [
  ['--rio-state-hover-state-layer-opacity', '0.08'],
  ['--rio-state-focus-state-layer-opacity', '0.1'],
  ['--rio-state-pressed-state-layer-opacity', '0.1'],
  ['--rio-state-dragged-state-layer-opacity', '0.16'],
  ['--rio-state-disabled-state-layer-opacity', '0.38'],
  ['--rio-state-focus-indicator-thickness', '3px'],
  ['--rio-state-focus-indicator-outer-offset', '2px'],
  ['--rio-state-focus-indicator-inner-offset', '-3px'],
];

describe('createStateVariables', () => {
  const vars = createStateVariables();

  test('defines exactly the Material Web state tokens', () => {
    expect(Object.entries(vars).sort()).toEqual([...MWC].sort());
  });
});

describe('variable names', () => {
  test('follow the md.sys.state token names', () => {
    expect(stateLayerOpacityVar('pressed')).toBe('--rio-state-pressed-state-layer-opacity');
    expect(focusIndicatorVar('outer-offset')).toBe('--rio-state-focus-indicator-outer-offset');
  });
});
