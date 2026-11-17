import type { RioThemeOptions } from '@rio-m3e/vue';
import { reactive } from 'vue';

type Controlled = 'sourceColor' | 'variant' | 'contrast' | 'motion' | 'colorScheme';

/** The playground's theme. Its controls change it, and `createRio` writes it again as they do. */
export const theme = reactive<Required<Pick<RioThemeOptions, Controlled>>>({
  sourceColor: '#6750a4',
  variant: 'tonal-spot',
  contrast: 0,
  motion: 'expressive',
  colorScheme: 'light dark',
});
