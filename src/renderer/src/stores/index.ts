import { defineStore } from "pinia";
import { DanmuPreset, BiliupPreset, AppConfig } from "../../../types";

export const useUserInfoStore = defineStore("userInfo", () => {
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
      userInfo.value = {
        uid: userList.value[0].uid,
        profile: {
          face: userList.value[0].face,
          name: userList.value[0].name,
        },
      };
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
    }
  }

  getUserInfo();

  return { userInfo, getUserInfo, userList, changeUser };
});

export const useDanmuPreset = defineStore("danmuPreset", () => {
  const danmuPresetId = ref("default");
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

export const useQueueStore = defineStore("queue", () => {
  const runningTaskNum = ref(0);

  return {
    runningTaskNum,
  };
});

export const useAppConfig = defineStore("appConfig", () => {
  // @ts-ignore
  const appConfig = ref<AppConfig>({});

  async function getAppConfig() {
    appConfig.value = await window.api.config.getAll();
  }
  async function set(key: string, value: any) {
    await window.api.config.set(key, value);
    appConfig.value[key] = value;
  }

  getAppConfig();

  return {
    appConfig,
    getAppConfig,
    set,
  };
});
