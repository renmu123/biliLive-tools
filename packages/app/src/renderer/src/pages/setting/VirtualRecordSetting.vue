<template>
  <div class="">
    <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 20px">
      <h2 style="display: inline-flex; align-items: center">
        虚拟录制配置
        <Tip
          :size="22"
          tip="采用监听文件夹的形式支持那些不支持webhook的录制软件<br/>当监听文件夹中出现新文件时，会自动触发录制完成的处理流程<br/>支持普通模式和高级模式，高级模式支持正则匹配房间号和标题"
        >
        </Tip>
      </h2>
      <p>配置虚拟直播间，监听指定文件夹中的新文件</p>
    </div>

    <div class="virtual-record-list">
      <n-card
        v-for="(virtualConfig, index) in config.virtualRecord.config"
        :key="virtualConfig.id || `${virtualConfig.roomId}-${index}`"
        class="virtual-record-card"
      >
        <template #header>
          <div class="card-header">
            <n-text strong>
              {{ virtualConfig.mode === "normal" ? "普通模式" : "高级模式" }}
              - {{ virtualConfig.mode === "normal" ? virtualConfig.roomId : "动态匹配" }}
            </n-text>
            <n-tag v-if="virtualConfig.switch" type="info" size="small"> 监听中 </n-tag>
            <n-tag v-else type="warning" size="small"> 已禁用 </n-tag>
          </div>
        </template>
        <template #header-extra>
          <n-space align="center">
            <n-button type="primary" size="small" @click="editVirtualRecord(index)">
              编辑
            </n-button>
            <n-button type="error" text size="small" @click="deleteVirtualRecord(index)">
              删除
            </n-button>
          </n-space>
        </template>
        <n-space vertical>
          <div v-if="virtualConfig.mode === 'normal'" class="info-item">
            <n-text depth="3">虚拟房间号:</n-text>
            <n-text>{{ virtualConfig.roomId }}</n-text>
          </div>
          <div v-if="virtualConfig.mode === 'advance'" class="info-item">
            <n-text depth="3">房间号正则:</n-text>
            <n-text>{{ virtualConfig.roomIdRegex || "未设置" }}</n-text>
          </div>
          <div class="info-item">
            <n-text depth="3">标题正则:</n-text>
            <n-text>{{ virtualConfig.titleRegex || "未设置" }}</n-text>
          </div>
          <div class="info-item">
            <n-text depth="3">主播名称:</n-text>
            <n-text>{{ virtualConfig.username || "未设置" }}</n-text>
          </div>
          <div v-if="virtualConfig.mode === 'advance'" class="info-item">
            <n-text depth="3">主播名称正则:</n-text>
            <n-text>{{ virtualConfig.usernameRegex || "未设置" }}</n-text>
          </div>
          <div class="info-item">
            <n-text depth="3">监听文件夹:</n-text>
            <div class="folder-list">
              <n-tag
                v-for="folder in virtualConfig.watchFolder"
                :key="folder"
                size="small"
                type="info"
                style="margin: 2px"
              >
                {{ folder }}
              </n-tag>
              <n-text v-if="virtualConfig.watchFolder.length === 0" type="warning">
                未设置监听文件夹
              </n-text>
            </div>
          </div>
          <div v-if="virtualConfig.watchFolder.length === 0" class="warning-item">
            <n-text type="warning">⚠️ 请设置至少一个监听文件夹路径</n-text>
          </div>
        </n-space>
      </n-card>

      <n-card class="virtual-record-card add-card-container" @click="addVirtualRecord">
        <div class="add-card">
          <n-icon size="48" color="var(--n-text-color-disabled)">
            <Add />
          </n-icon>
          <!-- <n-text depth="3">添加虚拟录制配置</n-text> -->
        </div>
      </n-card>
    </div>

    <!-- 编辑/添加虚拟录制配置的模态框 -->
    <n-modal v-model:show="modalVisible" :mask-closable="false" auto-focus>
      <n-card
        style="width: 700px; max-height: 80%"
        :bordered="false"
        size="huge"
        role="dialog"
        aria-modal="true"
        class="modal-card"
      >
        <template #header>
          <n-text>{{ editingIndex === null ? "添加" : "编辑" }}虚拟录制配置</n-text>
        </template>
        <n-form
          label-placement="left"
          :label-width="120"
          :model="editingConfig"
          ref="formRef"
          :rules="formRules"
        >
          <n-form-item label="监听状态">
            <n-switch v-model:value="editingConfig.switch"> </n-switch>
          </n-form-item>

          <n-form-item label="模式">
            <n-radio-group v-model:value="editingConfig.mode">
              <n-radio value="normal">
                <div style="display: flex; flex-direction: column; gap: 4px">
                  <span>普通模式</span>
                  <n-text depth="3" style="font-size: 12px">
                    固定房间号和标题，支持单个文件夹监听
                  </n-text>
                </div>
              </n-radio>
              <n-radio value="advance">
                <div style="display: flex; flex-direction: column; gap: 4px">
                  <span>高级模式</span>
                  <n-text depth="3" style="font-size: 12px">
                    使用正则匹配房间号和标题，支持多文件夹监听
                  </n-text>
                </div>
              </n-radio>
            </n-radio-group>
          </n-form-item>

          <!-- 普通模式配置 -->
          <template v-if="editingConfig.mode === 'normal'">
            <n-form-item label="虚拟房间号" path="roomId">
              <n-input
                v-model:value="editingConfig.roomId"
                placeholder="请输入虚拟房间号，用于区分不同的录制配置"
                clearable
              />
            </n-form-item>
            <n-form-item label="主播名称">
              <n-input
                v-model:value="editingConfig.username"
                placeholder="可选，设置固定主播名称"
                clearable
              />
            </n-form-item>
            <n-form-item label="标题正则">
              <n-input
                v-model:value="editingConfig.titleRegex"
                placeholder="可选，用于从文件名中提取标题的正则表达式"
                clearable
              />
              <template #suffix>
                <Tip tip="可选的正则表达式，用于从文件名中提取标题信息" />
              </template>
            </n-form-item>
          </template>

          <!-- 高级模式配置 -->
          <template v-if="editingConfig.mode === 'advance'">
            <n-form-item label="房间号正则" path="roomIdRegex">
              <template #suffix>
                <Tip tip="正则表达式用于从文件名中提取房间号，如果匹配失败将跳过处理" />
              </template>
              <n-input
                v-model:value="editingConfig.roomIdRegex"
                placeholder="用于从文件名中提取房间号的正则表达式"
                clearable
              />
            </n-form-item>

            <n-form-item label="标题正则">
              <n-input
                v-model:value="editingConfig.titleRegex"
                placeholder="可选，用于从文件名中提取标题的正则表达式"
                clearable
              />
              <template #suffix>
                <Tip tip="可选的正则表达式，用于从文件名中提取标题信息" />
              </template>
            </n-form-item>

            <n-form-item label="主播名称正则">
              <n-input
                v-model:value="editingConfig.usernameRegex"
                placeholder="可选，用于从文件名中提取主播名称的正则表达式"
                clearable
              />
              <template #suffix>
                <Tip tip="可选的正则表达式，用于从文件名中提取主播名称信息" />
              </template>
            </n-form-item>
          </template>

          <n-form-item label="监听文件夹" path="watchFolder">
            <div style="width: 100%">
              <div class="folder-input-container">
                <n-tag
                  v-for="(folder, folderIndex) in editingConfig.watchFolder"
                  :key="folderIndex"
                  closable
                  type="info"
                  style="margin: 2px"
                  @close="removeFolderPath(folderIndex)"
                >
                  {{ folder }}
                </n-tag>
              </div>
              <div style="display: flex; gap: 8px; margin-top: 8px">
                <n-input
                  v-model:value="newFolderPath"
                  placeholder="选择要监听的文件夹"
                  style="flex: 1"
                />
                <n-button @click="selectWatchFolder">
                  <template #icon>
                    <n-icon>
                      <FolderOpenOutline />
                    </n-icon>
                  </template>
                  选择文件夹
                </n-button>
                <n-button @click="addFolderPath" :disabled="!newFolderPath.trim()" type="primary">
                  添加
                </n-button>
              </div>
            </div>
          </n-form-item>
        </n-form>
        <template #footer>
          <div class="modal-footer">
            <n-button @click="modalVisible = false">取消</n-button>
            <n-button type="primary" @click="saveVirtualRecord">保存</n-button>
          </div>
        </template>
      </n-card>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { Add, FolderOpenOutline } from "@vicons/ionicons5";
