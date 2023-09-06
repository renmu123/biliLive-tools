<template>
  <n-notification-provider>
    <n-dialog-provider>
      <n-space vertical>
        <n-layout has-sider class="layout">
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
    </n-dialog-provider>
  </n-notification-provider>
</template>

<script setup lang="ts">
import { NIcon } from "naive-ui";
import type { MenuOption } from "naive-ui";
import { RouterLink } from "vue-router";
import {
  BuildOutline as BookIcon,
  HomeOutline as HomeIcon,
  InformationCircleOutline as InfoIcon,
} from "@vicons/ionicons5";

const activeKey = ref("go-back-home");
const collapsed = ref(true);

function renderIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) });
}

const menuOptions: MenuOption[] = [
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
            name: "About",
          },
        },
        { default: () => "关于" },
      ),
    key: "about",
    icon: renderIcon(InfoIcon),
  },
];
</script>

<style lang="less">
@import "./assets/css/styles.less";

.main-container {
  margin: 20px;
}
</style>
