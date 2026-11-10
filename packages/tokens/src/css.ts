import {
  COLOR_ROLES,
  colorVar,
  createColorScheme,
  type ColorSchemeOptions,
  type ColorVar,
} from './color';
import { createElevationVariables, type ElevationVar } from './elevation';

export type ThemeOptions = Omit<ColorSchemeOptions, 'dark'>;

export type ThemeVar = ColorVar | ElevationVar;

/**
 * 테마의 CSS 변수 전부.
 * - 색: 라이트/다크 값을 `light-dark()`로 묶는다. 실제 값은 변수를 쓰는 요소의 `color-scheme`에 따라 정해진다.
 * - elevation: 옵션과 상관없는 고정값이다.
 */
export function createThemeVariables(options: ThemeOptions): Record<ThemeVar, string> {
  const light = createColorScheme({ ...options, dark: false });
  const dark = createColorScheme({ ...options, dark: true });
  const vars = {} as Record<ThemeVar, string>;
  for (const role of COLOR_ROLES) {
    vars[colorVar(role)] = `light-dark(${light[role]}, ${dark[role]})`;
  }
  return Object.assign(vars, createElevationVariables());
}

/** SSR이나 정적 스타일시트용 CSS 문자열. `color-scheme: light dark`를 함께 넣는다. */
export function createThemeCss(options: ThemeOptions & { selector?: string }): string {
  const { selector = ':root', ...rest } = options;
  const lines = Object.entries(createThemeVariables(rest)).map(([k, v]) => `  ${k}: ${v};`);
  return `${selector} {\n  color-scheme: light dark;\n${lines.join('\n')}\n}\n`;
}

/**
 * 요소의 인라인 스타일에 테마 변수를 심는다.
 * `color-scheme`은 건드리지 않으니 쓰는 쪽에서 지정할 것.
 */
export function applyTheme(target: HTMLElement, options: ThemeOptions): void {
  for (const [k, v] of Object.entries(createThemeVariables(options))) {
    target.style.setProperty(k, v);
  }
}
