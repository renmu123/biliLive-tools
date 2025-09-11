<template>
  <div class="">
    <div style="display: flex; gap: 10px; align-items: center">
      <h2 style="display: inline-flex; align-items: center">
        文件同步配置<Tip :size="22">配置完成去webhook配置中配置相关同步器</Tip>
      </h2>
      <p>使用前请务必了解相关同步库并<bold>仔细查看文档</bold></p>
    </div>

    <n-form label-placement="left" :label-width="145">
      <n-tabs type="segment" style="margin-top: 10px" class="tabs">
        <n-tab-pane class="tab-pane" name="syncConfig" tab="同步器" display-directive="show:lazy">
          <div class="sync-config-list">
            <n-card
              v-for="(config, index) in config.sync.syncConfigs"
              :key="config.id"
              class="sync-config-card"
            >
              <template #header>
                <n-text strong>{{ config.name }}</n-text>
              </template>
              <template #header-extra>
                <n-space align="center">
                  <n-button type="primary" @click="editSyncConfig(index)">编辑</n-button>
                  <n-button type="error" text @click="deleteSyncConfig(index)">删除</n-button>
                </n-space>
              </template>
              <n-space vertical>
                <n-text>同步源: {{ getSyncSourceLabel(config.syncSource) }}</n-text>
                <n-text>目录结构: {{ config.folderStructure }}</n-text>
                <n-text>文件类型: {{ getTargetFilesLabel(config.targetFiles) }}</n-text>
              </n-space>
            </n-card>
            <n-card class="sync-config-card" @click="addSyncConfig">
              <div class="add-card">
                <n-icon size="48">
                  <Add />
                </n-icon>
                <n-text style="display: block">添加同步器</n-text>
              </div>
            </n-card>
          </div>
        </n-tab-pane>
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
              <Tip
                text="可执行文件"
                tip="测试版本为3.9.9，上传不携带任何参数，需要自定义请直接去修改配置文件"
              >
              </Tip>
            </template>
            <n-input
              v-model:value="config.sync.baiduPCS.execPath"
              placeholder="请选择要使用的可执行文件"
            />
            <template v-if="config.sync.baiduPCS.execPath">
              <n-button style="margin-left: 10px" type="primary" @click="login('baiduPCS')"
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
        </n-tab-pane>
        <n-tab-pane class="tab-pane" name="alist" tab="alist" display-directive="show:lazy">
          <n-form-item>
            <template #label> 项目地址 </template>
            <a href="https://alistgo.com" class="external" target="_blank">https://alistgo.com</a>
          </n-form-item>
          <n-form-item>
            <template #label> <Tip text="api地址" tip=""> </Tip> </template>

            <n-input v-model:value="config.sync.alist.apiUrl" placeholder="请输入api地址" />
            <template v-if="config.sync.alist.apiUrl">
              <n-button style="margin-left: 10px" type="primary" @click="login('alist')"
                >登录</n-button
              >
              <n-button style="margin-left: 10px" type="warning" @click="loginCheck('alist')"
                >登录检查</n-button
              >
              <n-button style="margin-left: 10px" type="info" @click="uploadCheck('alist')"
                >上传测试</n-button
              >
            </template>
          </n-form-item>
        </n-tab-pane>
        <n-tab-pane class="tab-pane" name="pan123" tab="123网盘" display-directive="show:lazy">
          <n-form-item>
            <template #label> 项目地址 </template>
            <a href="https://github.com/renmu123/123pan-uploader" class="external" target="_blank"
              >https://github.com/renmu123/123pan-uploader</a
            >
          </n-form-item>
          <n-form-item>
            <div style="text-align: right; width: 100%">
              <n-button style="margin-left: 10px" type="primary" @click="login('pan123')"
                >登录</n-button
              >
              <n-button style="margin-left: 10px" type="warning" @click="loginCheck('pan123')"
                >登录检查</n-button
              >
              <n-button style="margin-left: 10px" type="info" @click="uploadCheck('pan123')"
                >上传测试</n-button
              >
            </div>
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
          <h2>完成操作后点击确认按钮即可完成登录</h2>
          <h2>{{ cookies }}</h2>
        </template>
        <template v-else-if="loginType === 'alist'">
          <n-input v-model:value="alistData.username" placeholder="请输入用户名" />
          <n-input
            v-model:value="alistData.password"
            placeholder="请输入密码"
            type="password"
            style="margin-top: 20px"
          />
        </template>
        <template v-else-if="loginType === 'pan123'">
          <p>
            你可以前往
            <a href="https://www.123pan.com/developer" target="_blank">开放平台</a>
            申请Client ID和Client Secret，请谨慎保管！
          </p>
          <n-input v-model:value="pan123Data.clientId" placeholder="请输入Client ID" />
          <n-input
            v-model:value="pan123Data.clientSecret"
            placeholder="请输入Client Secret"
            type="password"
            style="margin-top: 20px"
          />
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
    <n-modal v-model:show="syncConfigModalVisible" :mask-closable="false" auto-focus>
      <n-card
        style="width: 600px; max-height: 80%"
        :bordered="false"
        size="huge"
        role="dialog"
        aria-modal="true"
        class="card"
      >
        <template #header>
          <n-text>{{ editingConfigIndex === null ? "添加" : "编辑" }}同步配置</n-text>
        </template>
        <n-form label-placement="left" :label-width="100">
          <n-form-item label="配置名称">
            <n-input v-model:value="editingConfig.name" placeholder="请输入配置名称" />
          </n-form-item>
          <n-form-item label="同步源">
            <n-select
              v-model:value="editingConfig.syncSource"
              :options="[
                { label: '百度网盘', value: 'baiduPCS' },
                { label: '阿里云盘', value: 'aliyunpan' },
                { label: 'alist', value: 'alist' },
                { label: '123网盘', value: 'pan123' },
                { label: '本地复制', value: 'copy' },
              ]"
            />
          </n-form-item>
          <n-form-item>
            <template #label>
              <Tip
                text="目录结构"
                tip="如果是本地复制，请带上文件夹路径<br/>支持以下占位符：<br/>平台：{{platform}}<br/>主播名：{{user}}<br/>日期：{{now}}<br/>年：{{yyyy}}<br/>月：{{MM}}<br/>日：{{dd}}"
              >
              </Tip>
            </template>
            <n-input v-model:value="editingConfig.folderStructure" placeholder="请输入目录结构" />
          </n-form-item>
          <n-form-item label="同步文件类型">
            <n-checkbox-group v-model:value="editingConfig.targetFiles">
              <n-space vertical>
                <n-checkbox value="source">源文件</n-checkbox>
                <n-checkbox value="danmaku">弹幕压制后的文件</n-checkbox>
                <n-checkbox value="xml">XML文件</n-checkbox>
                <n-checkbox value="cover">封面图片</n-checkbox>
              </n-space>
            </n-checkbox-group>
          </n-form-item>
        </n-form>
        <template #footer>
          <div class="footer">
            <n-button class="btn" @click="syncConfigModalVisible = false">取消</n-button>
            <n-button type="primary" class="btn" @click="saveSyncConfig">保存</n-button>
          </div>
        </template>
      </n-card>
    </n-modal>
    <n-modal v-model:show="uploadPathModalVisible" :mask-closable="false" auto-focus>
      <n-card
        style="width: 600px"
        :bordered="false"
        size="huge"
        role="dialog"
        aria-modal="true"
        class="card"
      >
        <template #header>
          <n-text
            >输入上传路径
            <span v-if="currentUploadType === 'alist'">(alist需要带上挂载路径)</span>
          </n-text>
        </template>
        <n-input v-model:value="uploadPath" placeholder="请输入上传路径，例如：/test" />
        <template #footer>
          <div class="footer">
            <n-button class="btn" @click="uploadPathModalVisible = false">取消</n-button>
            <n-button type="primary" class="btn" @click="confirmUploadCheck">确认</n-button>
          </div>
        </template>
      </n-card>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { FolderOpenOutline, Add } from "@vicons/ionicons5";
