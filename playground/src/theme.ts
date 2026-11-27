import type { RioThemeOptions } from '@rio-m3e/vue';
import { reactive } from 'vue';

type Controlled = 'sourceColor' | 'variant' | 'contrast' | 'motion';

/** The playground's theme. Its controls change it, and `createRio` writes it again as they do. */
export const theme = reactive<
  Required<Pick<RioThemeOptions, Controlled | 'staticColors'>> & {
    /** One of the Mode select's options: never `false`, which writes no color scheme */
    colorScheme: Exclude<RioThemeOptions['colorScheme'], false | undefined>;
  }
>({
  sourceColor: '#6750a4',
  variant: 'tonal-spot',
  contrast: 0,
  motion: 'expressive',
  colorScheme: 'light dark',
  // For the buttons' Color select
  staticColors: { success: '#2e7d32' },
});
