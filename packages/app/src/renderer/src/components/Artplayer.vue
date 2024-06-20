<template>
  <div ref="artRef" class="artplayer"></div>
</template>

<script lang="ts" setup>
import Artplayer from "artplayer";

const props = defineProps<{
  option: any;
}>();
const emit = defineEmits(["ready"]);

const artRef = ref(null);
let instance: Artplayer | null = null;

onMounted(async () => {
  instance = new Artplayer({
    ...props.option,
    // @ts-ignore
    container: artRef.value,
    url: "",
  });

  await nextTick();
  emit("ready", instance);
});

onBeforeUnmount(() => {
  if (instance && instance.destroy) {
    instance.destroy(false);
  }
});
</script>

<style lang="less">
.artplayer {
  width: 100%;
  height: 100%;
}
</style>
