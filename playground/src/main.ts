import '@rio-m3e/styles/base/focus-ring.css';
import '@rio-m3e/styles/base/state-layer.css';
import { createRio } from '@rio-m3e/vue';
import { createApp } from 'vue';
import App from './App.vue';
import { theme } from './theme';

createApp(App).use(createRio({ theme })).mount('#app');
