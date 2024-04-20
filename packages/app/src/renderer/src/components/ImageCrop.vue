<template>
  <div>
    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      style="display: none"
      @change="handleCoverChange"
    />
    <div
      :style="{
        height: props.height,
        width: props.width,
      }"
      class="image-container"
    >
      <img v-if="src" class="image" :src="src" @click="selectImage" />
      <div v-else class="empty-image" @click="selectImage">选择图片</div>
      <span v-if="src" class="remmove" @click="remove">X</span>
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

const remove = () => {
  src.value = "";
};
</script>

<style scoped lang="less">
.image-container {
  position: relative;
}
.image {
  cursor: pointer;
  height: 100%;
  width: 100%;
}

.empty-image {
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px dashed #ccc;
  cursor: pointer;
  color: #666;
  height: 100%;
  width: 100%;
}
.remmove {
  position: absolute;
  top: 0;
  right: 0;
  color: #fff;
  background: #000;
  padding: 2px 6px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 12px;
}
</style>