import { showFileDialog } from "@renderer/utils/fileSystem";
import { uuid, sha256 } from "@renderer/utils";

import { syncApi } from "@renderer/apis";
import { useConfirm } from "@renderer/hooks";

import type { AppConfig, SyncType, SyncConfig } from "@biliLive-tools/types";

const config = defineModel<AppConfig>("data", {
  default: () => ({
    sync: {
      baiduPCS: { execPath: "", targetPath: "" },
      aliyunpan: { execPath: "", targetPath: "" },
      syncConfigs: [],
    },
  }),
});

const isWeb = computed(() => window.isWeb);

const selectFolder = async (type: SyncType) => {
  if (["aliyunpan", "baiduPCS"].includes(type)) {
    let file = await showFileDialog({
      extensions: ["*"],
    });
    if (!file || file.length === 0) return;
    config.value.sync[type as "baiduPCS" | "aliyunpan"].execPath = file[0];
  } else {
    throw new Error("选择类型错误");
  }
};

const notice = useNotice();
const loginVisible = ref(false);
const cookies = ref("");
const alistData = ref({
  username: "",
  password: "",
});
const pan123Data = ref({
  clientId: "",
  clientSecret: "",
});
const loginType = ref<SyncType>("baiduPCS");
const login = async (type: SyncType) => {
  if (["aliyunpan", "baiduPCS"].includes(type)) {
    if (!config.value.sync[type as "baiduPCS" | "aliyunpan"].execPath) {
      notice.error("请先选择可执行文件");
      return;
    }
  }
  cookies.value = "";
  loginType.value = type;
  if (type === "aliyunpan") {
    notice.info("请求中，请稍等~");
    const content = await syncApi.aliyunpanLogin({
      execPath: config.value.sync.aliyunpan.execPath,
      type: "getUrl",
    });
    cookies.value = content;
  } else if (type === "alist") {
    alistData.value = {
      username: config.value.sync.alist.username,
      password: "",
    };
  } else if (type === "pan123") {
    pan123Data.value = {
      clientId: config.value.sync.pan123.clientId,
      clientSecret: "",
    };
  }
  loginVisible.value = true;
};

