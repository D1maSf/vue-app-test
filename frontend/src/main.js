import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './routers';
import './assets/scss/index.scss';
import { createVuetify } from 'vuetify';
import 'vuetify/styles'; // Основные стили Vuetify
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';


const vuetify = createVuetify({
    components,
    directives
});

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(vuetify); // Используем Vuetify
app.mount('#app');