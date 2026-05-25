<template>
  <n-config-provider :theme="themeStore.themeUI" :locale="zhCN" :date-locale="dateZhCN">
    <n-modal v-model:show="showModal" transform-origin="center" :auto-focus="false">
      <n-card style="width: 800px" title="文件浏览器" :bordered="false">
        <div class="file-browser-content">
          <!-- 文件扩展名筛选器 -->
          <!-- <div class="filter">
            <label for="extFilter">Filter by extension:</label>
            <select id="extFilter" v-model="selectedExt" @change="fetchFiles">
              <option value="">All</option>
              <option value=".txt">.txt</option>
              <option value=".pdf">.pdf</option>
              <option value=".jpg">.jpg</option>
            </select>
          </div> -->

          <!-- 当前路径显示 -->
          <div>
            <n-input
              v-model:value="currentPath"
              placeholder="请输入文件夹路径"
              @keyup.enter="openDirectory({ path: currentPath })"
            />
          </div>

          <!-- 文件夹与文件展示 -->
          <ul class="file-list">
            <li v-if="currentPath && currentPath !== '/'" @click="goUpDirectory">上一层</li>
            <li
              v-for="(file, index) in files"
              :key="index"
              class="file"
              :class="{ selected: selectedFiles.includes(file.path) }"
              @click="selectFile(file)"
            >
              <span class="file-name">
                {{ file.type === "directory" ? "📁" : "📄" }} {{ file.name }}
              </span>
              <span v-if="showFileSize && file.type === 'file'" class="file-size">
                {{ formatFileSize(file.size) }}
              </span>
            </li>
          </ul>
        </div>
        <template #footer>
          <div style="display: flex; justify-content: space-between">
            <div style="flex: 1">
              <n-input
                v-if="props.type === 'save'"
                v-model:value="filename"
                placeholder="请输入文件名"
                @keyup.enter="confirm"
              >
                <template #suffix>
                  {{ props.extension ? `.${props.extension}` : "" }}
                </template>
              </n-input>
            </div>
            <div style="flex: none">
              <n-button @click="closeDialog">取消</n-button>
              <n-button
                :disabled="!selectedFiles"
                type="primary"
                style="margin-left: 10px"
                @click="confirm"
              >
                {{ confirmText }}
              </n-button>
            </div>
          </div>
        </template>
      </n-card>
    </n-modal>
  </n-config-provider>
</template>

<script lang="ts" setup>
import { commonApi } from "@renderer/apis";
import { useThemeStore } from "@renderer/stores/theme";
import { useStorage } from "@vueuse/core";
import { dateZhCN, zhCN } from "naive-ui";

interface Props {
  type?: "file" | "directory" | "save";
  multi?: boolean;
  exts?: string[];
  extension?: string;
  defaultPath?: string;
  close: () => void;
  confirm: (path: string[]) => void;
}

interface BrowserFileItem {
  name: string;
  type: "file" | "directory";
  path: string;
  size?: number;
}

const showModal = defineModel<boolean>("visible", { required: true, default: false });
// const emit = defineEmits(["close", "confirm"]);
const props = withDefaults(defineProps<Props>(), {
  type: "file",
  multi: false,
  extension: "",
  exts: () => [],
  defaultPath: "",
  close: () => {},
  confirm: () => {},
});

const files = ref<BrowserFileItem[]>([]);
// const currentPath = ref("/"); // 跟踪当前路径
const currentPath = useStorage("file-store", "/");
const filename = ref(""); // 跟踪当前文件名
// const selectedExt = ref<string[]>([]); // 跟踪当前选择的扩展名
const selectedFiles = ref<string[]>([]);
const parentPath = ref<string>();

let runCount = 0;
// 获取文件列表
const fetchFiles = async () => {
  selectedFiles.value = [];
  const typeMap = {
    file: "file",
    directory: "directory",
    save: "directory",
  } as const;
  const res = await commonApi
    .getFiles({
      path: currentPath.value,
      exts: props.exts,
      type: typeMap[props.type],
    })
    .catch((err) => {
      runCount++;
      currentPath.value = "/";
      if (runCount > 4) {
        throw err;
      }
      fetchFiles();
      throw err;
    });
  runCount = 0;
  files.value = res.list;
  parentPath.value = res.parent;
};

const confirmText = computed(() => {
  if (props.type === "directory") {
    return "选择文件夹";
  } else if (props.type === "save") {
    return "保存";
  } else if (props.type === "file") {
    return "打开";
  } else {
    return "确定";
  }
});

const showFileSize = computed(() => props.type === "file");

// 优化文件大小显示
const formatFileSize = (size?: number) => {
  if (typeof size !== "number" || Number.isNaN(size) || size < 0) {
    return "";
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

// 进入文件夹
const openDirectory = (file: { path: string }) => {
  currentPath.value = file.path;
  fetchFiles();
};

// 返回上一级目录
const goUpDirectory = () => {
  currentPath.value = parentPath.value || "/";
  fetchFiles();
};

// 选择文件
const selectFile = (file: BrowserFileItem) => {
  if (props.type === "file" && file.type === "directory") {
    openDirectory(file);
    return;
  }

  if (props.type !== file.type) return;

  if (props.multi) {
    if (selectedFiles.value.includes(file.path)) {
      selectedFiles.value = selectedFiles.value.filter((path) => path !== file.path);
    } else {
      selectedFiles.value = [...selectedFiles.value, file.path];
    }
  } else {
    selectedFiles.value = [file.path];
  }
};

// 关闭弹框
const closeDialog = () => {
  showModal.value = false;
  // emit("close");
  props.close();
};

const confirm = async () => {
  // emit("confirm", { path: selectedFiles.value });
  let result = selectedFiles.value;
  if (props.type === "directory" && !result.length) {
    result = [currentPath.value];
  } else if (props.type === "save") {
    if (!filename.value) {
      return;
    }
    const filePath = await commonApi.fileJoin(currentPath.value, filename.value);
    result = [filePath + `.${props.extension}`];
  }
  showModal.value = false;
  props.confirm(result);
  // closeDialog();
};

// watch(
//   () => showModal.value,
//   () => {
//     filePath.value = currentPath.value;
//   },
// );

onMounted(() => {
  // 默认路径可能是文件名，也有可能是绝对路径文件名
  if (props.defaultPath) {
    if (window.path.isAbsolute(props.defaultPath)) {
      currentPath.value = window.path.dirname(props.defaultPath);
    }

    // 文件名
    filename.value = window.path.basename(
      props.defaultPath,
      window.path.extname(props.defaultPath),
    );
  }

  fetchFiles();
});

const themeStore = useThemeStore();
</script>

<style scoped lang="less">
.filter {
  margin-bottom: 10px;
}

.file-list {
  list-style-type: none;
  padding: 0;
  margin: 20px 0;
}

.file-list li {
  padding: 10px;
  cursor: pointer;
  margin-bottom: 5px;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  &.selected {
    // 选中颜色更深一点
    background-color: var(--bg-hover);
  }
  // border-bottom: 1px solid #ddd;
}

.file-list li:hover {
  &:hover {
    background-color: var(--bg-hover);
  }
}

.file-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  flex: none;
  color: var(--text-color-3);
  font-variant-numeric: tabular-nums;
}

.file-actions {
  display: flex;
  justify-content: flex-end;
}

button {
  margin-left: 10px;
}
</style>
