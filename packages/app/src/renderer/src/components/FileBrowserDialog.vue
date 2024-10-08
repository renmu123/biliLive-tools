<template>
  <n-config-provider :theme="theme" :locale="zhCN" :date-locale="dateZhCN">
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
          <p>Current Path: {{ currentPath }}</p>

          <!-- 文件夹与文件展示 -->
          <ul class="file-list">
            <li v-if="currentPath && currentPath !== '/'" @click="goUpDirectory">上一级</li>
            <li
              v-for="(file, index) in files"
              :key="index"
              class="file"
              :class="{ selected: selectedFiles.includes(file.path) }"
              @click="selectFile(file)"
              @dblclick="file.type === 'directory' ? openDirectory(file) : ''"
            >
              {{ file.type === "directory" ? "📁" : "📄" }} {{ file.name }}
            </li>
          </ul>
        </div>
        <template #footer>
          <div style="text-align: right">
            <n-button style="margin-left: 10px" @click="closeDialog">取消</n-button>
            <n-button
              :disabled="!selectedFiles"
              type="primary"
              style="margin-left: 10px"
              @click="confirm"
              >确认</n-button
            >
          </div>
        </template>
      </n-card>
    </n-modal>
  </n-config-provider>
</template>

<script lang="ts" setup>
import { commonApi } from "@renderer/apis";
import { darkTheme, lightTheme, useOsTheme, dateZhCN, zhCN } from "naive-ui";

interface Props {
  type?: "file" | "directory";
  multi?: boolean;
  exts?: string[];
  close: () => void;
  confirm: (path: string[]) => void;
}

const showModal = defineModel<boolean>("visible", { required: true, default: false });
// const emit = defineEmits(["close", "confirm"]);
const props = withDefaults(defineProps<Props>(), {
  type: "file",
  multi: false,
  exts: () => [],
  close: () => {},
  confirm: () => {},
});

const files = ref<
  {
    name: string;
    type: "file" | "directory";
    path: string;
  }[]
>([]);
const currentPath = ref("/"); // 跟踪当前路径
// const selectedExt = ref<string[]>([]); // 跟踪当前选择的扩展名
const selectedFiles = ref<string[]>([]); // 跟踪当前选择的文件
const parentPath = ref();

// 获取文件列表
const fetchFiles = async () => {
  selectedFiles.value = [];
  const res = await commonApi.getFiles({
    path: currentPath.value,
    exts: props.exts,
    type: props.type,
  });
  files.value = res.list;
  parentPath.value = res.parent;
};

// 进入文件夹
const openDirectory = (file) => {
  currentPath.value = file.path;
  fetchFiles();
};

// 返回上一级目录
const goUpDirectory = () => {
  currentPath.value = parentPath.value;
  fetchFiles();
};

// 选择文件
const selectFile = (file: { name: string; type: "file" | "directory"; path: string }) => {
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
  // emit("close");
  props.close();
  showModal.value = false;
};

const confirm = () => {
  // emit("confirm", { path: selectedFiles.value });
  props.confirm(selectedFiles.value);
  showModal.value = false;
  // closeDialog();
};

onMounted(() => {
  fetchFiles();
});

const osThemeRef = useOsTheme();
const theme = computed(() => {
  if (osThemeRef.value === "dark") {
    return darkTheme;
  } else {
    return lightTheme;
  }
});
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

  &.selected {
    // 选中颜色更深一点
    background-color: #ddd;
    @media screen and (prefers-color-scheme: dark) {
      background-color: rgba(255, 255, 255, 0.09);
    }
  }
  // border-bottom: 1px solid #ddd;
}

.file-list li:hover {
  &:hover {
    background-color: #eee;
    @media screen and (prefers-color-scheme: dark) {
      background-color: rgba(255, 255, 255, 0.09);
    }
  }
}

.file-actions {
  display: flex;
  justify-content: flex-end;
}

button {
  margin-left: 10px;
}
</style>
