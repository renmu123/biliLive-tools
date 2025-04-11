<template>
  <div class="">
    <div style="display: flex; gap: 10px; align-items: center">
      <h2>文件同步配置</h2>
      <p>使用前请务必了解相关同步库并<bold>仔细查看文档</bold></p>
    </div>

    <n-form label-placement="left" :label-width="145">
      <n-tabs type="segment" style="margin-top: 10px" class="tabs">
        <n-tab-pane
          class="tab-pane"
          name="syncConfig"
          tab="Webhook 同步配置"
          display-directive="show:lazy"
        >
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
                <n-space>
                  <n-button type="primary" @click="editSyncConfig(index)">编辑</n-button>
                  <n-button type="error" @click="deleteSyncConfig(index)">删除</n-button>
                </n-space>
              </template>
              <n-space vertical>
                <n-text>同步源: {{ getSyncSourceLabel(config.syncSource) }}</n-text>
                <n-text>目录结构: {{ config.folderStructure }}</n-text>
                <n-text>处理文件: {{ getTargetFilesLabel(config.targetFiles) }}</n-text>
              </n-space>
            </n-card>
            <n-card class="sync-config-card" @click="addSyncConfig">
              <div class="add-card">
                <n-icon size="48">
                  <Add />
                </n-icon>
                <n-text>添加同步配置</n-text>
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
              ]"
            />
          </n-form-item>
          <n-form-item>
            <template #label>
              <Tip
                text="目录结构"
                tip="支持以下占位符：{{platform}}、{{owner}}、{{year}}、{{month}}、{{date}}、{{hour}}、{{min}}、{{sec}}、{{title}}"
              >
              </Tip>
            </template>
            <n-input v-model:value="editingConfig.folderStructure" placeholder="请输入目录结构" />
          </n-form-item>
          <n-form-item label="处理文件">
            <n-checkbox-group v-model:value="editingConfig.targetFiles">
              <n-space vertical>
                <n-checkbox value="source">源文件</n-checkbox>
                <n-checkbox value="danmaku">弹幕压制后的文件</n-checkbox>
                <n-checkbox value="remux">转封装后的文件</n-checkbox>
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
  </div>
</template>

<script setup lang="ts">
import { FolderOpenOutline, Add } from "@vicons/ionicons5";
import { showFileDialog } from "@renderer/utils/fileSystem";
import { uuid } from "@renderer/utils";

import { syncApi } from "@renderer/apis";
// import { useConfirm } from "@renderer/hooks";

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

// 同步配置相关
const editingConfigIndex = ref<number | null>(null);
const editingConfig = ref<SyncConfig>({
  id: uuid(),
  name: "",
  syncSource: "baiduPCS",
  folderStructure: "{{platform}}/{{owner}}/{{year}}-{{month}}-{{date}}",
  targetFiles: [],
});

const syncConfigModalVisible = ref(false);

const getSyncSourceLabel = (value: string) => {
  const options = {
    baiduPCS: "百度网盘",
    aliyunpan: "阿里云盘",
  };
  return options[value] || value;
};

const getTargetFilesLabel = (values: string[]) => {
  const options = {
    source: "源文件",
    danmaku: "弹幕压制文件",
    remux: "转封装文件",
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
    folderStructure: "{{platform}}/{{owner}}/{{year}}-{{month}}-{{date}}",
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

const deleteSyncConfig = (index: number) => {
  config.value.sync.syncConfigs.splice(index, 1);
};

const saveSyncConfig = () => {
  if (!editingConfig.value.name) {
    notice.error("配置名称不能为空");
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
  .add-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    &:hover {
      background-color: var(--n-color-hover);
    }
  }
}
</style>