import { showDirectoryDialog } from "@renderer/utils/fileSystem";
import { useConfirm } from "@renderer/hooks";
import { uuid } from "@renderer/utils";
import Tip from "@renderer/components/Tip.vue";
import type { AppConfig } from "@biliLive-tools/types";

const config = defineModel<AppConfig>("data", {
  default: () => ({
    virtualRecord: {
      config: [],
      startTime: Date.now(),
    },
  }),
});

const notice = useNotice();
const confirm = useConfirm();

// 模态框相关
const modalVisible = ref(false);
const editingIndex = ref<number | null>(null);
const editingConfig = ref({
  mode: "normal" as "normal" | "advance",
  id: "",
  switch: true,
  roomId: "",
  titleRegex: "",
  roomIdRegex: "",
  username: "",
  usernameRegex: "",
  watchFolder: [] as string[],
});

// 新文件夹路径输入
const newFolderPath = ref("");

// 表单引用和验证规则
const formRef = ref();
const formRules = computed(() => {
  const baseRules = {
    watchFolder: {
      validator: () => {
        return editingConfig.value.watchFolder.length > 0;
      },
      message: "请至少添加一个监听文件夹",
      trigger: ["blur"],
    },
  };

  if (editingConfig.value.mode === "normal") {
    return {
      ...baseRules,
      roomId: {
        required: true,
        message: "请输入虚拟房间号",
        trigger: ["input", "blur"],
      },
    };
  } else {
    return {
      ...baseRules,
      roomIdRegex: {
        required: true,
        message: "请输入房间号正则表达式",
        trigger: ["input", "blur"],
      },
    };
  }
});

