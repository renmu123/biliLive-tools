import { defineStore } from "pinia";

export const useUserInfoStore = defineStore("userInfo", () => {
  const userInfo = ref({
    profile: {
      face: "",
      name: "",
    },
  });

  async function getUserInfo() {
    const hasLogin = await window.api.checkBiliCookie();
    if (hasLogin) {
      const res = await window.biliApi.getMyInfo();
      userInfo.value = res.data as any;
    } else {
      userInfo.value = {
        profile: {
          face: "",
          name: "",
        },
      };
    }
  }

  getUserInfo();

  return { userInfo, getUserInfo };
});