const sha256ForAlist = (password: string) => {
  return sha256(`${password}-https://github.com/alist-org/alist`);
};

const loginConfirm = async () => {
  if (loginType.value === "baiduPCS") {
    if (!cookies.value) {
      notice.error("请先输入cookie");
      return;
    }
    await syncApi.baiduPCSLogin({
      cookie: cookies.value,
      execPath: config.value.sync.baiduPCS.execPath,
    });
  } else if (loginType.value === "aliyunpan") {
    await syncApi.aliyunpanLogin({
      execPath: config.value.sync.aliyunpan.execPath,
      type: "confirm",
    });
  } else if (loginType.value === "alist") {
    await syncApi.syncTestLogin({
      apiUrl: config.value.sync.alist.apiUrl,
      username: alistData.value.username,
      password: sha256ForAlist(alistData.value.password),
      type: "alist",
    });
    config.value.sync.alist.hashPassword = sha256ForAlist(alistData.value.password);
    config.value.sync.alist.username = alistData.value.username;
  } else if (loginType.value === "pan123") {
    await syncApi.pan123Login({
      clientId: pan123Data.value.clientId,
      clientSecret: pan123Data.value.clientSecret,
    });
    config.value.sync.pan123.clientId = pan123Data.value.clientId;
    config.value.sync.pan123.clientSecret = pan123Data.value.clientSecret;
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
  let status = false;
  if (["aliyunpan", "baiduPCS"].includes(type)) {
    if (!config.value.sync[type as "baiduPCS" | "aliyunpan"].execPath) {
      notice.error("请先选择可执行文件");
      return;
    }
    status = await syncApi.syncTestLogin({
      execPath: config.value.sync[type as "baiduPCS" | "aliyunpan"].execPath,
      type: type as "baiduPCS" | "aliyunpan",
    });
  } else if (type === "alist") {
    status = await syncApi.syncTestLogin({
      apiUrl: config.value.sync.alist.apiUrl,
      username: config.value.sync.alist.username,
      password: config.value.sync.alist.hashPassword,
      type: "alist",
    });
  } else if (type === "pan123") {
    status = await syncApi.syncTestLogin({
      clientId: config.value.sync.pan123.clientId,
      clientSecret: config.value.sync.pan123.clientSecret,
      type: "pan123",
    });
  } else {
    throw new Error("登录类型错误");
  }

  if (status) {
    notice.success("已存在登录信息");
  } else {
    notice.error("未检测到登录信息，请先登录");
  }
};

const uploadPathModalVisible = ref(false);
const uploadPath = ref("/");
const currentUploadType = ref<SyncType>("baiduPCS");

const uploadCheck = async (type: SyncType) => {
  if (type === "alist") {
    if (!config.value.sync.alist.apiUrl) {
      notice.error("请先输入api地址");
      return;
    }
    if (!config.value.sync.alist.username || !config.value.sync.alist.hashPassword) {
      notice.error("请先登录");
      return;
    }
  } else if (["aliyunpan", "baiduPCS"].includes(type)) {
    if (!config.value.sync[type as "baiduPCS" | "aliyunpan"].execPath) {
      notice.error("请先选择可执行文件");
      return;
    }
  } else if (type === "pan123") {
    if (!config.value.sync.pan123.clientId || !config.value.sync.pan123.clientSecret) {
      notice.error("请先输入clientId和clientSecret");
      return;
    }
  } else {
    throw new Error("上传类型错误");
  }

  currentUploadType.value = type;
  uploadPath.value = "/";
  uploadPathModalVisible.value = true;
};

const confirmUploadCheck = async () => {
  const type = currentUploadType.value;

  notice.info("上传中，请稍等~");
  if (["aliyunpan", "baiduPCS"].includes(type)) {
    await syncApi.syncTestUpload({
      execPath: config.value.sync[type as "baiduPCS" | "aliyunpan"].execPath,
      remoteFolder: uploadPath.value,
      type,
    });
  } else if (type === "alist") {
    await syncApi.syncTestUpload({
      apiUrl: config.value.sync.alist.apiUrl,
      username: config.value.sync.alist.username,
      password: config.value.sync.alist.hashPassword,
      remoteFolder: uploadPath.value,
      type,
    });
  } else if (type === "pan123") {
    await syncApi.syncTestUpload({
      clientId: config.value.sync.pan123.clientId,
      clientSecret: config.value.sync.pan123.clientSecret,
      remoteFolder: uploadPath.value,
      type,
    });
  } else {
    throw new Error("上传类型错误");
  }
  notice.success("上传测试成功，请前往目标目录进行查看");
  uploadPathModalVisible.value = false;
};

const baiduPCSClientClogin = async () => {
  notice.info("登录完成后请关闭窗口");
  const cookie = await window.api.cookie.baiduLogin();
  cookies.value = cookie;
};

// 同步配置相关
const editingConfigIndex = ref<number | null>(null);
const editingConfig = ref<SyncConfig>({
  id: uuid(),
  name: "",
  syncSource: "baiduPCS",
  folderStructure: "/录播/{{user}}/{{yyyy}}-{{MM}}",
  targetFiles: [],
});

const syncConfigModalVisible = ref(false);

const getSyncSourceLabel = (value: string) => {
  const options = {
    baiduPCS: "百度网盘",
    aliyunpan: "阿里云盘",
    alist: "alist",
  };
  return options[value] || value;
};

const getTargetFilesLabel = (values: string[]) => {
  const options = {
    source: "源文件",
    danmaku: "弹幕压制文件",
    xml: "XML文件",
    cover: "封面图片",
  };
  return values.map((v) => options[v] || v).join("、");
};

const addSyncConfig = () => {
  editingConfigIndex.value = null;
  editingConfig.value = {
    id: uuid(),
    name: "",
    syncSource: "baiduPCS",
    folderStructure: "/录播/{{user}}/{{yyyy}}-{{MM}}",
    targetFiles: [],
  };
  syncConfigModalVisible.value = true;
};

const editSyncConfig = (index: number) => {
  editingConfigIndex.value = index;
  const originalConfig = config.value.sync.syncConfigs[index];
  editingConfig.value = {
    id: originalConfig.id,
    name: originalConfig.name,
    syncSource: originalConfig.syncSource,
    folderStructure: originalConfig.folderStructure,
    targetFiles: [...originalConfig.targetFiles],
  };
  syncConfigModalVisible.value = true;
};

const confirm = useConfirm();

const deleteSyncConfig = async (index: number) => {
  const configToDelete = config.value.sync.syncConfigs[index];

  // 检查该同步配置是否正在被使用
  const isInUse =
    // 检查全局配置
    config.value.webhook?.syncId === configToDelete.id ||
    // 检查房间配置
    Object.values(config.value.webhook?.rooms || {}).some(
      (room) => room.syncId === configToDelete.id,
    );

  if (isInUse) {
    notice.error("该同步配置正在被使用，无法删除。请先修改或删除使用此配置的房间设置。");
    return;
  }

  const status = await confirm.warning({
    content: `确定要删除同步配置？`,
  });
  if (!status) return;

  config.value.sync.syncConfigs.splice(index, 1);
  notice.success("同步配置已删除");
};

const saveSyncConfig = () => {
  if (!editingConfig.value.name) {
    notice.error("配置名称不能为空");
    return;
  }
  // 必须要选择至少一个需要同步的文件类型
  if (editingConfig.value.targetFiles.length === 0) {
    notice.error("至少选择一个文件类型");
    return;
  }
  if (editingConfigIndex.value === null) {
    config.value.sync.syncConfigs.push({ ...editingConfig.value });
  } else {
    config.value.sync.syncConfigs[editingConfigIndex.value] = { ...editingConfig.value };
  }
  syncConfigModalVisible.value = false;
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

.sync-config-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  padding: 16px;
}

.sync-config-card {
  height: 100%;
  min-height: 120px;
  .add-card {
    cursor: pointer;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    &:hover {
      background-color: var(--n-color-hover);
    }
  }
}
</style>
