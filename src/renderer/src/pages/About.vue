<template>
  <div>
    <h1>bili-uploader</h1>
    <p>
      介绍：做这款工具的主要原因是为了解决录播工具的碎片化，往往想完整处理一场带有弹幕的录播要使用多个软件的配合，一些工具更是只有CLI，加大了使用难度。我想做一个能够一站式解决录播问题的工具，所以就有了这个项目。
    </p>
    <p>版本：{{ version }}</p>
    <p>
      作者：<a href="https://space.bilibili.com/10995238" class="external">renmu123</a>
      点点关注吧，秋梨膏
    </p>
    <p>
      项目地址：<a href="https://github.com/renmu123/biliLive-tools" class="external"
        >biliLive-tools</a
      >
    </p>
    <p>
      备用下载地址：<a href="https://www.alipan.com/s/iRyhxjdqGeL" class="external"
        >biliLive-tools</a
      >
    </p>
    <p>
      请我喝瓶快乐水：<a href="https://afdian.net/a/renmu123" class="external"
        >https://afdian.net/a/renmu123</a
      >
    </p>
    <p>
      更新历史：<a
        href="https://github.com/renmu123/biliLive-tools/blob/master/CHANGELOG.md"
        class="external"
        >https://github.com/renmu123/biliLive-tools/blob/master/CHANGELOG.md</a
      >
    </p>
    <!-- <p>交流群：872011161</p> -->
    <p>
      反馈地址：如果遇到bug，请在设置中将"log等级"调整至debug模式，并进行复现，之后在<a
        href="https://github.com/renmu123/biliLive-tools/issues"
        class="external"
        >issues</a
      >中附上复现步骤，以及相应的日志文件
    </p>
    <p>本软件为开源软件，采用GPLv3授权</p>
    <div>
      感谢以下开源软件对本项目的贡献：
      <ul>
        <li>
          <a href="https://github.com/hihkm/DanmakuFactory" class="external">DanmakuFactory</a>
        </li>
        <li>
          <a href="https://github.com/biliup/biliup-rs" class="external">biliup-rs</a>
        </li>
        <li>
          <a href="https://github.com/BililiveRecorder/BililiveRecorder" class="external"
            >BililiveRecorder</a
          >
        </li>
        <li>
          <a href="https://github.com/renmu123/biliAPI" class="external">biliAPI</a>
        </li>
      </ul>
    </div>
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
