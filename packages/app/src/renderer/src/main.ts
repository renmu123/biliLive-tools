import { createApp } from "vue";
import App from "./App.vue";
import router from "./routers";
import { createPinia } from "pinia";
import { init as axiosInit } from "./apis/request";

const isWeb = !window.api;
window.isWeb = isWeb;
if (isWeb) {
  // @ts-ignore
  // window.api = {
  //   openSetting: () => {},
  //   openChangelog: () => {},
  //   openLog: () => {},
  //   task: {
  //     // @ts-ignore
  //     list: () => {
  //       return [];
  //     },
  //   },
  //   config: {
  //     // @ts-ignore
  //     getAll: () => {
  //       return {};
  //     },
  //   },
  // };
}

const init = async () => {
  await axiosInit();
  const pinia = createPinia();
  createApp(App).use(router).use(pinia).mount("#app");
};

init();
