import { createApp } from "vue";
import App from "./App.vue";
import router from "./routers";
import { createPinia } from "pinia";

// console.log("window.api", window.api);

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

const pinia = createPinia();
createApp(App).use(router).use(pinia).mount("#app");