// 添加虚拟录制配置
const addVirtualRecord = () => {
  editingIndex.value = null;
  editingConfig.value = {
    mode: "normal",
    id: uuid(),
    switch: true,
    roomId: "",
    titleRegex: "",
    roomIdRegex: "",
    username: "",
    usernameRegex: "",
    watchFolder: [],
  };
  newFolderPath.value = "";
  modalVisible.value = true;
};

// 编辑虚拟录制配置
const editVirtualRecord = (index: number) => {
  editingIndex.value = index;
  const originalConfig = config.value.virtualRecord.config[index];
  editingConfig.value = {
    mode: originalConfig.mode || "normal",
    id: originalConfig.id,
    switch: originalConfig.switch,
    roomId: originalConfig.roomId || "",
    titleRegex: originalConfig.titleRegex || "",
    roomIdRegex: originalConfig.roomIdRegex || "",
    username: originalConfig.username || "",
    usernameRegex: originalConfig.usernameRegex || "",
    watchFolder: [...(originalConfig.watchFolder || [])],
  };
  newFolderPath.value = "";
  modalVisible.value = true;
};

// 删除虚拟录制配置
const deleteVirtualRecord = async (index: number) => {
  const status = await confirm.warning({
    content: `确定要删除？`,
  });

  if (!status) return;

  config.value.virtualRecord.config.splice(index, 1);
};

// 选择监听文件夹
const selectWatchFolder = async () => {
  let file: string | undefined = await showDirectoryDialog({
    defaultPath: newFolderPath.value,
  });

  if (!file) return;
  newFolderPath.value = file;
};

// 添加文件夹路径
const addFolderPath = () => {
  const path = newFolderPath.value.trim();
  if (!path) return;

  // 检查是否已存在
  if (editingConfig.value.watchFolder.includes(path)) {
    notice.warning("该文件夹已存在");
    return;
  }
  // 如果是普通模式最多添加一个
  if (editingConfig.value.mode === "normal" && editingConfig.value.watchFolder.length >= 1) {
    notice.warning("普通模式下只能添加一个监听文件夹");
    return;
  }

  editingConfig.value.watchFolder.push(path);
  newFolderPath.value = "";
};

// 移除文件夹路径
const removeFolderPath = (index: number) => {
  editingConfig.value.watchFolder.splice(index, 1);
};

// 保存虚拟录制配置
const saveVirtualRecord = async () => {
  try {
    await formRef.value?.validate();

    // 检查房间号是否重复（仅普通模式，编辑时排除自己）
    if (editingConfig.value.mode === "normal") {
      const existingIndex = config.value.virtualRecord.config.findIndex(
        (item, index) =>
          item.mode === "normal" &&
          item.roomId === editingConfig.value.roomId &&
          index !== editingIndex.value,
      );

      if (existingIndex !== -1) {
        notice.error("虚拟房间号已存在，请使用不同的房间号");
        return;
      }
    }

    if (editingIndex.value === null) {
      // 添加新配置
      config.value.virtualRecord.config.push({ ...editingConfig.value });
    } else {
      // 更新现有配置，保持原有的 id
      const originalId = config.value.virtualRecord.config[editingIndex.value].id;
      config.value.virtualRecord.config[editingIndex.value] = {
        ...editingConfig.value,
        id: originalId, // 保持原有ID不变
      };
    }

    modalVisible.value = false;
  } catch (error) {
    // 表单验证失败，不做任何操作
  }
};
</script>

<style scoped lang="less">
.virtual-record-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 16px;
  padding: 16px;
}

.virtual-record-card {
  height: 100%;
  min-height: 120px;
  max-height: 300px;
  overflow-y: auto;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.add-card-container {
  cursor: pointer;
  // border: 2px dashed var(--n-border-color);

  &:hover {
    // border-color: var(--n-color-primary);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.add-card {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  transition: color 0.3s ease;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;

  .n-text:first-child {
    min-width: 80px;
    flex-shrink: 0;
  }
}

.folder-list {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.warning-item {
  margin-top: 8px;
  padding: 8px;
  background-color: var(--n-warning-color-suppl);
  border-radius: 4px;
}

.modal-card {
  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
}

.folder-input-container {
  min-height: 32px;
  border: 1px solid var(--n-border-color);
  border-radius: 3px;
  padding: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;

  &:empty::before {
    content: "暂无监听文件夹";
    color: var(--n-text-color-disabled);
    font-size: 14px;
  }
}

.item {
  display: flex;
}
</style>
