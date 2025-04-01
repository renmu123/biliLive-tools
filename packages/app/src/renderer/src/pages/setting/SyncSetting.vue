<template>
  <div class="">
    <div style="display: flex; gap: 10px; align-items: center">
      <h2>Webhook 文件同步配置</h2>
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
            <template #label>
              <Tip text="可执行文件" tip="测试版本为3.9.7"> </Tip>
            </template>
            <n-input
              v-model:value="config.sync.baiduPCS.execPath"
              placeholder="请选择要使用的可执行文件"
            />
            <template v-if="config.sync.baiduPCS.execPath">
              <n-button style="margin-left: 10px" type="primary" @click="login('aliyunpan')"
                >登录</n-button
              >
              <n-button style="margin-left: 10px" type="warning" @click="loginCheck('baiduPCS')"
                >登录检查</n-button
              >
              <n-button style="margin-left: 10px" type="info" @click="uploadCheck('baiduPCS')"
                >上传测试</n-button
              >
            </template>

            <n-icon
              style="margin-left: 10px"
              size="26"
              class="pointer"
              @click="selectFolder('baiduPCS')"
            >
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
        <n-tab-pane
          class="tab-pane"
          name="aliyunpan"
          tab="aliyunpan(阿里云盘)"
          display-directive="show:lazy"
        >
          <n-form-item>
            <template #label> 项目地址 </template>
            <a href="https://github.com/tickstep/aliyunpan" class="external" target="_blank"
              >https://github.com/tickstep/aliyunpan</a
            >
          </n-form-item>
          <n-form-item>
            <template #label> <Tip text="可执行文件" tip="测试版本为0.3.7"> </Tip> </template>

            <n-input
              v-model:value="config.sync.aliyunpan.execPath"
              placeholder="请选择要使用的可执行文件"
            />
            <template v-if="config.sync.aliyunpan.execPath">
              <n-button style="margin-left: 10px" type="primary" @click="login('aliyunpan')"
                >登录</n-button
              >
              <n-button style="margin-left: 10px" type="warning" @click="loginCheck('aliyunpan')"
                >登录检查</n-button
              >
              <n-button style="margin-left: 10px" type="info" @click="uploadCheck('aliyunpan')"
                >上传测试</n-button
              >
            </template>

            <n-icon
              style="margin-left: 10px"
              size="26"
              class="pointer"
              @click="selectFolder('aliyunpan')"
            >
              <FolderOpenOutline />
            </n-icon>
          </n-form-item>
          <n-form-item>
            <template #label>
              <Tip
                tip="在网盘中保存文件的根目录，不会有重复文件检查，采用软件的设置"
                text="网盘目标目录"
              ></Tip>
            </template>
            <n-input
              v-model:value="config.sync.aliyunpan.targetPath"
              placeholder="请选择要上传的网盘目标路径"
            />
          </n-form-item>
        </n-tab-pane>
      </n-tabs>
    </n-form>
    <n-modal v-model:show="loginVisible" :mask-closable="false" auto-focus>
      <n-card
        style="width: 600px; max-height: 60%"
        :bordered="false"
        size="huge"
        role="dialog"
        aria-modal="true"
        class="card"
      >
        <template v-if="loginType === 'baiduPCS'">
          <n-input
            v-model:value="cookies"
            placeholder="请输入cookie，具体见文档，你也可以自己在命令行登录，本软件不会保存相关鉴权参数"
            type="textarea"
          ></n-input>
        </template>
        <template v-else-if="loginType === 'aliyunpan'">
          <h2>{{ cookies }}</h2>
        </template>
        <template v-else>
          <h2>登录类型错误</h2>
        </template>

        <template #footer>
          <div class="footer">
            <n-button class="btn" @click="loginCancel">取消</n-button>
            <n-button
              v-if="!isWeb && loginType === 'baiduPCS'"
              type="info"
              class="btn"
              @click="baiduPCSClientClogin"
            >
              试试客户端特有的登录
            </n-button>
            <n-button type="primary" class="btn" @click="loginConfirm"> 确认 </n-button>
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

import type { AppConfig, SyncType } from "@biliLive-tools/types";

const config = defineModel<AppConfig>("data", {
  default: () => {},
});

const isWeb = computed(() => window.isWeb);

const selectFolder = async (type: SyncType) => {
  let file: string | undefined = await showFileDialog({
    defaultPath: config.value.sync[type].execPath,
  });

  if (!file) return;
  config.value.sync[type].execPath = file;
};

const notice = useNotice();
const loginVisible = ref(false);
const cookies = ref("");
const loginType = ref<SyncType>("baiduPCS");
const login = async (type: SyncType) => {
  if (!config.value.sync[type].execPath) {
    notice.error("请先选择可执行文件");
    return;
  }
  cookies.value = "";
  loginType.value = type;
  if (type === "aliyunpan") {
    const content = await syncApi.aliyunpanLogin({
      execPath: config.value.sync.aliyunpan.execPath,
      type: "getUrl",
    });
    cookies.value = content;
  }
  loginVisible.value = true;
};

const loginConfirm = async () => {
  if (!cookies.value) {
    notice.error("请先输入cookie");
    return;
  }
  if (loginType.value === "baiduPCS") {
    await syncApi.loginByCookie({
      cookie: cookies.value,
      execPath: config.value.sync.baiduPCS.execPath,
    });
  } else if (loginType.value === "aliyunpan") {
    await syncApi.aliyunpanLogin({
      execPath: config.value.sync.aliyunpan.execPath,
      type: "confirm",
    });
  } else {
    notice.error("登录类型错误，请重新登录");
    return;
  }

  notice.success("登录成功");
  loginVisible.value = false;
};

const loginCancel = async () => {
  if (loginType.value === "aliyunpan") {
    await syncApi.aliyunpanLogin({
      execPath: config.value.sync.aliyunpan.execPath,
      type: "cancel",
    });
  }
  loginVisible.value = false;
};

const loginCheck = async (type: SyncType) => {
  if (!config.value.sync[type].execPath) {
    notice.error("请先选择可执行文件");
    return;
  }

  const status = await syncApi.syncTestLogin({
    execPath: config.value.sync[type].execPath,
    type,
  });
  if (status) {
    notice.success("已存在登录信息");
  } else {
    notice.error("未检测到登录信息，请先登录");
  }
};
const uploadCheck = async (type: SyncType) => {
  if (!config.value.sync[type].execPath) {
    notice.error("请先选择可执行文件");
    return;
  }
  if (!config.value.sync[type].targetPath) {
    notice.error("请先选择网盘目标路径");
    return;
  }

  await syncApi.syncTestUpload({
    execPath: config.value.sync[type].execPath,
    remoteFolder: config.value.sync[type].targetPath,
    type,
  });
  notice.success("上传测试成功，请前往网盘进行查看");
};
const baiduPCSClientClogin = async () => {
  notice.info("登录完成后请关闭窗口");
  const cookie = await window.api.cookie.baiduLogin();
  cookies.value = cookie;
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
