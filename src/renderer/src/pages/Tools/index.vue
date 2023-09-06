<template>
  <n-tabs type="segment">
    <n-tab-pane name="chap1" tab="转封装" display-directive="show:lazy">
      <File2Mp4></File2Mp4>
    </n-tab-pane>
    <n-tab-pane name="chap2" tab="弹幕转换" display-directive="show:lazy">
      <DanmuFactoryVue></DanmuFactoryVue>
    </n-tab-pane>
  </n-tabs>
</template>

<script setup lang="ts">
defineOptions({
  name: "Tools",
});
import File2Mp4 from "./components/File2Mp4.vue";
import DanmuFactoryVue from "./components/DanmuFactory.vue";
</script>

<style scoped></style>
