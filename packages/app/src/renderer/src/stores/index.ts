import { cloneDeep, isArray } from "lodash-es";
import { defineStore, storeToRefs } from "pinia";
import { DanmuPreset, BiliupPreset, AppConfig } from "@biliLive-tools/types";
import { getUserList } from "@renderer/apis/user";
import {
  danmuPresetApi,
  ffmpegPresetApi,
  videoPresetApi,
  configApi,
  taskApi,
} from "@renderer/apis";

import type { Task } from "@renderer/types";

export const useUserInfoStore = defineStore("userInfo", () => {
  const appConfigStore = useAppConfig();

  const userList = ref<
    {
      uid: number;
      expires: number;
      name?: string;
      face?: string;
      expiresText?: string;
    }[]
  >([]);

  const calcExpireTime = (expires: number) => {
    const date = new Date();
    if (expires) {
      const expireTime = new Date(expires);
      if (date > expireTime) {
        return "已过期!";
      } else {
        const diff = expireTime.getTime() - date.getTime();
        const day = Math.floor(diff / (24 * 3600 * 1000));
        return `${day}天后过期`;
      }
    }
    return "";
  };

  async function getUsers() {
    userList.value = (await getUserList()).map((item) => {
      return {
        ...item,
        expiresText: calcExpireTime(item.expires),
      };
    });
  }

  function changeUser(uid: number) {
    appConfigStore.set("uid", uid);
  }

  getUsers();
  const userInfo = computed(() => {
    const uid = appConfigStore.appConfig.uid;
    const user = userList.value.find((item) => item.uid === uid);
    return {
      uid: uid,
      profile: {
        face: user?.face,
        name: user?.name,
      },
    };
  });

  return { userInfo, getUsers, userList, changeUser };
});

export const useDanmuPreset = defineStore("danmuPreset", () => {
  const { appConfig } = storeToRefs(useAppConfig());

  // const danmuPresetId = toRef(appConfig.value.tool.danmu, "danmuPresetId");
  const danmuPresetId = computed({
    get: () => appConfig.value.tool.danmu.danmuPresetId,
    set: (value) => {
      appConfig.value.tool.danmu.danmuPresetId = value;
    },
  });

  const danmuPresets = ref<DanmuPreset[]>([]);
  // @ts-ignore
  const danmuPreset: Ref<DanmuPreset> = ref({
    config: {},
  });

  async function getDanmuPresets() {
    danmuPresets.value = await danmuPresetApi.list();
  }
  async function getDanmuPreset() {
    danmuPreset.value = await danmuPresetApi.get(danmuPresetId.value);
  }

  const danmuPresetsOptions = computed(() => {
    return danmuPresets.value.map((item) => {
      return {
        label: item.name,
        value: item.id,
      };
    });
  });

  watch(danmuPresetId, () => {
    getDanmuPreset();
  });

  getDanmuPresets();

  return {
    danmuPresets,
    getDanmuPresets,
    danmuPresetsOptions,
    danmuPresetId,
    danmuPreset,
    getDanmuPreset,
  };
});

export const useFfmpegPreset = defineStore("ffmpegPreset", () => {
  const options = ref<
    {
      value: string;
      label: string;
      children: {
        value: string;
        label: string;
      }[];
    }[]
  >([]);

  const getPresetOptions = async () => {
    options.value = await ffmpegPresetApi.options();
  };

  getPresetOptions();

  return {
    ffmpegOptions: options,
    getPresetOptions,
  };
});

export const useUploadPreset = defineStore("uploadPreset", () => {
  const upladPresetId = ref("default");
  const uploadPresets = ref<BiliupPreset[]>([]);
  // @ts-ignore
  const uploadPreset: Ref<BiliupPreset> = ref({
    config: {},
  });

  async function getUploadPresets() {
    uploadPresets.value = await videoPresetApi.list();
  }

  const uploaPresetsOptions = computed(() => {
    return uploadPresets.value.map((item) => {
      return {
        label: item.name,
        value: item.id,
      };
    });
  });

  getUploadPresets();

  return {
    uploadPresets,
    getUploadPresets,
    uploaPresetsOptions,
    upladPresetId,
    uploadPreset,
  };
});

export const useQueueStore = defineStore("queue", () => {
  const runningTaskNum = ref(0);
  const queue = ref<Task[]>([]);
  const params = ref({ type: "" });

  const getQuenu = async () => {
    const res = await taskApi.list(params.value);
    // 为了web的兼容性考虑
    if (isArray(res)) {
      queue.value = res.reverse();
    } else {
      queue.value = res.list.reverse();
      // runningTaskNum.value = res.runningTaskNum;
    }
  };
  const setRunningTaskNum = (num: number) => {
    runningTaskNum.value = num;
  };

  watch(
    () => params.value,
    () => {
      getQuenu();
    },
  );

  return {
    runningTaskNum,
    getQuenu,
    queue,
    params,
    setRunningTaskNum,
  };
});

