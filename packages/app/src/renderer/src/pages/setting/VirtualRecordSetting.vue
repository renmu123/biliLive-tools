<template>
  <div class="">
    <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 20px">
      <h2 style="display: inline-flex; align-items: center">
        虚拟录制配置
        <Tip
          :size="22"
          tip="采用监听文件夹的形式支持那些不支持webhook的录制软件<br/>当监听文件夹中出现新文件时，会自动触发录制完成的处理流程"
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
            <n-text strong>房间号: {{ virtualConfig.roomId }}</n-text>
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
          <div class="info-item">
            <n-text depth="3">虚拟房间号:</n-text>
            <n-text>{{ virtualConfig.roomId }}</n-text>
          </div>
          <div class="info-item">
            <n-text depth="3">监听文件夹:</n-text>
            <n-text>{{ virtualConfig.watchFolder || "未设置" }}</n-text>
          </div>
          <div v-if="!virtualConfig.watchFolder" class="warning-item">
            <n-text type="warning">⚠️ 请设置监听文件夹路径</n-text>
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
        style="width: 600px; max-height: 80%"
        :bordered="false"
        size="huge"
        role="dialog"
        aria-modal="true"
        class="modal-card"
      >
        <template #header>
          <n-text>{{ editingIndex === null ? "添加" : "编辑" }}</n-text>
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
          <n-form-item label="虚拟房间号" path="roomId">
            <n-input
              v-model:value="editingConfig.roomId"
              placeholder="请输入虚拟房间号，用于区分不同的录制配置"
              clearable
            />
          </n-form-item>
          <n-form-item label="监听文件夹" path="watchFolder">
            <n-input v-model:value="editingConfig.watchFolder" placeholder="请选择要保存的文件夹" />
            <n-icon style="margin-left: 10px" size="26" class="pointer" @click="selectWatchFolder">
              <FolderOpenOutline />
            </n-icon>
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
    },
  }),
});

const notice = useNotice();
const confirm = useConfirm();

// 模态框相关
const modalVisible = ref(false);
const editingIndex = ref<number | null>(null);
const editingConfig = ref({
  id: "",
  switch: true,
  roomId: "",
  watchFolder: "",
});

// 表单引用和验证规则
const formRef = ref();
const formRules = {
  roomId: {
    required: true,
    message: "请输入虚拟房间号",
    trigger: ["input", "blur"],
  },
  watchFolder: {
    required: true,
    message: "请选择监听文件夹",
    trigger: ["input", "blur"],
  },
};

// 添加虚拟录制配置
const addVirtualRecord = () => {
  editingIndex.value = null;
  editingConfig.value = {
    id: uuid(),
    switch: true,
    roomId: "",
    watchFolder: "",
  };
  modalVisible.value = true;
};

// 编辑虚拟录制配置
const editVirtualRecord = (index: number) => {
  editingIndex.value = index;
  const originalConfig = config.value.virtualRecord.config[index];
  editingConfig.value = {
    id: originalConfig.id,
    switch: originalConfig.switch,
    roomId: originalConfig.roomId,
    watchFolder: originalConfig.watchFolder,
  };
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
    defaultPath: editingConfig.value.watchFolder,
  });

  if (!file) return;
  editingConfig.value.watchFolder = file;
};

// 保存虚拟录制配置
const saveVirtualRecord = async () => {
  try {
    await formRef.value?.validate();

    // 检查房间号是否重复（编辑时排除自己）
    const existingIndex = config.value.virtualRecord.config.findIndex(
      (item, index) => item.roomId === editingConfig.value.roomId && index !== editingIndex.value,
    );

    if (existingIndex !== -1) {
      notice.error("虚拟房间号已存在，请使用不同的房间号");
      return;
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
  align-items: center;
  gap: 8px;

  .n-text:first-child {
    min-width: 80px;
  }
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

.item {
  display: flex;
}
</style>
