import { Ref } from "vue";
import JSON5 from "json5";
import { useAppConfig, useSegmentStore } from "@renderer/stores";
import { storeToRefs } from "pinia";
import { showFileDialog, showSaveDialog } from "@renderer/utils/fileSystem";
import { replaceExtName } from "@renderer/utils";
import { commonApi } from "@renderer/apis";

/**
 * 项目管理 Hook
 * 负责 lossless-cut 项目文件的导入、保存、加载等操作
 */
export function useProjectManager(files: Ref<{ videoPath: string | null }>) {
  const notice = useNotification();
  const { appConfig } = storeToRefs(useAppConfig());
  const { rawCuts } = storeToRefs(useSegmentStore());
  const { clearHistory, init } = useSegmentStore();

  // 项目文件路径
  const projectFilePath = ref("");
  // 从项目文件中解析出的媒体文件路径
  const projectMediaPath = ref("");

  /**
   * 清理项目状态
   */
  const resetProjectState = () => {
    projectFilePath.value = "";
    projectMediaPath.value = "";
  };

  /**
   * 选择并导入项目文件
   */
  const selectAndImportProject = async () => {
    const selectedFiles = await showFileDialog({
      extensions: ["llc"],
    });
    if (!selectedFiles || selectedFiles.length === 0) return;

    const filePath = selectedFiles[0];
    await loadProjectFile(filePath);
  };

  /**
   * 加载项目文件
   * @param filePath 项目文件路径
   */
  const loadProjectFile = async (filePath: string) => {
    try {
      const content = await commonApi.readLLCProject(filePath);
      const projectData = JSON5.parse(content);

      // 更新项目路径
      projectFilePath.value = filePath;

      // 初始化切片数据
      const segments = projectData.cutSegments.map((item: any) => ({
        ...item,
        checked: true,
      }));
      init(segments);

      // 解析媒体文件路径
      const mediaFileName = projectData.mediaFileName;
      projectMediaPath.value = window.path.join(window.path.dirname(filePath), mediaFileName);
    } catch (error) {
      console.error("项目文件加载失败:", error);
      notice.error({
        title: "项目文件解析失败，请确认文件有效",
        duration: 2000,
      });
    }
  };

  /**
   * 重新加载当前项目文件
   */
  const reloadProject = async () => {
    if (!projectFilePath.value) return;

    clearHistory();
    await loadProjectFile(projectFilePath.value);
  };

  /**
   * 保存项目（如果已有路径则直接保存，否则另存为）
   * @param sourceVideoPath 源视频路径，用于另存为时的默认路径
   */
  const saveProject = async (sourceVideoPath?: string | null) => {
    const mediaFileName = projectMediaPath.value || files.value.videoPath;
    if (!mediaFileName) {
      notice.error({
        title: "请先选择视频文件",
        duration: 2000,
      });
      return;
    }

    if (projectFilePath.value) {
      await saveToFile(projectFilePath.value, mediaFileName);
    } else {
      await saveProjectAs(sourceVideoPath);
    }
  };

  /**
   * 保存项目到指定文件
   * @param filePath 保存路径
   * @param mediaFileName 媒体文件名
   */
  const saveToFile = async (filePath: string, mediaFileName: string) => {
    const projectData = {
      version: 1,
      mediaFileName: window.path.basename(mediaFileName),
      cutSegments: rawCuts.value.map(({ start, end, name, tags }) => ({ start, end, name, tags })),
    };

    await commonApi.writeLLCProject(filePath, JSON5.stringify(projectData, null, 2));
    notice.success({
      title: "已保存",
      duration: 1000,
    });
  };

  /**
   * 使用 lossless-cut 打开项目文件
   */
  const openInLosslessCut = async () => {
    if (!projectFilePath.value) {
      return;
    }

    if (appConfig.value.losslessCutPath) {
      // 使用用户设置的 lossless-cut 路径
      window.api.common.execFile(appConfig.value.losslessCutPath, [projectFilePath.value]);
    } else {
      notice.info({
        title: "使用默认程序打开llc文件，你也可以尝试在设置中设置lossless-cut的路径",
        duration: 2000,
      });
      await window.api.openPath(projectFilePath.value);
    }
  };

  /**
   * 另存为项目文件
   * @param sourceVideoPath 源视频路径，用于生成默认文件名
   */
  const saveProjectAs = async (sourceVideoPath?: string | null) => {
    const mediaFileName = projectMediaPath.value || files.value.videoPath;
    if (!mediaFileName) {
      notice.error({
        title: "请先选择视频文件",
        duration: 2000,
      });
      return;
    }

    const file = await showSaveDialog({
      extension: "llc",
      defaultPath: replaceExtName(sourceVideoPath || "", ".llc"),
    });

    if (!file) return;

    projectFilePath.value = file;
    await saveToFile(file, mediaFileName);
  };

  /**
   * 处理项目操作按钮点击
   * @param action 操作类型
   * @param sourceVideoPath 源视频路径
   */
  const handleProjectAction = (action?: string | number, sourceVideoPath?: string | null) => {
    switch (action) {
      case "importProject":
        selectAndImportProject();
        break;
      case "refresh":
        reloadProject();
        break;
      case "save":
        saveProject(sourceVideoPath);
        break;
      case "open":
        openInLosslessCut();
        break;
      case "saveAnother":
        saveProjectAs(sourceVideoPath);
        break;
      default:
        console.error(`不支持的操作: ${action}`);
    }
  };

  /**
   * 项目操作选项
   */
  const projectMenuOptions = computed(() => {
    const hasProject = !!projectFilePath.value;
    const hasVideo = !!files.value.videoPath;
    const isWeb = window.isWeb;
    const items: { label: string; key: string; disabled: boolean }[] = [];

    if (!isWeb) {
      items.push({ label: "重新加载", key: "refresh", disabled: !hasProject });
      items.push({ label: "使用llc打开", key: "open", disabled: !hasProject });
    }
    items.push({ label: "保存(ctrl+s)", key: "save", disabled: !hasProject });
    items.push({
      label: "另存为(ctrl+shift+s)",
      key: "saveAnother",
      disabled: !hasVideo,
    });

    return items;
  });

  return {
    projectFilePath,
    projectMediaPath,
    projectMenuOptions,
    handleProjectAction,
    saveProject,
    saveProjectAs,
    loadProjectFile,
    resetProjectState,
  };
}
