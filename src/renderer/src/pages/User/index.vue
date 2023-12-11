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
      </div>
      <div v-else class="login-btns">
        <n-button type="primary" @click="loginFirst">登录</n-button>
        <n-button type="primary" @click="login">备用登录</n-button>
      </div>
    </div>
    <BiliUpLoginDialog v-model="loginDialogVisible" :success="loginStatus" @close="getUserInfo">
    </BiliUpLoginDialog>
    <BiliLoginDialog v-model="loginTvDialogVisible" @close="getUserInfo"></BiliLoginDialog>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useUserInfoStore } from "@renderer/stores";
import BiliUpLoginDialog from "./components/BiliUpLoginDialog.vue";
import BiliLoginDialog from "./components/BiliLoginDialog.vue";
import { useBili } from "@renderer/hooks";

const { getUserInfo } = useUserInfoStore();
const { userInfo } = storeToRefs(useUserInfoStore());
const { login, loginStatus, loginDialogVisible } = useBili();

const logout = async () => {
  await window.api.bili.deleteCookie();
  getUserInfo();
};

const loginTvDialogVisible = ref(false);
const loginFirst = async () => {
  loginTvDialogVisible.value = true;
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
