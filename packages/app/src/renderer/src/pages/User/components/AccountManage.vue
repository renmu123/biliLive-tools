<!-- bili切换用户弹框 -->
<template>
  <n-modal v-model:show="showModal" :mask-closable="false" auto-focus>
    <n-card
      style="width: calc(100% - 60px)"
      :bordered="false"
      size="huge"
      role="dialog"
      aria-modal="true"
      class="card"
    >
      <div class="content">
        <div class="container">
          <div
            v-for="item in userList"
            :key="item.uid"
            class="card"
            :class="{
              active: item.uid === userInfo.uid,
            }"
          >
            {{ item.name }}
            <img :src="item.face" alt="" referrerpolicy="no-referrer" class="face" />
            <n-popover placement="right-start" trigger="hover">
              <template #trigger>
                <n-icon size="25" class="pointer menu">
                  <EllipsisHorizontalOutline />
                </n-icon>
              </template>
              <div class="section" @click="logout(item.uid)">退出登录</div>
              <div v-if="item.uid === userInfo.uid" class="section">切换账号</div>
            </n-popover>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="footer">
          <n-button class="btn" @click="showModal = false"> 取消 </n-button>
          <n-button type="primary" class="btn" @click="confirm"> 确认 </n-button>
        </div>
      </template>
    </n-card>
  </n-modal>
</template>

<script setup lang="ts">
import { useUserInfoStore } from "@renderer/stores";
import { EllipsisHorizontalOutline } from "@vicons/ionicons5";

const { getUserInfo } = useUserInfoStore();
const { userList, userInfo } = storeToRefs(useUserInfoStore());

const showModal = defineModel<boolean>({ required: true, default: false });

const confirm = () => {
  showModal.value = false;
};

const logout = async (uid: number) => {
  await window.api.bili.deleteUser(uid);
  getUserInfo();
};
</script>

<style scoped lang="less">
.footer {
  text-align: right;
  .btn + .btn {
    margin-left: 10px;
  }
}

.container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
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
  padding: 10px;
  cursor: pointer;
  &:hover {
    background-color: #eee;
  }
}
</style>
