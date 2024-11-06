<template>
  <svg
    :width="width"
    :height="height"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="2"
      y="2"
      width="20"
      height="20"
      rx="2"
      ry="2"
      :stroke="strokeColor"
      stroke-width="1"
      fill="none"
    />
    <line x1="6" y1="7" x2="18" y2="7" :stroke="strokeColor" stroke-width="1" />
    <line x1="6" y1="11" x2="18" y2="11" :stroke="strokeColor" stroke-width="1" />
    <line x1="6" y1="15" x2="14" y2="15" :stroke="strokeColor" stroke-width="1" />
  </svg>
</template>

<script>
export default {
  name: "SvgIcon",
  props: {
    width: {
      type: [String, Number],
      default: 24,
    },
    height: {
      type: [String, Number],
      default: 24,
    },
    strokeColor: {
      type: String,
      default: "#000",
    },
  },
};
</script>

<style scoped>
/* 你可以在这里添加组件的样式 */
</style>
