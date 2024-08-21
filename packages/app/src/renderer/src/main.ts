import { createApp } from "vue";
import App from "./App.vue";
import router from "./routers";
import { createPinia } from "pinia";
import { init as axiosInit } from "./apis/request";

const isClient = !!window.api;
if (!isClient) {
  // @ts-ignore
  window.api = {
    openSetting: () => {},
    openChangelog: () => {},
    openLog: () => {},
    task: {
      // @ts-ignore
      list: () => {
        return [];
      },
    },
    appVersion: async () => {
      return "0.0.0";
    },
    config: {
      // @ts-ignore
      getAll: () => {
        return {};
      },
    },
  };
}

axiosInit();

const pinia = createPinia();
createApp(App).use(router).use(pinia).mount("#app");
