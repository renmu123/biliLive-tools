<template>
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
          class="main-menu"
          :style="{ marginBottom: `${footerMenuOptions.length * 50}px` }"
          :collapsed="collapsed"
          :collapsed-width="64"
          :collapsed-icon-size="22"
          :options="menuOptions"
          default-expand-all
        />

        <n-layout-footer position="absolute">
          <n-menu
            v-model:value="activeKey"
            class="footer-menu"
            :collapsed="collapsed"
            :collapsed-width="64"
            :collapsed-icon-size="22"
            :options="footerMenuOptions"
            default-expand-all
          />
        </n-layout-footer>
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
  <ChangelogModal v-model:visible="changelogVisible"></ChangelogModal>
  <logModal v-model:visible="logVisible"></logModal>
</template>

<script setup lang="ts">
import { useStorage } from "@vueuse/core";
import { NIcon } from "naive-ui";
import { RouterLink, useRoute, useRouter } from "vue-router";
import {
  BuildOutline as BookIcon,
  HomeOutline as HomeIcon,
  InformationCircleOutline as InfoIcon,
  GitPullRequestOutline as QueueIcon,
  SettingsOutline as SettingIcon,
  LogOutOutline,
} from "@vicons/ionicons5";
import { DashboardOutlined as DashboardIcon, LiveTvRound } from "@vicons/material";

import defaultUserAvatar from "../../assets/images/moehime.jpg";
import AppSettingDialog from "../../pages/setting/index.vue";
import ChangelogModal from "../../components/ChangelogModal.vue";
import logModal from "../../components/logModal.vue";
import { useUserInfoStore, useQueueStore, useAppConfig } from "../../stores";
import { commonApi } from "@renderer/apis";
import logSvg from "./logSvg.vue";

import type { MenuOption } from "naive-ui";

const quenuStore = useQueueStore();
const appConfig = useAppConfig();

const { userInfo } = storeToRefs(useUserInfoStore());

const route = useRoute();
const activeKey = ref("Home");
activeKey.value = route.name as string;
const collapsed = useStorage("collapsed", true);

appConfig.getAppConfig();

function renderIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) });
}
const isWeb = computed(() => window?.isWeb);

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

const router = useRouter();
const footerMenuOptions = computed<MenuOption[]>(() => {
  const menus: {
    label: () => VNode;
    key: string;
    icon?: () => VNode;
  }[] = [];
  if (isWeb.value) {
    menus.push({
      label: () =>
        h(
          "a",
          {
            onClick: () => {
              window.localStorage.setItem("key", "");
              router.push({ name: "Login" });
            },
            // style: {
            //   marginLeft: "25px",
            // },
          },
          { default: () => "登出" },
        ),
      key: "log",
      icon: renderIcon(LogOutOutline),
    });
    menus.push({
      label: () =>
        h(
          "a",
          {
            onClick: () => {
              logVisible.value = true;
            },
            // style: {
            //   marginLeft: "25px",
            // },
          },
          { default: () => "日志" },
        ),
      key: "log",
      icon: renderIcon(logSvg),
    });
  }
  menus.push(
    ...[
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
        key: "About",
        icon: renderIcon(InfoIcon),
      },
      {
        label: () =>
          h(
            "a",
            {
              onClick: () => {
                settingVisible.value = true;
              },
            },
            { default: () => "设置" },
          ),
        key: "setting",
        icon: renderIcon(SettingIcon),
      },
    ],
  );
  return menus;
});

const menuOptions = computed<MenuOption[]>(() => {
  const toolsSubMenus = [
    {
      key: "Upload",
      label: () =>
        h(
          RouterLink,
          {
            to: {
              name: "Upload",
            },
          },
          { default: () => "B站上传" },
        ),
    },
    {
      key: "DanmakuFactory",
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
      key: "Convert2Mp4",
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
      key: "VideoMerge",
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
      key: "BiliDownload",
      label: () =>
        h(
          RouterLink,
          {
            to: {
              name: "BiliDownload",
            },
          },
          { default: () => "下载订阅" },
        ),
    },
  ];
  // 如果是web，不显示切片页
  if (isWeb.value) {
    const index = toolsSubMenus.findIndex((item) => item.key === "videoCut");
    if (index !== -1) {
      toolsSubMenus.splice(index, 1);
    }
  }
  const menus = [
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
      key: "Home",
      icon: renderIcon(HomeIcon),
    },
    {
      key: "recorder",
      label: () =>
        h(
          RouterLink,
          {
            to: {
              name: "recorder",
            },
          },
          { default: () => "直播录制" },
        ),
      icon: renderIcon(LiveTvRound),
    },
    {
      label: () =>
        h(
          RouterLink,
          {
            to: {
              name: "Dashboard",
            },
          },
          { default: () => "看板" },
        ),
      key: "Dashboard",
      icon: renderIcon(DashboardIcon),
    },
    {
      label: () => h("span", "工具"),
      key: "tools",
      icon: renderIcon(BookIcon),
      children: toolsSubMenus,
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
          { default: () => "任务队列" },
        ),
      key: "Queue",
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
      key: "User",
      icon: renderImg(userInfo.value?.profile?.face || defaultUserAvatar),
    },
  ];
  return menus;
});

const settingVisible = ref(false);
window?.api?.openSetting(() => {
  settingVisible.value = true;
});

const logVisible = ref(false);
window?.api?.openLog(() => {
  logVisible.value = true;
});
window?.api?.openChangelog(() => {
  changelogVisible.value = true;
});

const notification = useNotification();

// const { notification } = createDiscreteApi(["message", "dialog", "notification", "loadingBar"]);

window.addEventListener("unhandledrejection", (error) => {
  notification.error({
    title: String(error.reason).replace("Error: ", ""),
    duration: 3000,
  });
});

// 更新日志处理
const changelogVisible = ref(false);
const initChanglog = async () => {
  const data = JSON.parse(localStorage.getItem("changelog") || "{}");
  const version = await commonApi.version();
  if (!data[version]) {
    changelogVisible.value = true;
  }
};
initChanglog();
</script>

<style lang="less">
@import "../../assets/css/styles.less";

.main-container {
  margin: 15px;
  margin-right: 0px;

  & > .n-layout-scroll-container {
    padding-right: 10px;
  }
}
.main-menu {
  margin-bottom: 100px;
}
.footer-menu {
  position: relative;
  z-index: 10;
  background: white;
  @media screen and (prefers-color-scheme: dark) {
    background: #18181c;
  }
}
</style>
