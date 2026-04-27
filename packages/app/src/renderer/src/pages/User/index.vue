<template>
  <div>
    <div class="user-info">
      <div class="login-btns">
        <n-button type="primary" @click="login">登录账号</n-button>
        <n-button @click="exportAllAccounts">导出用户</n-button>
        <n-button @click="triggerImportAll">导入用户</n-button>
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
          <div class="section" @click="exportCurrentAccount(item.uid)">导出</div>
          <div class="section section-danger" @click="logout(item.uid)">退出账号</div>
        </n-popover>
      </div>
    </div>
    <BiliLoginDialog v-model="loginTvDialogVisible" @confirm="loginConfirm"></BiliLoginDialog>
  </div>
</template>

<script setup lang="ts">
import { userApi, taskApi } from "@renderer/apis";
import { verifyBiliKey } from "@renderer/utils";
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
  const [status] = await confirm.warning({
    content: [
      "程序请求与浏览器内正常使用所发送的请求不完全一致，能通过分析请求日志识别出来。",
      "软件开发者不对账号发生的任何事情负责，包括并不限于被标记为机器人账号、无法参与各种抽奖和活动等。",
      "如您知晓您的账号会因以上所列出来的部分原因所导致无法使用或权益受损等情况，并愿意承担由此所会带来的一系列后果，请继续以下的操作，软件开发者不会对您账号所发生的任何后果承担责任。",
    ]
      .filter(Boolean)
      .join("\n"),
    positiveText: "继续登录",
    negativeText: "取消",
  });
  if (!status) return;

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
const allImportInput = ref<HTMLInputElement | null>(null);

const showBiliKeyBlockedNotice = (reason: "missing" | "mismatch" | "error" | "cancelled") => {
  if (reason === "missing") {
    notice.error({
      title: "未配置 BILILIVE_TOOLS_BILIKEY，当前操作已拦截",
      duration: 1600,
    });
    return;
  }
  if (reason === "mismatch") {
    notice.error({
      title: "密钥错误，当前操作已拦截",
      duration: 1600,
    });
    return;
  }
  if (reason === "error") {
    notice.error({
      title: "校验服务异常，当前操作已拦截",
      duration: 1600,
    });
    return;
  }
  notice.warning({
    title: "已取消校验，当前操作已拦截",
    duration: 1200,
  });
};

const downloadJSON = async (name: string, data: unknown): Promise<boolean> => {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
};

const readJSONFile = async <T,>(file: File): Promise<T> => {
  const text = await file.text();
  return JSON.parse(text) as T;
};

const isBiliUser = (value: unknown): value is BiliUser => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const user = value as {
    mid?: unknown;
    accessToken?: unknown;
    refreshToken?: unknown;
    cookie?: unknown;
  };

  return (
    typeof user.mid === "number" &&
    typeof user.accessToken === "string" &&
    typeof user.refreshToken === "string" &&
    !!user.cookie &&
    typeof user.cookie === "object"
  );
};

const exportCurrentAccount = async (uid: number) => {
  const isVerified = await verifyBiliKey({
    onBlocked: showBiliKeyBlockedNotice,
  });
  if (!isVerified) return;

  const user = await userApi.exportSingle(uid);
  const isExported = await downloadJSON(`bili-user-${uid}.json`, user);
  if (!isExported) return;
  notice.success({
    title: "导出成功",
    duration: 1200,
  });
};

const exportAllAccounts = async () => {
  const isVerified = await verifyBiliKey({
    onBlocked: showBiliKeyBlockedNotice,
  });
  if (!isVerified) return;

  const users = await userApi.exportAll();
  const isExported = await downloadJSON("bili-users-all.json", users);
  if (!isExported) return;
  notice.success({
    title: "导出成功",
    duration: 1200,
  });
};

const triggerImportAll = () => {
  allImportInput.value?.click();
};

const onImportAllFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  try {
    const payload = await readJSONFile<unknown>(file);

    if (Array.isArray(payload)) {
      if (!payload.every(isBiliUser)) {
        throw new Error("invalid user list payload");
      }
      await userApi.importAll(payload);
    } else if (isBiliUser(payload)) {
      await userApi.importSingle(payload);
    } else {
      throw new Error("invalid user payload");
    }

    await getUsers();
    notice.success({
      title: "导入成功",
      duration: 1200,
    });
  } catch {
    notice.error({
      title: "导入失败，文件格式错误",
      duration: 1600,
    });
  } finally {
    input.value = "";
  }
};

const getCookie = async (uid: number) => {
  const isVerified = await verifyBiliKey({
    onBlocked: showBiliKeyBlockedNotice,
  });
  if (!isVerified) return;

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
      color: #ffffff;
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
