import { cloneDeep } from "lodash-es";
import { defineStore, storeToRefs } from "pinia";
import { DanmuPreset, BiliupPreset, AppConfig } from "../../../types";
import { TaskType } from "../../../types/enum";

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
      name?: string;
      face?: string;
    }[]
  >([]);

  async function getUserInfo() {
    await appConfigStore.getAppConfig();
    const uid = appConfigStore.appConfig.uid;
    const users = await window.api.bili.readUserList();
    userList.value = users.map((item) => {
      return {
        uid: item.mid,
        name: item.name,
        face: item.avatar,
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
    danmuPresets.value = await window.api.danmu.getPresets();
  }
  async function getDanmuPreset() {
    danmuPreset.value = await window.api.danmu.getPreset(danmuPresetId.value);
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

interface Task {
  taskId: string;
  name: string;
  status: "pending" | "running" | "paused" | "completed" | "error";
  type: TaskType;
  output?: any;
  progress: number;
  action: ("pause" | "kill" | "interrupt")[];
  startTime?: number;
  endTime?: number;
}

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
    (data: any) => {
      console.log(appConfig.value.saveConfig, data, appConfig.value);
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
