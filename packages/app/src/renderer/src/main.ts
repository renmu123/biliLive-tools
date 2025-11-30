import { createApp } from "vue";
import App from "./App.vue";
import router from "./routers";
import { createPinia } from "pinia";
import { init as axiosInit } from "./apis/request";
// @ts-ignore
import path from "path-unified";
import "@imengyu/vue3-context-menu/lib/vue3-context-menu.css";
import ContextMenu from "@imengyu/vue3-context-menu";

const isWeb = !window.api;
window.isWeb = isWeb;
if (isWeb) {
  // @ts-ignore
  window.path = path;
}
window.isFullstack = import.meta.env.VITE_FULLSTACK === "true";

const init = async () => {
  await axiosInit();
  const pinia = createPinia();
  const app = createApp(App);
  // app.provide("app", app);
  app.use(router).use(ContextMenu).use(pinia).mount("#app");
};

init();
