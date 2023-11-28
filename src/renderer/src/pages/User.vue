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
      <div v-else>
        <n-button type="primary" @click="login">登录</n-button>
      </div>
    </div>
    <BiliLoginDialog v-model="loginDialogVisible" :success="loginStatus" @close="getUserInfo">
    </BiliLoginDialog>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useUserInfoStore } from "../stores";
import BiliLoginDialog from "@renderer/components/BiliLoginDialog.vue";
import { useBili } from "@renderer/hooks";

const { getUserInfo } = useUserInfoStore();
const { userInfo } = storeToRefs(useUserInfoStore());
const { login, loginStatus, loginDialogVisible } = useBili();

const logout = async () => {
  await window.api.deleteBiliCookie();
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
</style>
