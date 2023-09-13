<!-- bili设置 -->
<template>
  <div>
    {{ formData }}
  </div>
</template>

<script setup lang="ts">
import type { BiliupConfig } from "../../../types";

const formData = defineModel<BiliupConfig>({ required: true });

// const props = withDefaults(
//   defineProps<{
//     succeess?: "start" | "success" | "fail";
//   }>(),
//   {
//     succeess: "start",
//   },
// );
</script>

<style scoped lang="less">
.footer {
  text-align: right;
  .btn + .btn {
    margin-left: 10px;
  }
}
</style>
