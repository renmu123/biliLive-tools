<template>
  <n-tabs type="segment">
    <n-tab-pane name="chap1" tab="转封装">
      <File2Mp4></File2Mp4>
    </n-tab-pane>
    <n-tab-pane name="chap2" tab="弹幕转换">
      <DanmuFactoryVue></DanmuFactoryVue>
    </n-tab-pane>
    <!-- <n-tab-pane name="chap3" tab="第三章">
    </n-tab-pane> -->
  </n-tabs>
</template>

<script setup lang="ts">
import File2Mp4 from "./components/File2Mp4.vue";
import DanmuFactoryVue from "./components/DanmuFactory.vue";
</script>

<style scoped></style>
