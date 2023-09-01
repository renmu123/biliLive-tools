<template>
  <n-tabs type="segment">
    <n-tab-pane name="chap1" tab="转封装">
      <File2Mp4></File2Mp4>
    </n-tab-pane>
    <n-tab-pane name="chap2" tab="弹幕转换">
      <DanmuFactoryVue></DanmuFactoryVue>
    </n-tab-pane>
    <!-- <n-tab-pane name="chap3" tab="第三章">
      但是忽然，公寓的烟味消失，火警也停了。我的女朋友走进了房间，让我震惊的是，她摘下了自己的假发，她是
      Jeff Bezos（Amazon 老板）假扮的！<br /><br />
      “我对你坚持顾客至上的原则感到十分骄傲”，说完，他递给我一张五美金的亚马逊礼品卡，从我家窗户翻了出去，跳上了一辆
      Amazon 会员服务的小货车，一溜烟离开了。<br /><br />虽然现在我已不在 Amazon
      工作，但我还是非常感激在哪里学的到的经验，这些经验我终身难忘。你们同意么？
    </n-tab-pane> -->
  </n-tabs>
</template>

<script setup lang="ts">
import File2Mp4 from "./components/File2Mp4.vue";
import DanmuFactoryVue from "./components/DanmuFactory.vue";
</script>

<style scoped></style>
