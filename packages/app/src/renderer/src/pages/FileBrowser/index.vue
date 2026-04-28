<template>
  <div class="file-browser-page">
    <n-space vertical :size="16">
      <!-- <n-alert type="info" :show-icon="false">
        当前仅浏览录制目录内的文件。未设置环境变量 BILILIVE_TOOLS_DELETE_DIRS 时，仅提供浏览和下载。
      </n-alert> -->

      <div class="toolbar">
        <n-breadcrumb>
          <n-breadcrumb-item
            v-for="item in breadcrumbs"
            :key="item.path"
            @click="goToPath(item.path)"
          >
            <span class="breadcrumb-link">{{ item.label }}</span>
          </n-breadcrumb-item>
        </n-breadcrumb>

        <n-space>
          <n-button :disabled="!parentPath" @click="goParent">返回上级</n-button>
          <n-button @click="refreshCurrent">刷新</n-button>
        </n-space>
      </div>

      <n-card size="small">
        <n-space justify="space-between" align="center" wrap>
          <n-text depth="3">当前路径：{{ currentPath || "--" }}</n-text>
        </n-space>
      </n-card>

      <n-spin :show="loading">
        <n-data-table :columns="columns" :data="items" :pagination="false" />
      </n-spin>

      <n-empty v-if="!loading && items.length === 0" description="当前目录没有可展示的文件" />
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { NButton, NTag, NText } from "naive-ui";
import { fileBrowserApi } from "@renderer/apis";
import { useConfirm } from "@renderer/hooks";
import { useNotice } from "@renderer/hooks/useNotice";

import type { DataTableColumns } from "naive-ui";
import type { FileBrowserItem } from "@renderer/apis/fileBrowser";

defineOptions({
  name: "FileBrowser",
});

interface BreadcrumbItem {
  label: string;
  path: string;
}

const loading = ref(false);
const items = ref<FileBrowserItem[]>([]);
const rootPath = ref("");
const currentPath = ref("");
const parentPath = ref<string | null>(null);
const deleteEnabled = ref(false);

const confirm = useConfirm();
const notice = useNotice();

const pathSeparator = computed(() => (rootPath.value.includes("\\") ? "\\" : "/"));

const breadcrumbs = computed<BreadcrumbItem[]>(() => {
  if (!rootPath.value) {
    return [];
  }
  const relativePath = currentPath.value.startsWith(rootPath.value)
    ? currentPath.value.slice(rootPath.value.length)
    : "";
  const segments = relativePath.split(/[\\/]+/).filter(Boolean);
  const result: BreadcrumbItem[] = [
    {
      label: "录制目录",
      path: rootPath.value,
    },
  ];
  let cursor = rootPath.value;
  for (const segment of segments) {
    cursor = `${cursor}${cursor.endsWith(pathSeparator.value) ? "" : pathSeparator.value}${segment}`;
    result.push({
      label: segment,
      path: cursor,
    });
  }
  return result;
});

const formatFileSize = (size?: number) => {
  if (typeof size !== "number" || Number.isNaN(size) || size < 0) {
    return "--";
  }
  if (size < 1024) {
    return `${size} B`;
  }
  const units = ["KB", "MB", "GB", "TB"];
  let value = size / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unitIndex]}`;
};

const formatTime = (timestamp: number) => {
  if (!timestamp) {
    return "--";
  }
  return new Date(timestamp)
    .toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
    .replace(/\//g, "-");
};

const triggerBrowserDownload = (url: string) => {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
};

const fetchList = async (path?: string) => {
  loading.value = true;
  try {
    const data = await fileBrowserApi.list(path);
    items.value = data.list;
    rootPath.value = data.rootPath;
    currentPath.value = data.currentPath;
    parentPath.value = data.parentPath;
    deleteEnabled.value = data.deleteEnabled;
  } catch (error: any) {
    notice.error({
      title: error?.message || error || "获取文件列表失败",
    });
  } finally {
    loading.value = false;
  }
};

const goToPath = async (path: string) => {
  await fetchList(path);
};

const goParent = async () => {
  if (!parentPath.value) {
    return;
  }
  await fetchList(parentPath.value);
};

const refreshCurrent = async () => {
  await fetchList(currentPath.value || undefined);
};

const downloadFile = async (row: FileBrowserItem) => {
  try {
    const url = await fileBrowserApi.createDownloadUrl(row.path);
    triggerBrowserDownload(url);
  } catch (error: any) {
    notice.error({
      title: error?.message || error || "下载失败",
    });
  }
};

const removeFile = async (row: FileBrowserItem) => {
  const [confirmed] = await confirm.warning({
    content: `确定删除文件 ${row.name} 吗？此操作不可撤销。`,
  });
  if (!confirmed) {
    return;
  }
  try {
    await fileBrowserApi.removeFile(row.path);
    notice.success("删除成功");
    await refreshCurrent();
  } catch (error: any) {
    notice.error({
      title: error?.message || error || "删除失败",
    });
  }
};

const columns = computed<DataTableColumns<FileBrowserItem>>(() => [
  {
    title: "名称",
    key: "name",
    render: (row) => {
      if (row.type === "directory") {
        return h(
          "span",
          {
            onClick: () => goToPath(row.path),
            style: {
              cursor: "pointer",
              display: "inline-block",
              width: "100%",
            },
          },
          { default: () => `📁 ${row.name}` },
        );
      }
      return h(
        "span",
        {
          style: {
            cursor: "pointer",
            display: "inline-block",
            width: "100%",
          },
        },
        { default: () => `📄 ${row.name}` },
      );
    },
  },
  {
    title: "类型",
    key: "fileKind",
    render: (row) => {
      if (row.type === "directory") {
        return h(NTag, { size: "small" }, { default: () => "目录" });
      }
      return h(
        NTag,
        {
          size: "small",
          type: row.fileKind === "video" ? "success" : "info",
        },
        { default: () => (row.fileKind === "video" ? "视频" : "文件") },
      );
    },
  },
  {
    title: "大小",
    key: "size",
    render: (row) => (row.type === "directory" ? "--" : formatFileSize(row.size)),
  },
  {
    title: "修改时间",
    key: "mtimeMs",
    render: (row) => formatTime(row.mtimeMs),
  },
  {
    title: "操作",
    key: "actions",
    render: (row) => {
      if (row.type === "directory") {
        return h(
          NButton,
          {
            text: true,
            type: "primary",
            onClick: () => goToPath(row.path),
          },
          { default: () => "进入" },
        );
      }
      const actions = [
        h(
          NButton,
          {
            text: true,
            type: "primary",
            onClick: () => downloadFile(row),
          },
          { default: () => "下载" },
        ),
      ];
      if (row.canDelete) {
        actions.push(
          h(
            NButton,
            {
              text: true,
              type: "error",
              onClick: () => removeFile(row),
            },
            { default: () => "删除" },
          ),
        );
      }
      return h(
        "div",
        {
          style: {
            display: "flex",
            gap: "12px",
          },
        },
        actions,
      );
    },
  },
]);

onMounted(() => {
  fetchList();
});
</script>

<style scoped>
.file-browser-page {
  padding: 20px;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.breadcrumb-link {
  cursor: pointer;
}
</style>
