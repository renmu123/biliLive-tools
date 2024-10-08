import { createApp } from "vue";
import App from "./App.vue";
import router from "./routers";
import { createPinia } from "pinia";
import { init as axiosInit } from "./apis/request";
import path from "path-browserify";

const isWeb = !window.api;
window.isWeb = isWeb;
if (isWeb) {
  window.path = path;
}

const init = async () => {
  await axiosInit();
  const pinia = createPinia();
  const app = createApp(App);
  // app.provide("app", app);
  app.use(router).use(pinia).mount("#app");
};

init();
