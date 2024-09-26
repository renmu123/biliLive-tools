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
            <li v-if="currentPath" @click="goUpDirectory">上一级</li>
            <li
              v-for="(file, index) in files"
              :key="index"
              class="file"
              :class="{ selected: selectedFile === file.path }"
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
              :disabled="!selectedFile"
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
  close: () => void;
  confirm: (path: string) => void;
}

const showModal = defineModel<boolean>("visible", { required: true, default: false });
// const emit = defineEmits(["close", "confirm"]);
const props = withDefaults(defineProps<Props>(), {
  type: "file",
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
const selectedExt = ref(""); // 跟踪当前选择的扩展名
const selectedFile = ref(""); // 跟踪当前选择的文件
const parentPath = ref();

// 获取文件列表
const fetchFiles = async () => {
  selectedFile.value = "";
  const res = await commonApi.getFiles({
    path: currentPath.value,
    ext: selectedExt.value,
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

  selectedFile.value = file.path;
  // emit("fileSelected", file);
  // closeDialog();
};

// 关闭弹框
const closeDialog = () => {
  // emit("close");
  props.close();
  showModal.value = false;
};

const confirm = () => {
  // emit("confirm", { path: selectedFile.value });
  props.confirm(selectedFile.value);
  showModal.value = false;
  // console.log("ppp", selectedFile.value);
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
