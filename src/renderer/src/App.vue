<template>
  <n-space vertical>
    <n-layout has-sider>
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
        <router-view></router-view>
      </n-layout>
    </n-layout>
  </n-space>
</template>

<script setup lang="ts">
import { NIcon } from "naive-ui";
import type { MenuOption } from "naive-ui";
import { RouterLink } from "vue-router";
import { BookOutline as BookIcon, HomeOutline as HomeIcon } from "@vicons/ionicons5";

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
            name: "home",
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
            name: "tools",
          },
        },
        { default: () => "工具" },
      ),
    key: "hear-the-wind-sing",
    icon: renderIcon(BookIcon),
  },
];
</script>

<style lang="less">
@import "./assets/css/styles.less";

.main-container {
  margin: 20px;
}
</style>
