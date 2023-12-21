<template>
  <div>
    <div class="user-info">
      <div v-if="userInfo.profile.face" class="avatar-container">
        <img
          :src="userInfo.profile.face"
          alt="user-avatar"
          referrerpolicy="no-referrer"
          class="user-avatar"
        />
        <span>{{ userInfo.profile.name }}</span>
        <n-button type="primary" @click="logout">退出登录</n-button>
        <n-button v-if="hasOldCookie" @click="migrateOldCookie">迁移旧版Cookie</n-button>
      </div>
      <div v-else class="login-btns">
        <n-button type="primary" @click="login">登录</n-button>
      </div>
    </div>
    <BiliLoginDialog v-model="loginTvDialogVisible" @close="getUserInfo"></BiliLoginDialog>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useUserInfoStore } from "@renderer/stores";
import BiliLoginDialog from "./components/BiliLoginDialog.vue";
import { useConfirm } from "@renderer/hooks";

const { getUserInfo } = useUserInfoStore();
const { userInfo } = storeToRefs(useUserInfoStore());

const logout = async () => {
  await window.api.bili.deleteCookie();
  getUserInfo();
};

const loginTvDialogVisible = ref(false);
const login = async () => {
  loginTvDialogVisible.value = true;
};

const hasOldCookie = ref(false);
const checkOldCookie = async () => {
  hasOldCookie.value = await window.api.bili.checkOldCookie();
};
checkOldCookie();

const confirm = useConfirm();
const migrateOldCookie = async () => {
  let status = await confirm.warning({
    content: "是否需要迁移旧数据？",
  });
  if (!status) return;

  status = await window.api.bili.checkOldCookie();
  if (!status) return;
  await window.api.bili.migrateCookie();
  hasOldCookie.value = false;
  getUserInfo();
};
</script>

<style scoped lang="less">
.avatar-container {
  display: flex;
  align-items: center;
  gap: 10px;
  .user-avatar {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    margin-right: 10px;
  }
}

.login-btns {
  display: inline-flex;
  gap: 10px;
}
</style>
