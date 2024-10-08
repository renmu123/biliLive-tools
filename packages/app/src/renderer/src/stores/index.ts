import { cloneDeep } from "lodash-es";
import { defineStore, storeToRefs } from "pinia";
import { DanmuPreset, BiliupPreset, AppConfig } from "@biliLive-tools/types";
import { getUserList } from "@renderer/apis/user";
import { danmuPresetApi } from "@renderer/apis";

import type { Task } from "@renderer/types";

export const useUserInfoStore = defineStore("userInfo", () => {
  const appConfigStore = useAppConfig();

  const userInfo = ref<{
    uid: number;
    profile: {
      face?: string;
      name?: string;
    };
  }>({
    uid: 0,
    profile: {
      face: "",
      name: "",
    },
  });
  const userList = ref<
    {
      uid: number;
      expires: number;
      name?: string;
      face?: string;
      expiresText?: string;
    }[]
  >([]);

  const calcExpireTime = (user: { uid: number; expires: number; name?: string; face?: string }) => {
    const date = new Date();
    if (user.expires) {
      const expireTime = new Date(user.expires * 1000);
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

  async function getUserInfo() {
    await appConfigStore.getAppConfig();
    const uid = appConfigStore.appConfig.uid;
    userList.value = await getUserList();
    userList.value = userList.value.map((item) => {
      return {
        ...item,
        expiresText: calcExpireTime(item),
      };
    });

    if (userList.value.length === 0) {
      userInfo.value = {
        uid: 0,
        profile: {
          face: "",
          name: "",
        },
      };
    } else {
      if (!uid) {
        userInfo.value = {
          uid: userList.value[0].uid,
          profile: {
            face: userList.value[0].face,
            name: userList.value[0].name,
          },
        };
        appConfigStore.set("uid", userList.value[0].uid);
      } else {
        const user = userList.value.find((item) => item.uid === uid);
        if (user) {
          userInfo.value = {
            uid: user.uid,
            profile: {
              face: user.face,
              name: user.name,
            },
          };
        }
      }
    }
  }

  function changeUser(uid: number) {
    const user = userList.value.find((item) => item.uid === uid);
    if (user) {
      userInfo.value = {
        uid: user.uid,
        profile: {
          face: user.face,
          name: user.name,
        },
      };
      appConfigStore.set("uid", uid);
    }
  }

  getUserInfo();

  return { userInfo, getUserInfo, userList, changeUser };
});

export const useDanmuPreset = defineStore("danmuPreset", () => {
  const { appConfig } = storeToRefs(useAppConfig());

  const danmuPresetId = toRef(appConfig.value.tool.danmu, "danmuPresetId");
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
    () => {
      getDanmuPreset();
    },
    { immediate: true },
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
    options.value = await window.api.ffmpeg.getPresetOptions();
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
    uploadPresets.value = await window.api.bili.getPresets();
  }
  async function getUploadPreset() {
    uploadPreset.value = await window.api.bili.getPreset(upladPresetId.value);
  }

  const uploaPresetsOptions = computed(() => {
    return uploadPresets.value.map((item) => {
      return {
        label: item.name,
        value: item.id,
      };
    });
  });

  watch(
    upladPresetId,
    () => {
      getUploadPreset();
    },
    { immediate: true },
  );

  getUploadPresets();

  return {
    uploadPresets,
    getUploadPresets,
    uploaPresetsOptions,
    upladPresetId,
    uploadPreset,
    getUploadPreset,
  };
});

export const useQueueStore = defineStore("queue", () => {
  const runningTaskNum = ref(0);
  const queue = ref<Task[]>([]);

  const getQuenu = async () => {
    // queue.value = [
    //   {
    //     taskId: "1",
    //     name: "tesqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqwwwwwwwwwwwwwwwwwwwwwwwwt",
    //     status: "pending",
    //     type: "ffmpeg",
    //     progress: 0,
    //     action: ["pause", "kill"],
    //   },
    //   {
    //     taskId: "2",
    //     name: "test2",
    //     status: "running",
    //     type: "ffmpeg",
    //     progress: 50,
    //     action: ["pause", "kill"],
    //     startTime: 1701682795887,
    //   },
    //   {
    //     taskId: "3",
    //     name: "test3",
    //     status: "paused",
    //     type: "ffmpeg",
    //     progress: 50,
    //     action: ["pause", "kill"],
    //     startTime: 1701682795887,
    //   },
    //   {
    //     taskId: "4",
    //     name: "test4",
    //     status: "completed",
    //     type: "ffmpeg",
    //     output: "D:/test.mp4",
    //     progress: 100,
    //     action: ["pause", "kill"],
    //     startTime: 1701682795887,
    //     endTime: 1701682995887,
    //   },
    //   {
    //     taskId: "5",
    //     name: "test5",
    //     status: "error",
    //     type: "ffmpeg",
    //     progress: 50,
    //     action: ["pause", "kill"],
    //   },
    // ];
    queue.value = (await window.api.task.list()).toReversed();
    runningTaskNum.value = queue.value.filter((item) => item.status === "running").length;
  };

  return {
    runningTaskNum,
    getQuenu,
    queue,
  };
});

export const useAppConfig = defineStore("appConfig", () => {
  // @ts-ignore
  const appConfig = ref<AppConfig>({});

  async function getAppConfig() {
    console.log("getAppConfig");
    appConfig.value = await window.api.config.getAll();
  }
  async function set<K extends keyof AppConfig>(key: K, value: AppConfig[K]) {
    await window.api.config.set(key, value);
    appConfig.value[key] = value;
  }
  watch(
    () => appConfig.value.tool,
    (newVal, oldVal) => {
      if (!oldVal) return;
      if (JSON.stringify(newVal) === JSON.stringify(oldVal)) return;

      window.api.config.save(cloneDeep(appConfig.value));
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
