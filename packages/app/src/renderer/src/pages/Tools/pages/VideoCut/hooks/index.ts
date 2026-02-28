import { Ref } from "vue";
import JSON5 from "json5";
import { useAppConfig, useSegmentStore } from "@renderer/stores";
import { storeToRefs } from "pinia";
import { showSaveDialog } from "@renderer/utils/fileSystem";
import { commonApi } from "@renderer/apis";

/**
 * 项目管理 Hook
 * 负责 lossless-cut 项目文件的导入、保存、加载等操作
 */
export function useProjectManager(
  files: Ref<{
    videoPath: string | null;
    danmuPath: string | null;
    originDanmuPath: string | null;
    originVideoPath: string | null;
  }>,
) {
  const notice = useNotification();
  const { appConfig } = storeToRefs(useAppConfig());
  const { rawCuts } = storeToRefs(useSegmentStore());
  const { init } = useSegmentStore();

  // 项目文件路径
  const projectFilePath = ref("");

  /**
   * 清理项目状态
   */
  const resetProjectState = () => {
    projectFilePath.value = "";
  };

  /**
   * 加载项目文件
   * @param filePath 项目文件路径
   */
  const loadProjectFile = async (filePath: string) => {
    try {
      const projectData = await readProjectFile(filePath);

      // 更新项目路径
      projectFilePath.value = filePath;

      // 初始化切片数据
      const segments = projectData.cutSegments.map((item: any) => ({
        ...item,
        checked: true,
      }));
      init(segments);
    } catch (error) {
      notice.error({
        title: "项目文件解析失败，请确认文件有效",
        duration: 2000,
      });
    }
  };

  /**
   * 读取项目文件
   */
  const readProjectFile = async (filePath: string) => {
    const content = await commonApi.readLLCProject(filePath);
    const projectData = JSON5.parse(content);
    return projectData;
  };

  /**
   * 重新加载当前项目文件
   */
  // const reloadProject = async () => {
  //   if (!projectFilePath.value) return;

  //   clearHistory();
  //   await loadProjectFile(projectFilePath.value);
  // };

  /**
   * 保存项目（如果已有路径则直接保存，否则另存为）
   * @param sourceVideoPath 源视频路径，用于另存为时的默认路径
   */
  const saveProject = async (ignoreNotice = false) => {
    const mediaFileName = files.value.originVideoPath;
    if (!mediaFileName) {
      if (ignoreNotice) return;
      notice.error({
        title: "请先选择视频文件",
        duration: 2000,
      });
      return;
    }

    if (projectFilePath.value) {
      await saveToFile(projectFilePath.value, mediaFileName, ignoreNotice);
    } else {
      const { dir, name } = window.path.parse(mediaFileName);
      projectFilePath.value = window.path.join(dir, `${name}-proj.llc`);
      await saveToFile(projectFilePath.value, mediaFileName, ignoreNotice);
    }
  };

  /**
   * 保存项目到指定文件
   * @param filePath 保存路径
   * @param mediaFileName 媒体文件名
   */
  const saveToFile = async (filePath: string, mediaFileName: string, ignoreNotice = false) => {
    if (rawCuts.value.length === 0) {
      if (ignoreNotice) return;
      notice.error({
        title: "你必须至少添加一个片段才能保存项目",
        duration: 2000,
      });
      return;
    }
    const projectData = {
      version: 1,
      mediaFileName: window.path.basename(mediaFileName),
      cutSegments: rawCuts.value.map(({ start, end, name, tags, lyrics }) => ({
        start,
        end,
        name,
        tags,
        lyrics,
      })),
    };

    await commonApi.writeLLCProject(filePath, JSON5.stringify(projectData, null, 2));
    // notice.success({
    //   title: "已保存",
    //   duration: 1000,
    // });
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
  const saveProjectAs = async () => {
    const mediaFileName = files.value.originVideoPath;
    if (!mediaFileName) {
      notice.error({
        title: "请先选择视频文件",
        duration: 2000,
      });
      return;
    }

    const { dir, name } = window.path.parse(mediaFileName);
    const defaultPath = window.path.join(dir, `${name}-proj.llc`);
    const file = await showSaveDialog({
      extension: "llc",
      defaultPath,
    });

    if (!file) return;

    projectFilePath.value = file;
    await saveToFile(file, mediaFileName, true);
  };

  /**
   * 处理项目操作按钮点击
   * @param action 操作类型
   * @param sourceVideoPath 源视频路径
   */
  const handleProjectAction = (action?: string | number) => {
    switch (action) {
      case "save":
        saveProject();
        break;
      case "open":
        openInLosslessCut();
        break;
      case "saveAnother":
        saveProjectAs();
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
    const items: { label: string; key: string; disabled: boolean; type?: string }[] = [];

    if (!isWeb) {
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

  watch(
    () => rawCuts.value,
    () => {
      if (appConfig.value.videoCut.autoSave) {
        saveProject(true);
      }
    },
    { deep: true },
  );

  return {
    projectFilePath,
    projectMenuOptions,
    handleProjectAction,
    saveProject,
    saveProjectAs,
    loadProjectFile,
    resetProjectState,
    readProjectFile,
  };
}
