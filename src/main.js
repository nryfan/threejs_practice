import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// import * as DataV from '@dataview/datav-vue3';
import store from "./store";
import router from "./router";
import App from './App.vue'


import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const app = createApp(App)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(router)
app.use(ElementPlus)
// app.use(DataV, { classNamePrefix: 'dv-' });
app.use(store)
app.mount('#app')
