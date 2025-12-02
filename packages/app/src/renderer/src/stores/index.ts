import { cloneDeep, isArray } from "lodash-es";
import { v4 as uuid } from "uuid";
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

  watch(
    danmuPresetId,
    (newVal) => {
      newVal && getDanmuPreset();
    },
    {
      immediate: true,
    },
  );

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
        targetPath: "",
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
      flvRepair: {
        type: "bililive",
        saveRadio: 1,
        savePath: "",
      },
      download: {
        savePath: "",
        danmu: "none",
        douyuResolution: "highest",
        override: false,
        onlyAudio: false,
        onlyDanmu: false,
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

export interface Segment {
  id: string;
  start: number;
  end: number;
  name: string;
  checked: boolean;
  tags?: any;
  index: number;
}

type SegmentEventType = "add" | "remove" | "update" | "clear";
type SegmentEventCallback = (data: {
  type: SegmentEventType;
  segment?: Segment;
  id?: string;
}) => void;

export const useSegmentStore = defineStore("segment", () => {
  const duration = ref(0);

  const rawCuts = ref<Segment[]>([]);
  const historyStore = useHistoryStore<Segment[]>({ limit: 30 });

  const index = ref(0);

  // 事件监听器
  const eventListeners: SegmentEventCallback[] = [];

  // 添加事件监听器
  const on = (callback: SegmentEventCallback) => {
    eventListeners.push(callback);
  };

  // 移除事件监听器
  const off = (callback: SegmentEventCallback) => {
    const idx = eventListeners.indexOf(callback);
    if (idx > -1) {
      eventListeners.splice(idx, 1);
    }
  };

  // 触发事件
  const emit = (type: SegmentEventType, data?: { segment?: Segment; id?: string }) => {
    eventListeners.forEach((callback) => {
      callback({ type, ...data });
    });
  };

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
    return rawCuts.value.filter((item) => item.checked);
  });

  const init = (segments: Omit<Segment, "id">[]) => {
    rawCuts.value = [];
    index.value = 0; // 初始化 index
    segments.forEach((segment) => {
      addSegment(segment);
    });
  };
  const addSegment = (cut: Omit<Segment, "id">) => {
    const data = {
      id: uuid(),
      ...cut,
      index: index.value, // 新增 index 字段
    };
    rawCuts.value.push(data);
    index.value++;
    recordHistory();
    emit("add", { segment: data });
  };
  const removeSegment = (id: string) => {
    const idx = rawCuts.value.findIndex((item) => item.id === id);
    if (idx !== -1) {
      rawCuts.value.splice(idx, 1);
      recordHistory();
      emit("remove", { id });
    }
  };
  const updateSegment = (id: string, options: Partial<Omit<Segment, "id">>) => {
    const cut = rawCuts.value.find((item) => item.id === id);
    if (cut) {
      Object.assign(cut, options);
      recordHistory();
      emit("update", { segment: cut });
    }
  };
  const toggleSegment = (id: string) => {
    const cut = rawCuts.value.find((item) => item.id === id);
    if (cut) {
      cut.checked = !cut.checked;
      emit("update", { segment: cut });
      recordHistory();
    }
  };
  const clear = () => {
    rawCuts.value = [];
    index.value = 0; // 清空时初始化 index
    recordHistory();
    emit("clear");
  };

  return {
    cuts: rawCuts,
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
    clear,
    on,
    off,
    index,
  };
});
