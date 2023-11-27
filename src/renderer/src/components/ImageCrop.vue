<template>
  <div>
    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      style="display: none"
      @change="handleCoverChange"
    />
    <img
      v-if="src"
      class="image"
      :src="src"
      :style="{
        height: props.height,
        width: props.width,
      }"
      @click="selectImage"
    />
    <div
      v-else
      class="empty-image"
      :style="{
        height: props.height,
        width: props.width,
      }"
      @click="selectImage"
    >
      选择图片
    </div>
  </div>
</template>

<script setup lang="ts">
const src = defineModel<string | undefined>({ required: true, default: "" });

interface Props {
  height?: string;
  width?: string;
}
const props: Props = withDefaults(defineProps<Props>(), {
  height: "100px",
  width: "160px",
});

const handleCoverChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  console.log(file);
  src.value = file.path;
};

const fileInputRef = ref<HTMLInputElement | null>(null);
const selectImage = () => {
  fileInputRef.value?.click();
};
</script>

<style scoped lang="less">
.image {
  cursor: pointer;
}

.empty-image {
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px dashed #ccc;
  cursor: pointer;
  color: #666;
}
</style>
