<template>
  <div class="">
    <div style="display: flex; gap: 10px; align-items: center">
      <h2>同步配置</h2>
      <p>使用前请务必了解相关同步库并<bold>仔细查看文档</bold></p>
    </div>

    <n-form label-placement="left" :label-width="145">
      <n-tabs type="segment" style="margin-top: 10px" class="tabs">
        <n-tab-pane
          class="tab-pane"
          name="BaiduPCS"
          tab="BaiduPCS-GO(百度网盘)"
          display-directive="show:lazy"
        >
          <n-form-item>
            <template #label> 项目地址 </template>
            <a href="https://github.com/qjfoidnh/BaiduPCS-Go" class="external" target="_blank"
              >https://github.com/qjfoidnh/BaiduPCS-Go</a
            >
          </n-form-item>
          <n-form-item>
            <template #label> 可执行文件 </template>
            <n-input
              v-model:value="config.sync.baiduPCS.execPath"
              placeholder="请选择要使用的可执行文件"
            />
            <template v-if="config.sync.baiduPCS.execPath">
              <n-button style="margin-left: 10px" type="primary" @click="baiduPCSLogin"
                >登录</n-button
              >
              <n-button style="margin-left: 10px" type="warning" @click="baiduPCSLoginCheck"
                >登录检查</n-button
              >
              <n-button style="margin-left: 10px" type="info" @click="baiduPCSUploadCheck"
                >上传测试</n-button
              >
            </template>

            <n-icon style="margin-left: 10px" size="26" class="pointer" @click="selectFolder">
              <FolderOpenOutline />
            </n-icon>
          </n-form-item>
          <!-- 百度网盘cookie -->
          <n-form-item>
            <template #label>
              <Tip
                tip="在网盘中保存文件的根目录，不会有重复文件检查，采用软件的设置"
                text="网盘目标目录"
              ></Tip>
            </template>
            <n-input
              v-model:value="config.sync.baiduPCS.targetPath"
              placeholder="请选择要上传的网盘目标路径"
            />
          </n-form-item>
        </n-tab-pane>
      </n-tabs>
    </n-form>
    <n-modal v-model:show="baiduPCSLoginVisible" :mask-closable="false" auto-focus>
      <n-card
        style="width: 600px; max-height: 60%"
        :bordered="false"
        size="huge"
        role="dialog"
        aria-modal="true"
        class="card"
      >
        <n-input
          v-model:value="cookies"
          placeholder="请输入cookie，具体见文档，你也可以自己在命令行登录，本软件不会保存相关鉴权参数"
          type="textarea"
        ></n-input>
        <template #footer>
          <div class="footer">
            <n-button class="btn" @click="baiduPCSLoginVisible = false">取消</n-button>
            <!-- <n-button v-if="!isWeb" type="info" class="btn"> 试试客户端特有的登录 </n-button> -->
            <n-button type="primary" class="btn" @click="baiduPCSLoginConfirm"> 确认 </n-button>
          </div>
        </template>
      </n-card>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { FolderOpenOutline } from "@vicons/ionicons5";
import { showFileDialog } from "@renderer/utils/fileSystem";

import { syncApi } from "@renderer/apis";
// import { useConfirm } from "@renderer/hooks";

import type { AppConfig } from "@biliLive-tools/types";

const config = defineModel<AppConfig>("data", {
  default: () => {},
});

// const isWeb = computed(() => window.isWeb);

const selectFolder = async () => {
  let file: string | undefined = await showFileDialog({
    defaultPath: config.value.sync.baiduPCS.execPath,
  });

  if (!file) return;
  config.value.sync.baiduPCS.execPath = file;
};

const notice = useNotice();
const baiduPCSLoginVisible = ref(false);
const cookies = ref("");
const baiduPCSLogin = async () => {
  if (!config.value.sync.baiduPCS.execPath) {
    notice.error("请先选择可执行文件");
    return;
  }
  cookies.value = "";
  baiduPCSLoginVisible.value = true;
  // 客户端支持使用内嵌网页登录
  // 支持cookie登录，需要实现http接口，不要加密了把
};

const baiduPCSLoginConfirm = async () => {
  if (!cookies.value) {
    notice.error("请先输入cookie");
    return;
  }
  await syncApi.loginByCookie({
    cookie: cookies.value,
    execPath: config.value.sync.baiduPCS.execPath,
  });
  notice.success("登录成功");
  baiduPCSLoginVisible.value = false;
};

const baiduPCSLoginCheck = async () => {
  if (!config.value.sync.baiduPCS.execPath) {
    notice.error("请先选择可执行文件");
    return;
  }

  const status = await syncApi.syncTestLogin({
    execPath: config.value.sync.baiduPCS.execPath,
  });
  if (status) {
    notice.success("已存在登录信息");
  } else {
    notice.error("未检测到登录信息，请先登录");
  }
};
const baiduPCSUploadCheck = async () => {
  if (!config.value.sync.baiduPCS.execPath) {
    notice.error("请先选择可执行文件");
    return;
  }
  if (!config.value.sync.baiduPCS.targetPath) {
    notice.error("请先选择网盘目标路径");
    return;
  }

  await syncApi.syncTestUpload({
    execPath: config.value.sync.baiduPCS.execPath,
    remoteFolder: config.value.sync.baiduPCS.targetPath,
  });
  notice.success("上传测试成功");
};
</script>

<style scoped lang="less">
.item {
  display: flex;
}

.tab-pane {
  padding: 12px 0 !important;
}
.tabs {
  :deep(.n-tabs-tab) {
    padding: 6px 0;
  }
}

.footer {
  text-align: right;
  .btn + .btn {
    margin-left: 10px;
  }
}
</style>
