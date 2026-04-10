<template>
  <div>
    <div class="user-info">
      <div class="login-btns">
        <n-button type="primary" @click="login">登录账号</n-button>
        <n-button @click="exportAllAccounts">导出所有账号</n-button>
        <n-button @click="triggerImportAll">导入所有账号</n-button>
        <n-button :disabled="!userInfo.uid" @click="exportCurrentAccount">导出账号</n-button>
        <n-button :disabled="!userInfo.uid" @click="triggerImportCurrent">导入账号</n-button>
        <input
          ref="singleImportInput"
          type="file"
          accept="application/json"
          style="display: none"
          @change="onImportSingleFileChange"
        />
        <input
          ref="allImportInput"
          type="file"
          accept="application/json"
          style="display: none"
          @change="onImportAllFileChange"
        />
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
        <div v-if="item.expiresText" class="expires">{{ item.expiresText }}</div>

        <span class="username">{{ item.name }}</span>
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
          <div class="section" @click="updateAuth(item.uid)">更新授权</div>
          <div class="section" @click="getCookie(item.uid)">复制cookie</div>
          <div class="section section-danger" @click="logout(item.uid)">退出账号</div>
        </n-popover>
      </div>
    </div>
    <BiliLoginDialog v-model="loginTvDialogVisible" @confirm="loginConfirm"></BiliLoginDialog>
  </div>
</template>

<script setup lang="ts">
import { userApi, taskApi } from "@renderer/apis";
import { useClipboard } from "@vueuse/core";
import type { BiliUser } from "@biliLive-tools/types";

import { useUserInfoStore, useAppConfig } from "@renderer/stores";
import BiliLoginDialog from "./components/BiliLoginDialog.vue";
import { useConfirm } from "@renderer/hooks";
import { EllipsisHorizontalOutline } from "@vicons/ionicons5";

defineOptions({
  name: "User",
});

const { getUsers, changeUser } = useUserInfoStore();
const { appConfig } = storeToRefs(useAppConfig());
const { userInfo, userList } = storeToRefs(useUserInfoStore());
const notice = useNotification();

const loginTvDialogVisible = ref(false);
const login = async () => {
  loginTvDialogVisible.value = true;
};

const confirm = useConfirm();

const logout = async (uid: number) => {
  const uids = [
    appConfig.value.webhook.uid,
    ...Object.values(appConfig.value.webhook.rooms).map((item) => item.uid),
  ];
  if (uids.includes(uid)) {
    const [status] = await confirm.warning({
      content: "当前帐号正在被webhook使用，是否确认退出？",
    });
    if (!status) return;
  } else {
    const [status] = await confirm.warning({
      content: "确认退出账号？",
    });
    if (!status) return;
  }

  await userApi.delete(uid);
  await getUsers();
  if (uid === userInfo.value.uid) {
    changeAccount(userList.value[0]?.uid);
  }
};
const changeAccount = async (uid: number) => {
  changeUser(uid);
};

const loginConfirm = async () => {
  await getUsers();
  if (!userInfo.value.uid) {
    changeAccount(userList.value[0]?.uid ?? "");
  }
};

const updateAccountInfo = async (uid: number) => {
  await userApi.refresh(uid);
  notice.success({
    title: "已获取最新数据",
    duration: 1000,
  });
  getUsers();
};
const updateAuth = async (uid: number) => {
  const tasks = (
    await taskApi.list({
      type: "bili",
    })
  ).list.filter((item) => item.status === "running");
  if (tasks.length) {
    const [status] = await confirm.warning({
      content: "当前有正在上传的任务，更新后可能会失败，是否确认更新？",
    });
    if (!status) return;
  }
  await userApi.updateAuth(uid);
  notice.success({
    title: "已更新授权",
    duration: 1000,
  });
  getUsers();
};

const { copy } = useClipboard({ legacy: true });
const singleImportInput = ref<HTMLInputElement | null>(null);
const allImportInput = ref<HTMLInputElement | null>(null);

const downloadJSON = (name: string, data: unknown) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const readJSONFile = async <T>(file: File): Promise<T> => {
  const text = await file.text();
  return JSON.parse(text) as T;
};

const exportCurrentAccount = async () => {
  if (!userInfo.value.uid) return;
  const user = await userApi.exportSingle(userInfo.value.uid);
  downloadJSON(`bili-user-${userInfo.value.uid}.json`, user);
  notice.success({
    title: "导出成功",
    duration: 1200,
  });
};

const exportAllAccounts = async () => {
  const users = await userApi.exportAll();
  downloadJSON("bili-users-all.json", users);
  notice.success({
    title: "导出成功",
    duration: 1200,
  });
};

const triggerImportCurrent = () => {
  singleImportInput.value?.click();
};

const triggerImportAll = () => {
  allImportInput.value?.click();
};

const onImportSingleFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  try {
    const user = await readJSONFile<BiliUser>(file);
    await userApi.importSingle(user);
    await getUsers();
    notice.success({
      title: "导入成功",
      duration: 1200,
    });
  } finally {
    input.value = "";
  }
};

const onImportAllFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  try {
    const users = await readJSONFile<BiliUser[]>(file);
    await userApi.importAll(users);
    await getUsers();
    notice.success({
      title: "导入成功",
      duration: 1200,
    });
  } finally {
    input.value = "";
  }
};

const getCookie = async (uid: number) => {
  const cookie = await userApi.getCookie(uid);
  await copy(cookie);

  notice.success({
    title: "已复制到剪切板",
    duration: 1000,
  });
};

onActivated(() => {
  getUsers();
});
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
    background-color: var(--bg-card);
    justify-content: center;
    align-items: center;
    border: 1px solid var(--border-primary);
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
      color: var(--text-secondary);
    }
  }
  .card.active {
    &::before {
      content: "正在使用";
      display: block;
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      color: var(--text-inverse);
      background-color: var(--bg-modal);
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: 10px;
    }
    .menu {
      color: #eee;
    }
  }
}

.section {
  padding: 5px 10px;
  cursor: pointer;
  &:hover {
    background-color: var(--bg-hover);
  }

  &.section-danger {
    color: var(--color-danger-text);
  }
}
.expires {
  z-index: 1000;
  position: absolute;
  bottom: 0;
  left: 0;
  background: var(--color-success);
  color: var(--text-inverse);
  padding: 4px 6px;
  border-radius: 0 10px 0 10px;
  font-size: 10px;
}
.username {
  color: var(--text-primary);
}
</style>
