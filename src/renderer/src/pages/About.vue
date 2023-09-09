<template>
  <div>
    <h1>bili-uploader</h1>
    <p>版本：{{ version }}</p>
    <p>作者：<a href="https://space.bilibili.com/10995238" class="external">renmu123</a></p>
    <p>本软件为开源软件，采用GPLv3授权</p>
    <p>
      项目地址：<a href="https://github.com/renmu123/biliLive-tools" class="external">
        biliLive-tools</a
      >
    </p>
    <p>
      反馈地址：<a href="https://github.com/renmu123/biliLive-tools/issues" class="external">
        issues</a
      >
    </p>
  </div>
</template>

<script setup lang="ts">
const version = ref();
onMounted(async () => {
  version.value = await window.api.appVersion();

  const externalLinks = document.querySelectorAll("a.external");
  externalLinks.forEach((link: any) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      window.api.openExternal(link.href);
    });
  });
});
</script>

<style scoped></style>
