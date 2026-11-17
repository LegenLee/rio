import type { PartialMessages } from '@rio-m3e/core';
import { createThemeVariables } from '@rio-m3e/tokens';
import { afterEach, describe, expect, onTestFinished, test, vi } from 'vitest';
import { createApp, defineComponent, h, ref, type Component } from 'vue';
import DatePicker from '../date-picker/DatePicker.vue';
import LocaleProvider from '../locale/LocaleProvider.vue';
import TimeInput from '../time-picker/TimeInput.vue';
import { createRio, type RioOptions, type RioThemeOptions } from './rio';

const root = document.documentElement;
const primary = (sourceColor: string) =>
  createThemeVariables({ sourceColor })['--rio-color-primary'];

/** Mounts a component in an app with Rio, and unmounts it when the test ends. */
const mount = (options: RioOptions, component: Component = { render: () => null }) => {
  const host = document.body.appendChild(document.createElement('div'));
  const app = createApp(component);
  app.use(createRio(options));
  app.mount(host);
  const unmount = () => {
    app.unmount();
    host.remove();
  };
  onTestFinished(() => {
    if (host.isConnected) unmount();
  });
  return { host, unmount };
};

afterEach(() => root.style.removeProperty('color-scheme'));

describe('createRio, the theme', () => {
  test('is on the root before the app mounts, following the system’s light or dark', () => {
    let seen = '';
    const { unmount } = mount(
      { theme: { sourceColor: '#6750a4' } },
      defineComponent(() => {
        seen = root.style.getPropertyValue('--rio-color-primary');
        return () => null;
      }),
    );
    expect(seen).toBe(primary('#6750a4'));
    expect(root.style.colorScheme).toBe('light dark');
    // Unmounting takes it off again.
    unmount();
    expect(root.style.getPropertyValue('--rio-color-primary')).toBe('');
    expect(root.style.colorScheme).toBe('');
  });

  test('colorScheme picks one, or false leaves the app’s own', () => {
    const { unmount } = mount({ theme: { sourceColor: '#6750a4', colorScheme: 'dark' } });
    expect(root.style.colorScheme).toBe('dark');
    unmount();
    root.style.colorScheme = 'light';
    mount({ theme: { sourceColor: '#6750a4', colorScheme: false } });
    expect(root.style.colorScheme).toBe('light');
  });

  test('a ref writes it again as it changes, and taking it away takes the theme off', async () => {
    const theme = ref<RioThemeOptions | undefined>({ sourceColor: '#6750a4' });
    mount({ theme });
    theme.value = { sourceColor: '#006a6a', colorScheme: 'dark' };
    await vi.waitFor(() =>
      expect(root.style.getPropertyValue('--rio-color-primary')).toBe(primary('#006a6a')),
    );
    expect(root.style.colorScheme).toBe('dark');
    theme.value = undefined;
    await vi.waitFor(() => expect(root.style.getPropertyValue('--rio-color-primary')).toBe(''));
    expect(root.style.colorScheme).toBe('');
  });

  test('css: the theme as a stylesheet, for server rendering', () => {
    const css = createRio({ theme: { sourceColor: '#6750a4' } }).css;
    expect(css.startsWith(':root {\n  color-scheme: light dark;\n')).toBe(true);
    expect(css).toContain(`--rio-color-primary: ${primary('#6750a4')};`);
    expect(createRio({ locale: 'ko' }).css).toBe('');
  });

  test('without a theme, the root is left alone', () => {
    mount({ locale: 'ko' });
    expect(root.style.getPropertyValue('--rio-color-primary')).toBe('');
    expect(root.style.colorScheme).toBe('');
  });
});

describe('createRio, the language', () => {
  test('sets it for the app; a RioLocaleProvider inside takes over', () => {
    const { host } = mount({ locale: 'de-DE' }, () =>
      h('div', [
        h(DatePicker, { label: 'Datum', modelValue: '2026-11-27' }),
        h(LocaleProvider, { locale: 'ko-KR' }, () =>
          h(DatePicker, { label: '출발', modelValue: '2026-11-27' }),
        ),
      ]),
    );
    const [german, korean] = host.querySelectorAll('input');
    expect(german!.value).toBe('27.11.2026');
    expect(korean!.value).toBe('2026. 11. 27.');
  });

  test('the app’s tables add a language, the fallback fills in, and a ref changes them', async () => {
    const messages = ref<Record<string, PartialMessages>>({ ja: { timePicker: { hour: '時' } } });
    const { host } = mount({ locale: 'ja-JP', fallbackLocale: 'ko', messages }, () =>
      h(TimeInput, { modelValue: '19:05', hourCycle: 12 }),
    );
    const [hour, minute] = host.querySelectorAll('input');
    const period = host.querySelector('[role="radiogroup"]')!;
    expect(hour!.getAttribute('aria-label')).toBe('時');
    // What the app's Japanese leaves out comes from Korean, the fallback.
    expect(minute!.getAttribute('aria-label')).toBe('분');
    expect(period.getAttribute('aria-label')).toBe('오전 또는 오후 선택');
    messages.value = { ja: { timePicker: { hour: '時間' } } };
    await vi.waitFor(() => expect(hour!.getAttribute('aria-label')).toBe('時間'));
  });

  test('without a fallback, a language without a table gets English, with the app’s own over it', () => {
    const { host } = mount(
      { locale: 'sw', messages: { en: { timePicker: { minute: 'Minutes' } } } },
      () => h(TimeInput, { modelValue: '19:05', hourCycle: 24 }),
    );
    const [hour, minute] = host.querySelectorAll('input');
    expect([hour!.getAttribute('aria-label'), minute!.getAttribute('aria-label')]).toEqual([
      'Hour',
      'Minutes',
    ]);
  });
});
