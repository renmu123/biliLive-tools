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
          <n-button :disabled="!parentPath || deleting" @click="goParent">返回上级</n-button>
          <n-button :disabled="deleting" @click="refreshCurrent">刷新</n-button>
          <n-button
            v-if="hasDeletableItems"
            type="error"
            :disabled="selectedFiles.length === 0 || loading || deleting"
            :loading="deleting"
            @click="removeSelectedFiles"
          >
            批量删除（{{ selectedFiles.length }}）
          </n-button>
        </n-space>
      </div>

      <n-card size="small">
        <n-space justify="space-between" align="center" wrap>
          <n-text depth="3">当前路径：{{ currentPath || "--" }}</n-text>
        </n-space>
      </n-card>

      <n-spin :show="loading">
        <n-data-table
          :columns="columns"
          :data="items"
          :row-key="rowKey"
          :checked-row-keys="checkedRowKeys"
          :pagination="false"
          @update:checked-row-keys="onCheckedRowKeysChange"
        />
      </n-spin>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { NButton, NTag, NText } from "naive-ui";
import { fileBrowserApi } from "@renderer/apis";
import { useConfirm } from "@renderer/hooks";
import { useNotice } from "@renderer/hooks/useNotice";
import { toVideoPlayerPage } from "@renderer/utils/pages";

import type { DataTableColumns, DataTableRowKey } from "naive-ui";
import type { FileBrowserItem } from "@renderer/apis/fileBrowser";

defineOptions({
  name: "FileBrowser",
});

interface BreadcrumbItem {
  label: string;
  path: string;
}

const loading = ref(false);
const deleting = ref(false);
const items = ref<FileBrowserItem[]>([]);
const checkedRowKeys = ref<DataTableRowKey[]>([]);
const rootPath = ref("");
const currentPath = ref("");
const parentPath = ref<string | null>(null);
const deleteEnabled = ref(false);

const confirm = useConfirm();
const notice = useNotice();

const rowKey = (row: FileBrowserItem) => row.path;
const hasDeletableItems = computed(
  () => deleteEnabled.value && items.value.some((item) => item.canDelete),
);
const selectedFiles = computed(() => {
  const selectedPaths = new Set(checkedRowKeys.value);
  return items.value.filter((item) => item.canDelete && selectedPaths.has(item.path));
});
const onCheckedRowKeysChange = (keys: DataTableRowKey[]) => {
  checkedRowKeys.value = keys;
};

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
    checkedRowKeys.value = [];
  } catch (error: any) {
    notice.error({
      title: error?.message || error || "获取文件列表失败",
    });
  } finally {
    loading.value = false;
  }
};

const goToPath = async (path: string) => {
  if (deleting.value) return;
  await fetchList(path);
};

const goParent = async () => {
  if (!parentPath.value || deleting.value) {
    return;
  }
  await fetchList(parentPath.value);
};

const refreshCurrent = async () => {
  if (deleting.value) return;
  await fetchList(currentPath.value || undefined);
};

const downloadFile = async (row: FileBrowserItem) => {
  const url = await fileBrowserApi.createDownloadUrl(row.path);
  triggerBrowserDownload(url);
};

const isTsFile = (row: FileBrowserItem) => row.name.toLowerCase().endsWith(".ts");

const isPlayableVideo = (row: FileBrowserItem) =>
  row.type === "file" && row.fileKind === "video" && !isTsFile(row);

const openPlayer = async (row: FileBrowserItem) => {
  if (!isPlayableVideo(row)) {
    return;
  }
  toVideoPlayerPage({
    videoFilePath: row.path,
  });
};

const removeFile = async (row: FileBrowserItem) => {
  if (deleting.value || loading.value) return;
  deleting.value = true;
  try {
    const [confirmed] = await confirm.warning({
      content: `确定删除文件 ${row.name} 吗？此操作不可撤销。`,
    });
    if (!confirmed) return;
    await fileBrowserApi.removeFile(row.path);
    notice.success("删除成功");
    await fetchList(currentPath.value);
  } catch (error: any) {
    notice.error({
      title: error?.message || error || "删除失败",
    });
  } finally {
    deleting.value = false;
  }
};

const removeSelectedFiles = async () => {
  if (deleting.value || loading.value || selectedFiles.value.length === 0) return;
  const files = [...selectedFiles.value];
  deleting.value = true;
  try {
    const [confirmed] = await confirm.warning({
      content: `确定删除选中的 ${files.length} 个文件吗？此操作不可撤销。`,
    });
    if (!confirmed) return;

    const failed: { name: string; reason: unknown }[] = [];
    let succeeded = 0;
    const batchSize = 5;
    for (let index = 0; index < files.length; index += batchSize) {
      const batch = files.slice(index, index + batchSize);
      const results = await Promise.allSettled(
        batch.map((file) => fileBrowserApi.removeFile(file.path)),
      );
      results.forEach((result, resultIndex) => {
        if (result.status === "fulfilled") {
          succeeded++;
        } else {
          failed.push({ name: batch[resultIndex].name, reason: result.reason });
        }
      });
    }

    await fetchList(currentPath.value);
    if (succeeded > 0) {
      notice.success(`成功删除 ${succeeded} 个文件`);
    }
    if (failed.length > 0) {
      notice.error({
        title: `${failed.length} 个文件删除失败`,
        content:
          failed
            .slice(0, 3)
            .map(
              ({ name, reason }) =>
                `${name}：${reason instanceof Error ? reason.message : String(reason)}`,
            )
            .join("；") + (failed.length > 3 ? "；其余文件也未删除" : ""),
        duration: 5000,
      });
    }
  } catch (error: any) {
    notice.error({
      title: error?.message || error || "批量删除失败",
    });
  } finally {
    deleting.value = false;
  }
};

const columns = computed<DataTableColumns<FileBrowserItem>>(() => [
  ...(hasDeletableItems.value
    ? [
        {
          type: "selection" as const,
          disabled: (row: FileBrowserItem) => !row.canDelete || deleting.value,
        },
      ]
    : []),
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
      if (row.fileKind === "video") {
        actions.unshift(
          h(
            NButton,
            {
              text: true,
              type: "primary",
              disabled: isTsFile(row),
              onClick: () => openPlayer(row),
            },
            { default: () => (isTsFile(row) ? "TS 不支持播放" : "播放") },
          ),
        );
      }
      if (row.canDelete) {
        actions.push(
          h(
            NButton,
            {
              text: true,
              type: "error",
              disabled: deleting.value || loading.value,
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

@media (max-width: 628px) {
  .file-browser-page {
    padding: 0;
  }
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
