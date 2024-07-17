import JSON5 from "json5";
import { useAppConfig } from "@renderer/stores";
import { storeToRefs } from "pinia";

export function useLlcProject() {
  const notice = useNotification();
  const { appConfig } = storeToRefs(useAppConfig());

  const cuts = ref<
    {
      start: number;
      end?: number;
      name: string;
      checked: boolean;
      tags: any;
    }[]
  >([]);
  const selectedCuts = computed(() => {
    return cuts.value.filter((item) => item.checked);
  });

  const llcProjectPath = ref("");
  const mediaPath = ref("");

  /**
   * 导入项目文件
   */
  const importProject = async () => {
    const files = await window.api.openFile({
      multi: false,
      filters: [
        {
          name: "file",
          extensions: ["llc"],
        },
      ],
    });
    if (!files) return;
    const file = files[0];
    handleProject(file);
  };

  /**
   * 处理项目文件
   */
  const handleProject = async (file: string) => {
    llcProjectPath.value = file;
    const data = JSON5.parse(await window.api.common.readFile(file));
    cuts.value = data.cutSegments.map((item: any) => {
      return {
        ...item,
        checked: true,
      };
    });
    const mediaFileName = data.mediaFileName;
    mediaPath.value = window.path.join(window.path.dirname(file), mediaFileName);
  };

  /**
   * 从本地重新加载项目文件，项目文件可能已经被更新
   */
  const loadProject = async () => {
    if (!llcProjectPath.value) {
      return;
    }
    handleProject(llcProjectPath.value);
  };

  /**
   * 保存项目文件
   */
  const asveProject = async () => {
    if (!llcProjectPath.value) {
      return;
    }
    // const data = {
    //   mediaFileName: window.path.basename(mediaPath.value),
    //   cutSegments: cuts.value,
    // };
    const projectData = {
      version: 1,
      mediaFileName: window.path.basename(mediaPath.value),
      cutSegments: cuts.value.map(({ start, end, name, tags }) => ({ start, end, name, tags })),
    };
    await window.api.common.writeFile(llcProjectPath.value, JSON5.stringify(projectData, null, 2));
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
      console.log("openProject", appConfig.value.losslessCutPath);
    } else {
      notice.info({
        title: "使用默认程序打开llc文件，你也可以尝试在设置中设置lossless-cut的路径",
        duration: 2000,
      });
      await window.api.openPath(llcProjectPath.value);
    }
  };

  /**
   * 导入项目文件按钮组点击事件
   */
  const handleProjectClick = (key?: string | number) => {
    if (!key) {
      importProject();
    } else if (key === "refresh") {
      loadProject();
    } else if (key === "save") {
      asveProject();
    } else if (key === "open") {
      openProject();
    } else {
      console.error(`${key} is not supported`);
    }
  };

  const options = computed(() => {
    const disabled = !mediaPath.value;
    return [
      { label: "重新加载", key: "refresh", disabled },
      { label: "保存", key: "save", disabled },
      { label: "打开", key: "open", disabled },
    ];
  });

  return {
    cuts,
    selectedCuts,
    handleProjectClick,
    llcProjectPath,
    mediaPath,
    options,
  };
}
