<template>
  <div v-if="show" class="file-browser-dialog">
    <div class="file-browser-content">
      <h3>Browse Files</h3>

      <!-- 文件扩展名筛选器 -->
      <div class="filter">
        <label for="extFilter">Filter by extension:</label>
        <select id="extFilter" v-model="selectedExt" @change="fetchFiles">
          <option value="">All</option>
          <option value=".txt">.txt</option>
          <option value=".pdf">.pdf</option>
          <option value=".jpg">.jpg</option>
        </select>
      </div>

      <!-- 当前路径显示 -->
      <p>Current Path: /{{ currentPath }}</p>

      <!-- 文件夹与文件展示 -->
      <ul class="file-list">
        <li v-if="currentPath !== ''" @click="goUpDirectory">.. (Up one level)</li>
        <li
          v-for="(file, index) in files"
          :key="index"
          @click="file.isDirectory ? openDirectory(file) : selectFile(file)"
        >
          {{ file.isDirectory ? "📁" : "📄" }} {{ file.name }}
        </li>
      </ul>

      <div class="file-actions">
        <button @click="closeDialog">Close</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import axios from "axios";

export default {
  props: {
    show: {
      type: Boolean,
      required: true,
    },
  },
  emits: ["close", "fileSelected"],
  setup(props, { emit }) {
    const files = ref([]);
    const currentPath = ref(""); // 跟踪当前路径
    const selectedExt = ref(""); // 跟踪当前选择的扩展名

    // 获取文件列表
    const fetchFiles = async () => {
      try {
        const response = await axios.get("/api/files", {
          params: {
            path: currentPath.value,
            ext: selectedExt.value,
          },
        });
        files.value = response.data;
      } catch (error) {
        console.error("Error fetching files:", error);
      }
    };

    // 进入文件夹
    const openDirectory = (file) => {
      currentPath.value = file.path;
      fetchFiles();
    };

    // 返回上一级目录
    const goUpDirectory = () => {
      const pathParts = currentPath.value.split("/").filter(Boolean);
      pathParts.pop(); // 移除最后一级
      currentPath.value = pathParts.join("/");
      fetchFiles();
    };

    // 选择文件
    const selectFile = (file) => {
      emit("fileSelected", file);
      closeDialog();
    };

    // 关闭弹框
    const closeDialog = () => {
      emit("close");
    };

    onMounted(() => {
      fetchFiles();
    });

    return {
      files,
      currentPath,
      selectedExt,
      openDirectory,
      goUpDirectory,
      selectFile,
      closeDialog,
      fetchFiles,
    };
  },
};
</script>

<style scoped lang="scss">
.file-browser-dialog {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.file-browser-content {
  background: white;
  padding: 20px;
  border-radius: 5px;
  min-width: 400px;
}

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
  border-bottom: 1px solid #ddd;
}

.file-list li:hover {
  background-color: #f0f0f0;
}

.file-actions {
  display: flex;
  justify-content: flex-end;
}

button {
  margin-left: 10px;
}
</style>