export const useAppConfig = defineStore("appConfig", () => {
  // @ts-ignore
  const appConfig = ref<AppConfig>({
    tool: {
      home: {
        uploadPresetId: "",
        danmuPresetId: "",
        ffmpegPresetId: "",
        removeOrigin: false,
        autoUpload: false,
        hotProgress: false,
        hotProgressSample: 30,
        hotProgressHeight: 60,
        hotProgressColor: "#f9f5f3",
        hotProgressFillColor: "#333333",
        removeOriginAfterUploadCheck: false,
      },
      upload: {
        uploadPresetId: "",
        removeOriginAfterUploadCheck: false,
      },
      fileSync: {
        removeOrigin: false,
        syncType: undefined,
      },
      danmu: {
        danmuPresetId: "",
        saveRadio: 1,
        savePath: "",
        removeOrigin: false,
        override: true,
      },
      video2mp4: {
        saveRadio: 1,
        savePath: "",
        saveOriginPath: false,
        override: false,
        removeOrigin: false,
        ffmpegPresetId: "b_copy",
        danmuPresetId: "default",
        hotProgress: false,
      },
      videoMerge: {
        saveOriginPath: false,
        removeOrigin: false,
        keepFirstVideoMeta: false,
        mergeXml: false,
      },
      download: {
        savePath: "",
        danmu: "none",
        douyuResolution: "highest",
        override: false,
        onlyAudio: false,
      },
      translate: {
        presetId: undefined,
      },
      videoCut: {
        /** 保存类型 */
        saveRadio: 1,
        /** 保存路径 */
        savePath: ".\\导出文件夹",
        /** 覆盖已存在的文件 */
        override: false,
        /** ffmpeg预设 */
        ffmpegPresetId: "b_libx264",
        title: "{{filename}}-{{label}}-{{num}}",
        danmuPresetId: "default",
        ignoreDanmu: false,
      },
    },
  });

  async function getAppConfig() {
    appConfig.value = await configApi.get();
  }
  async function set<K extends keyof AppConfig>(key: K, value: AppConfig[K]) {
    await configApi.set(key, value);
    appConfig.value[key] = value;
  }
  watch(
    () => appConfig.value.tool,
    (newVal) => {
      configApi.set("tool", cloneDeep(newVal));
    },
    { deep: true },
  );

  return {
    appConfig,
    getAppConfig,
    set,
  };
});

function useHistoryStore<T>({ limit }: { limit: number }) {
  let history: T[] = [];
  let current = -1;

  const state = ref<T>();

  const add = (newState: T) => {
    if (current < history.length - 1) {
      history.splice(current + 1);
    }
    history.push(cloneDeep(newState));
    if (history.length > limit) {
      history.shift();
    } else {
      current++;
    }
    state.value = cloneDeep(newState);
  };

  const undo = () => {
    if (current > 0) {
      current--;
      state.value = cloneDeep(history[current]);
    }
  };

  const redo = () => {
    if (current < history.length - 1) {
      current++;
      state.value = cloneDeep(history[current]);
    }
  };
  const clear = () => {
    history = [];
    current = -1;
  };

  return { state, add, undo, redo, clear, history };
}

export default useHistoryStore;

interface Segment {
  start: number;
  end?: number;
  name: string;
  checked: boolean;
  tags?: any;
}
type SegmentWithRequiredEnd = Required<Pick<Segment, "end">> & Omit<Segment, "end">;

export const useSegmentStore = defineStore("segment", () => {
  const duration = ref(0);

  const rawCuts = ref<Segment[]>([]);
  const cuts = readonly(
    computed<SegmentWithRequiredEnd[]>(() => {
      return rawCuts.value.map((item: Segment) => {
        return {
          ...item,
          end: item.end || duration.value,
        };
      });
    }),
  );
  // const history = ref<Segment[][]>([]);
  const historyStore = useHistoryStore<Segment[]>({ limit: 30 });

  const recordHistory = () => {
    historyStore.add(rawCuts.value);
  };
  const clearHistory = () => {
    historyStore.clear();
  };
  const undo = () => {
    historyStore.undo();
    rawCuts.value = historyStore.state.value || [];
  };
  const redo = () => {
    historyStore.redo();
    rawCuts.value = historyStore.state.value || [];
  };

  const selectedCuts = computed(() => {
    return cuts.value.filter((item) => item.checked);
  });

  const init = (segments: Segment[]) => {
    rawCuts.value = segments;
    recordHistory();
  };
  const addSegment = (cut: Segment) => {
    rawCuts.value.push(cut);
    recordHistory();
  };
  const removeSegment = (index: number) => {
    rawCuts.value.splice(index, 1);
    recordHistory();
  };
  const updateSegment = <K extends keyof Segment>(index: number, key: K, value: Segment[K]) => {
    const cut = rawCuts.value[index];
    cut[key] = value;
    recordHistory();
  };
  const toggleSegment = (index: number) => {
    rawCuts.value[index].checked = !rawCuts.value[index].checked;
    recordHistory();
  };

  return {
    cuts,
    selectedCuts,
    duration,
    rawCuts,
    addSegment,
    removeSegment,
    updateSegment,
    toggleSegment,
    clearHistory,
    undo,
    redo,
    init,
  };
});
