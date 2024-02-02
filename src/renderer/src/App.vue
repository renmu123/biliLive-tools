<template>
  <n-notification-provider>
    <n-dialog-provider>
      <n-space vertical>
        <n-layout has-sider class="layout" position="absolute">
          <n-layout-sider
            bordered
            collapse-mode="width"
            :collapsed-width="64"
            :width="240"
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
</template>

<script setup lang="ts">
import { NIcon, createDiscreteApi } from "naive-ui";
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
import AppSettingDialog from "./components/AppSettingDialog/index.vue";

import { useUserInfoStore, useQueueStore, useAppConfig } from "./stores";
const quenuStore = useQueueStore();
const appConfig = useAppConfig();

const { userInfo } = storeToRefs(useUserInfoStore());

const activeKey = ref("go-back-home");
const collapsed = ref(true);

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
      label: () =>
        h(
          RouterLink,
          {
            to: {
              name: "Tools",
            },
          },
          { default: () => "工具" },
        ),
      key: "tools",
      icon: renderIcon(BookIcon),
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
    title: String(error.reason),
    duration: 5000,
  });
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
