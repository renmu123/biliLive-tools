<template>
  <div class="workflow-container">
    <n-card title="工作流管理">
      <template #header-extra>
        <n-button type="primary" @click="handleCreate">
          <template #icon>
            <n-icon><AddOutline /></n-icon>
          </template>
          新建工作流
        </n-button>
      </template>

      <n-data-table
        :columns="columns"
        :data="workflowStore.workflows"
        :loading="loading"
        :pagination="false"
      />
    </n-card>

    <!-- 创建对话框 -->
    <n-modal v-model:show="showCreateModal" preset="dialog" title="创建工作流">
      <n-form ref="formRef" :model="formData" :rules="rules">
        <n-form-item label="名称" path="name">
          <n-input v-model:value="formData.name" placeholder="请输入工作流名称" />
        </n-form-item>
        <n-form-item label="描述" path="description">
          <n-input
            v-model:value="formData.description"
            type="textarea"
            placeholder="请输入工作流描述（可选）"
          />
        </n-form-item>
      </n-form>

      <template #action>
        <n-space>
          <n-button @click="showCreateModal = false">取消</n-button>
          <n-button type="primary" @click="handleConfirmCreate">确定</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, h, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  NCard,
  NButton,
  NDataTable,
  NIcon,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NSpace,
  NTag,
  useMessage,
  useDialog,
} from "naive-ui";
import { AddOutline, Create, Trash, PlayCircleOutline } from "@vicons/ionicons5";
import { useWorkflowStore } from "@renderer/stores/workflow";
import type { DataTableColumns } from "naive-ui";
import type { Workflow } from "@biliLive-tools/shared/workflow";

const router = useRouter();
const message = useNotice();
const dialog = useDialog();
const workflowStore = useWorkflowStore();

const loading = ref(false);
const showCreateModal = ref(false);
const formRef = ref();
const formData = ref({
  name: "",
  description: "",
});

const rules = {
  name: {
    required: true,
    message: "请输入工作流名称",
    trigger: "blur",
  },
};

const columns: DataTableColumns<Workflow> = [
  {
    title: "名称",
    key: "name",
  },
  {
    title: "描述",
    key: "description",
  },
  {
    title: "状态",
    key: "is_active",
    render: (row) =>
      h(
        NTag,
        {
          type: row.is_active ? "success" : "default",
        },
        { default: () => (row.is_active ? "启用" : "禁用") },
      ),
  },
  {
    title: "创建时间",
    key: "created_at",
    render: (row) => new Date(row.created_at).toLocaleString(),
  },
  {
    title: "操作",
    key: "actions",
    render: (row) =>
      h(
        NSpace,
        {},
        {
          default: () => [
            h(
              NButton,
              {
                size: "small",
                onClick: () => handleEdit(row.id),
              },
              { default: () => "编辑", icon: () => h(NIcon, null, { default: () => h(Create) }) },
            ),
            h(
              NButton,
              {
                size: "small",
                type: "primary",
                onClick: () => handleExecute(row.id),
              },
              {
                default: () => "运行",
                icon: () => h(NIcon, null, { default: () => h(PlayCircleOutline) }),
              },
            ),
            h(
              NButton,
              {
                size: "small",
                type: "error",
                onClick: () => handleDelete(row.id),
              },
              { default: () => "删除", icon: () => h(NIcon, null, { default: () => h(Trash) }) },
            ),
          ],
        },
      ),
  },
];

const handleCreate = () => {
  formData.value = {
    name: "",
    description: "",
  };
  showCreateModal.value = true;
};

const handleConfirmCreate = async () => {
  try {
    await formRef.value?.validate();
    const id = await workflowStore.createWorkflow({
      name: formData.value.name,
      description: formData.value.description,
      definition: {
        nodes: [],
        edges: [],
        variables: {},
      },
    });
    message.success("创建成功");
    showCreateModal.value = false;
    // 跳转到编辑页面
    router.push(`/workflow/editor/${id}`);
  } catch (error) {
    console.error(error);
  }
};

const handleEdit = (id: string) => {
  router.push(`/workflow/editor/${id}`);
};

const handleExecute = async (id: string) => {
  try {
    await workflowStore.executeWorkflow(id);
    message.success("工作流开始执行");
  } catch (error: any) {
    message.error(`执行失败: ${error.message}`);
  }
};

const handleDelete = (id: string) => {
  dialog.warning({
    title: "确认删除",
    content: "确定要删除这个工作流吗？此操作不可恢复。",
    positiveText: "删除",
    negativeText: "取消",
    onPositiveClick: async () => {
      try {
        await workflowStore.deleteWorkflow(id);
        message.success("删除成功");
      } catch (error: any) {
        message.error(`删除失败: ${error.message}`);
      }
    },
  });
};

onMounted(async () => {
  loading.value = true;
  try {
    await workflowStore.loadWorkflows();
    await workflowStore.loadNodeMetadata();
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.workflow-container {
  padding: 20px;
}
</style>
