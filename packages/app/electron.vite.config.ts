import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { NaiveUiResolver } from "unplugin-vue-components/resolvers";

import { version } from "./package.json";

export default defineConfig({
  main: {
    plugins: [
      externalizeDepsPlugin({
        exclude: ["@biliLive-tools/shared", "@biliLive-tools/http"],
      }),
    ],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer/src"),
        "@types": resolve("src/types"),
      },
    },
    define: {
      __APP_VERSION__: JSON.stringify(version),
    },
    plugins: [
      vue({
        script: {
          defineModel: true,
        },
      }),
      AutoImport({
        imports: [
          "vue",
          {
            "naive-ui": ["useDialog", "useMessage", "useNotification", "useLoadingBar"],
          },
          "pinia",
        ],
      }),
      Components({
        resolvers: [NaiveUiResolver()],
      }),
    ],
  },
});
