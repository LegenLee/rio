import '@rio-m3e/styles/base/focus-ring.css';
import '@rio-m3e/styles/base/state-layer.css';
import { createRio } from '@rio-m3e/vue';
import { createApp } from 'vue';
import App from './App.vue';
import { icons } from '../../docs/guide/icons/mdi';
import { theme } from './theme';

createApp(App).use(createRio({ theme, icons })).mount('#app');
