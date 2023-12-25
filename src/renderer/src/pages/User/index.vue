<template>
  <div>
    <div class="user-info">
      <div class="login-btns">
        <n-button type="primary" @click="login">登录账号</n-button>
        <n-button v-if="hasOldCookie" @click="migrateOldCookie">迁移旧版Cookie</n-button>
      </div>
    </div>
    <div class="container">
      <div
        v-for="item in userList"
        :key="item.uid"
        class="card"
        :class="{
          active: item.uid === userInfo.uid,
        }"
      >
        <span>{{ item.name }}</span>
        <img :src="item.face" alt="" referrerpolicy="no-referrer" class="face" />
        <n-popover placement="right-start" trigger="hover">
          <template #trigger>
            <n-icon size="25" class="pointer menu">
              <EllipsisHorizontalOutline />
            </n-icon>
          </template>
          <div style="padding: 5px 10px">uid: {{ item.uid }}</div>
          <div v-if="item.uid !== userInfo.uid" class="section" @click="changeAccount(item.uid)">
            使用
          </div>
          <div class="section" @click="updateAccountInfo(item.uid)">刷新信息</div>
          <div class="section" style="color: red" @click="logout(item.uid)">退出账号</div>
        </n-popover>
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
import { EllipsisHorizontalOutline } from "@vicons/ionicons5";

const { getUserInfo, changeUser } = useUserInfoStore();
const { userInfo, userList } = storeToRefs(useUserInfoStore());

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

const logout = async (uid: number) => {
  // TODO: 退出账号时，需要判断是否正在使用
  const status = await confirm.warning({
    content: "确认退出账号？",
  });
  if (!status) return;
  await window.api.bili.deleteUser(uid);
  getUserInfo();
};
const changeAccount = async (uid: number) => {
  changeUser(uid);
};

const updateAccountInfo = async (uid: number) => {
  await window.api.bili.updateUserInfo(uid);
  getUserInfo();
};
</script>

<style scoped lang="less">
.login-btns {
  display: inline-flex;
  gap: 10px;
}

.container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;
  .card {
    padding: 10px;
    width: 100px;
    border-radius: 10px;
    background-color: #fff;
    justify-content: center;
    align-items: center;
    border: 1px solid #eee;
    position: relative;
    display: flex;
    flex-direction: column;
    .face {
      width: 80%;
    }
    .menu {
      position: absolute;
      bottom: 0px;
      right: 5px;
    }
  }
  .card.active::before {
    content: "正在使用";
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    color: #fff;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 10px;
  }
}

.section {
  padding: 5px 10px;
  cursor: pointer;
  &:hover {
    background-color: #eee;
  }
}
</style>
