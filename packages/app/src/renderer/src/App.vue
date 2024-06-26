<template>
  <n-config-provider :theme="theme">
    <n-notification-provider>
      <n-dialog-provider>
        <n-space vertical>
          <n-layout has-sider class="layout" position="absolute">
            <n-layout-sider
              bordered
              collapse-mode="width"
              :collapsed-width="64"
              :width="160"
              :collapsed="collapsed"
              show-trigger
              @collapse="collapsed = true"
              @expand="collapsed = false"
            >
              <n-menu
                v-model:value="activeKey"
                :collapsed="collapsed"
                :collapsed-width="64"
                :collapsed-icon-size="22"
                :options="menuOptions"
                default-expand-all
              />
            </n-layout-sider>

            <n-layout class="main-container">
              <router-view v-slot="{ Component }">
                <keep-alive>
                  <component :is="Component" />
                </keep-alive>
              </router-view>
            </n-layout>
          </n-layout>
        </n-space>
        <AppSettingDialog v-model="settingVisible"></AppSettingDialog>
      </n-dialog-provider>
    </n-notification-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { useStorage } from "@vueuse/core";

import { NIcon, createDiscreteApi, darkTheme, lightTheme, useOsTheme } from "naive-ui";
import type { MenuOption } from "naive-ui";
import { RouterLink } from "vue-router";
import { storeToRefs } from "pinia";

import {
  BuildOutline as BookIcon,
  HomeOutline as HomeIcon,
  InformationCircleOutline as InfoIcon,
  GitPullRequestOutline as QueueIcon,
} from "@vicons/ionicons5";
import defaultUserAvatar from "./assets/images/moehime.jpg";
import AppSettingDialog from "./pages/setting/index.vue";
import { useUserInfoStore, useQueueStore, useAppConfig } from "./stores";

const quenuStore = useQueueStore();
const appConfig = useAppConfig();

const { userInfo } = storeToRefs(useUserInfoStore());

const activeKey = ref("go-back-home");
const collapsed = useStorage("collapsed", true);

appConfig.getAppConfig();

function renderIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) });
}

function renderQueueIcon(icon: Component) {
  return () =>
    h(
      "div",
      {
        style: { position: "relative" },
      },
      [
        h(
          "span",
          {
            style: {
              color: "red",
              position: "absolute",
              right: "-4px",
              top: "-4px",
              fontSize: "12px",
            },
          },
          quenuStore.runningTaskNum || "",
        ),
        h(NIcon, null, { default: () => h(icon) }),
      ],
    );
}

function renderImg(src: string) {
  return () =>
    h("img", { src, style: { height: "30px", width: "30px" }, referrerpolicy: "no-referrer" });
}

const menuOptions = computed<MenuOption[]>(() => {
  return [
    {
      label: () =>
        h(
          RouterLink,
          {
            to: {
              name: "Home",
            },
          },
          { default: () => "主页" },
        ),
      key: "go-back-home",
      icon: renderIcon(HomeIcon),
    },
    {
      label: () => h("span", "工具页"),
      key: "about1",
      icon: renderIcon(BookIcon),
      children: [
        {
          key: "upload",
          label: () =>
            h(
              RouterLink,
              {
                to: {
                  name: "Upload",
                },
              },
              { default: () => "上传" },
            ),
        },
        {
          key: "danmakufactory",
          label: () =>
            h(
              RouterLink,
              {
                to: {
                  name: "DanmakuFactory",
                },
              },
              { default: () => "弹幕转换" },
            ),
        },
        {
          key: "convert2mp4",
          label: () =>
            h(
              RouterLink,
              {
                to: {
                  name: "Convert2Mp4",
                },
              },
              { default: () => "转码" },
            ),
        },
        {
          key: "videoCut",
          label: () =>
            h(
              RouterLink,
              {
                to: {
                  name: "videoCut",
                },
              },
              { default: () => "切片" },
            ),
        },
        {
          key: "videoMerge",
          label: () =>
            h(
              RouterLink,
              {
                to: {
                  name: "VideoMerge",
                },
              },
              { default: () => "视频合并" },
            ),
        },
        {
          key: "biliDownload",
          label: () =>
            h(
              RouterLink,
              {
                to: {
                  name: "BiliDownload",
                },
              },
              { default: () => "B站下载" },
            ),
        },
      ],
    },
    {
      label: () =>
        h(
          RouterLink,
          {
            to: {
              name: "Queue",
            },
          },
          { default: () => "队列" },
        ),
      key: "queue",
      icon: renderQueueIcon(QueueIcon),
    },
    {
      label: () =>
        h(
          RouterLink,
          {
            to: {
              name: "User",
            },
          },
          { default: () => "用户" },
        ),
      key: "biliUser",
      icon: renderImg(userInfo.value?.profile?.face || defaultUserAvatar),
    },
    {
      label: () =>
        h(
          RouterLink,
          {
            to: {
              name: "About",
            },
          },
          { default: () => "关于" },
        ),
      key: "about",
      icon: renderIcon(InfoIcon),
    },
  ];
});

const settingVisible = ref(false);
window.api.openSetting(() => {
  settingVisible.value = true;
});

const { notification } = createDiscreteApi(["message", "dialog", "notification", "loadingBar"]);

window.addEventListener("unhandledrejection", (error) => {
  notification.error({
    title: String(error.reason).replace("Error: ", ""),
    duration: 3000,
  });
});

setInterval(() => {
  quenuStore.getQuenu();
}, 1000);

const osThemeRef = useOsTheme();
const theme = computed(() => {
  if (appConfig.appConfig.theme === "system") {
    // js检测系统主题
    // const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
    if (osThemeRef.value === "dark") {
      return darkTheme;
    } else {
      return lightTheme;
    }
  } else if (appConfig.appConfig.theme === "dark") {
    return darkTheme;
  } else {
    return lightTheme;
  }
});
</script>

<style lang="less">
@import "./assets/css/styles.less";

.main-container {
  margin: 15px;
  margin-right: 0px;

  & > .n-layout-scroll-container {
    padding-right: 10px;
  }
}
</style>
