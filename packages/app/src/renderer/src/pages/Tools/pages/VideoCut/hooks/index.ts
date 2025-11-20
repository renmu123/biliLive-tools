import { Ref } from "vue";
import JSON5 from "json5";
import { useAppConfig, useSegmentStore } from "@renderer/stores";
import { storeToRefs } from "pinia";
import { showFileDialog, showSaveDialog } from "@renderer/utils/fileSystem";
import { replaceExtName } from "@renderer/utils";
import { commonApi } from "@renderer/apis";

export function useLlcProject(files: Ref<{ videoPath: string | null }>) {
  const notice = useNotification();
  const { appConfig } = storeToRefs(useAppConfig());
  const { rawCuts, selectedCuts, cuts } = storeToRefs(useSegmentStore());
  const { clearHistory, init } = useSegmentStore();

  const llcProjectPath = ref("");
  const mediaPath = ref("");

  const clean = () => {
    llcProjectPath.value = "";
    mediaPath.value = "";
  };

  /**
   * 导入项目文件
   */
  const importProject = async () => {
    const files = await showFileDialog({
      extensions: ["llc"],
    });
    if (!files) return;

    if (!files) return;
    const file = files?.[0];
    handleProject(file);
  };

  /**
   * 处理项目文件
   */
  const handleProject = async (file: string) => {
    const content = await commonApi.readLLCProject(file);
    try {
      llcProjectPath.value = file;
      const data = JSON5.parse(content);

      init(
        data.cutSegments.map((item: any) => {
          return {
            ...item,
            checked: true,
          };
        }),
      );
      const mediaFileName = data.mediaFileName;
      mediaPath.value = window.path.join(window.path.dirname(file), mediaFileName);
    } catch (error) {
      notice.error({
        title: "项目文件解析失败，请确认文件有效",
        duration: 2000,
      });
    }
  };

  /**
   * 从本地重新加载项目文件，项目文件可能已经被更新
   */
  const loadProject = async () => {
    if (options.value.find((item) => item.key === "refresh")?.disabled) return;

    clearHistory();
    handleProject(llcProjectPath.value);
  };

  /**
   * 保存项目按钮
   */
  const saveProject = async (rawFilePath?: string | null) => {
    const mediaFileName = mediaPath.value || files.value.videoPath;
    if (!mediaFileName) {
      notice.error({
        title: "请先选择视频文件",
        duration: 2000,
      });
      return;
    }
    if (llcProjectPath.value) {
      save();
    } else {
      saveAsAnother(rawFilePath);
    }
  };

  /**
   * 保存项目
   */
  const save = async () => {
    const mediaFileName = mediaPath.value || files.value.videoPath;
    if (!mediaFileName) {
      notice.error({
        title: "请先选择视频文件",
        duration: 2000,
      });
      return;
    }
    const projectData = {
      version: 1,
      mediaFileName: window.path.basename(mediaFileName),
      cutSegments: rawCuts.value.map(({ start, end, name, tags }) => ({ start, end, name, tags })),
    };
    await commonApi.writeLLCProject(llcProjectPath.value, JSON5.stringify(projectData, null, 2));
    notice.success({
      title: "已保存",
      duration: 1000,
    });
  };

  /**
   * 使用lossless-cut打开项目文件
   */
  const openProject = async () => {
    if (!llcProjectPath.value) {
      return;
    }
    if (appConfig.value.losslessCutPath) {
      // 使用用户设置的lossless-cut路径打开项目文件
      window.api.common.execFile(appConfig.value.losslessCutPath, [llcProjectPath.value]);
    } else {
      notice.info({
        title: "使用默认程序打开llc文件，你也可以尝试在设置中设置lossless-cut的路径",
        duration: 2000,
      });
      await window.api.openPath(llcProjectPath.value);
    }
  };

  /**
   * 另存为项目文件
   */
  const saveAsAnother = async (rawFilePath?: string | null) => {
    if (options.value.find((item) => item.key === "saveAnother")?.disabled) return;

    const file = await showSaveDialog({
      extension: "llc",
      defaultPath: replaceExtName(rawFilePath || "", ".llc"),
    });

    if (!file) return;
    llcProjectPath.value = file;
    await save();
  };

  /**
   * 导入项目文件按钮组点击事件
   */
  const handleProjectClick = (key?: string | number, rawFilePath?: string | null) => {
    if (key === "importProject") {
      importProject();
    } else if (key === "refresh") {
      loadProject();
    } else if (key === "save") {
      saveProject(rawFilePath);
    } else if (key === "open") {
      openProject();
    } else if (key === "saveAnother") {
      saveAsAnother(rawFilePath);
    } else {
      console.error(`${key} is not supported`);
    }
  };

  const options = computed(() => {
    const disabled = !llcProjectPath.value;
    const isWeb = window.isWeb;
    const items: { label: string; key: string; disabled: boolean }[] = [];
    if (!isWeb) {
      items.push({ label: "重新加载", key: "refresh", disabled });
      items.push({ label: "使用llc打开", key: "open", disabled });
    }
    items.push({ label: "保存(ctrl+s)", key: "save", disabled });
    items.push({
      label: "另存为(ctrl+shift+s)",
      key: "saveAnother",
      disabled: !files.value.videoPath,
    });
    return items;
  });

  return {
    cuts,
    selectedCuts,
    handleProjectClick,
    llcProjectPath,
    mediaPath,
    options,
    saveProject,
    saveAsAnother,
    handleProject,
    clean,
  };
}
