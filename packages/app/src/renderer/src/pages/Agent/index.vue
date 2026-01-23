<template>
  <div class="agent-page">
    <n-card title="AI 智能助手" :bordered="false">
      <template #header-extra>
        <n-space>
          <n-tag v-if="sessionId" type="success" size="small">
            <template #icon>
              <n-icon :component="CheckmarkCircle" />
            </template>
            会话已连接
          </n-tag>
          <n-tag v-else type="warning" size="small">
            <template #icon>
              <n-icon :component="AlertCircle" />
            </template>
            未连接
          </n-tag>
          <n-button v-if="sessionId" size="small" secondary type="warning" @click="handleReset">
            重置会话
          </n-button>
          <n-button size="small" secondary @click="handleNewSession"> 新建会话 </n-button>
        </n-space>
      </template>

      <div class="chat-container">
        <!-- 消息列表 -->
        <div class="message-list" ref="messageListRef">
          <n-empty
            v-if="messages.length === 0"
            description="开始对话，我可以帮您添加录制器、上传视频等操作"
          >
            <template #icon>
              <n-icon size="60" :component="ChatbubbleEllipses" />
            </template>
            <template #extra>
              <n-space vertical>
                <n-text depth="3">试试这些命令：</n-text>
                <n-space>
                  <n-button
                    size="small"
                    secondary
                    @click="handleQuickCommand('帮我添加一个录制器')"
                  >
                    添加录制器
                  </n-button>
                  <n-button size="small" secondary @click="handleQuickCommand('上传视频到B站')">
                    上传视频
                  </n-button>
                </n-space>
              </n-space>
            </template>
          </n-empty>

          <div v-for="(msg, index) in messages" :key="index" class="message-item">
            <div :class="['message-bubble', msg.role]">
              <div class="message-header">
                <n-avatar v-if="msg.role === 'user'" size="small" :src="userAvatar" round />
                <n-avatar v-else size="small" round color="#18a058">
                  <n-icon :component="Sparkles" />
                </n-avatar>
                <n-text :depth="3" style="margin-left: 8px">
                  {{ msg.role === "user" ? "我" : "AI 助手" }}
                </n-text>
                <n-text :depth="3" style="margin-left: auto; font-size: 12px">
                  {{ formatTime(msg.timestamp) }}
                </n-text>
              </div>
              <div class="message-content">
                <n-text>{{ msg.content }}</n-text>
              </div>

              <!-- 状态标签 -->
              <div v-if="msg.role === 'assistant' && msg.state" class="message-state">
                <n-tag size="small" :type="getStateType(msg.state)" :bordered="false">
                  {{ getStateLabel(msg.state) }}
                </n-tag>
              </div>

              <!-- 数据展示 -->
              <div v-if="msg.data" class="message-data">
                <n-collapse>
                  <n-collapse-item title="详细信息" name="data">
                    <pre>{{ JSON.stringify(msg.data, null, 2) }}</pre>
                  </n-collapse-item>
                </n-collapse>
              </div>
            </div>
          </div>

          <!-- 加载中 -->
          <div v-if="loading" class="message-item">
            <div class="message-bubble assistant">
              <div class="message-header">
                <n-avatar size="small" round color="#18a058">
                  <n-icon :component="Sparkles" />
                </n-avatar>
                <n-text :depth="3" style="margin-left: 8px">AI 助手</n-text>
              </div>
              <div class="message-content">
                <n-space>
                  <n-spin size="small" />
                  <n-text depth="3">思考中...</n-text>
                </n-space>
              </div>
            </div>
          </div>
        </div>

        <!-- 输入框 -->
        <div class="input-area">
          <n-input
            v-model:value="inputMessage"
            type="textarea"
            placeholder="输入您的指令，例如：帮我添加录制器 https://live.bilibili.com/123456"
            :autosize="{ minRows: 2, maxRows: 4 }"
            :disabled="loading"
            @keydown.enter.exact.prevent="handleSend"
          >
            <template #suffix>
              <n-tooltip trigger="hover">
                <template #trigger>
                  <n-icon :component="InformationCircle" />
                </template>
                按 Enter 发送，Shift+Enter 换行
              </n-tooltip>
            </template>
          </n-input>
          <n-space style="margin-top: 12px" justify="space-between">
            <n-space>
              <n-text depth="3" style="font-size: 12px">
                技能：{{ skills.join("、") || "加载中..." }}
              </n-text>
            </n-space>
            <n-space>
              <n-button
                secondary
                size="small"
                @click="handleReloadSkills"
                :loading="reloadingSkills"
              >
                重新加载技能
              </n-button>
              <n-button
                type="primary"
                :disabled="!inputMessage.trim() || loading"
                :loading="loading"
                @click="handleSend"
              >
                <template #icon>
                  <n-icon :component="Send" />
                </template>
                发送
              </n-button>
            </n-space>
          </n-space>
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: "Agent",
});

import { ref, computed, onMounted, nextTick } from "vue";
import { useMessage } from "naive-ui";
import {
  CheckmarkCircle,
  AlertCircle,
  ChatbubbleEllipses,
  Sparkles,
  Send,
  InformationCircle,
} from "@vicons/ionicons5";
import { agentApi } from "@renderer/apis";
import type { AgentChatMessage, AgentResponse } from "@renderer/apis/agent";

import defaultUserAvatar from "../../assets/images/moehime.jpg";

const message = useMessage();

// 会话状态
const sessionId = ref<string>("");
const loading = ref(false);
const reloadingSkills = ref(false);

// 消息列表
interface MessageItem extends AgentChatMessage {
  state?: string;
  action?: string;
  data?: any;
}

const messages = ref<MessageItem[]>([]);
const inputMessage = ref("");
const messageListRef = ref<HTMLElement>();

// 技能列表
const skills = ref<string[]>([]);

// 用户头像
const userAvatar = computed(() => {
  return defaultUserAvatar;
});

// 创建新会话
const handleNewSession = async () => {
  try {
    loading.value = true;
    const result = await agentApi.createSession();
    sessionId.value = result.sessionId;
    messages.value = [];
    message.success("会话创建成功");
  } catch (error: any) {
    message.error(`创建会话失败：${error.message || "未知错误"}`);
  } finally {
    loading.value = false;
  }
};

// 重置会话
const handleReset = async () => {
  if (!sessionId.value) return;

  try {
    loading.value = true;
    await agentApi.resetSession(sessionId.value);
    messages.value = [];
    message.success("会话已重置");
  } catch (error: any) {
    message.error(`重置会话失败：${error.message || "未知错误"}`);
  } finally {
    loading.value = false;
  }
};

// 发送消息
const handleSend = async () => {
  if (!inputMessage.value.trim() || loading.value) return;

  // 如果没有会话，先创建
  if (!sessionId.value) {
    await handleNewSession();
    if (!sessionId.value) return;
  }

  const userMessage = inputMessage.value.trim();
  inputMessage.value = "";

  // 添加用户消息
  messages.value.push({
    role: "user",
    content: userMessage,
    timestamp: Date.now(),
  });

  // 滚动到底部
  scrollToBottom();

  try {
    loading.value = true;
    const response = await agentApi.chat(sessionId.value, userMessage);

    // 添加助手回复
    messages.value.push({
      role: "assistant",
      content: response.message,
      timestamp: Date.now(),
      state: response.state,
      action: response.action,
      data: response.data,
    });

    // 滚动到底部
    scrollToBottom();
  } catch (error: any) {
    message.error(`发送失败：${error.message || "未知错误"}`);
    messages.value.push({
      role: "assistant",
      content: `抱歉，处理您的请求时出现错误：${error.message || "未知错误"}`,
      timestamp: Date.now(),
      state: "error",
    });
  } finally {
    loading.value = false;
  }
};

// 快捷命令
const handleQuickCommand = (command: string) => {
  inputMessage.value = command;
  handleSend();
};

// 加载技能列表
const loadSkills = async () => {
  try {
    const result = await agentApi.getSkills();
    skills.value = result.skills;
  } catch (error: any) {
    console.error("Failed to load skills:", error);
  }
};

// 重新加载技能
const handleReloadSkills = async () => {
  try {
    reloadingSkills.value = true;
    await agentApi.reloadSkills();
    await loadSkills();
    message.success("技能已重新加载");
  } catch (error: any) {
    message.error(`重新加载失败：${error.message || "未知错误"}`);
  } finally {
    reloadingSkills.value = false;
  }
};

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight;
    }
  });
};

// 格式化时间
const formatTime = (timestamp?: number) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

// 获取状态类型
const getStateType = (state: string) => {
  const types: Record<string, any> = {
    idle: "default",
    identifying_intent: "info",
    collecting_params: "warning",
    confirming: "warning",
    executing: "info",
    completed: "success",
    error: "error",
  };
  return types[state] || "default";
};

// 获取状态标签
const getStateLabel = (state: string) => {
  const labels: Record<string, string> = {
    idle: "空闲",
    identifying_intent: "识别意图中",
    collecting_params: "收集参数中",
    confirming: "等待确认",
    executing: "执行中",
    completed: "已完成",
    error: "错误",
  };
  return labels[state] || state;
};

// 初始化
onMounted(async () => {
  await loadSkills();
  // 自动创建会话
  await handleNewSession();
});
</script>

<style scoped lang="less">
.agent-page {
  height: 100%;
  padding: 16px;
  overflow: hidden;

  .n-card {
    height: 100%;
    display: flex;
    flex-direction: column;

    :deep(.n-card__content) {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 0;
      overflow: hidden;
    }
  }

  @media (max-width: 768px) {
    padding: 8px;
  }
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: #d0d0d0;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  @media (max-width: 768px) {
    padding: 8px;
    gap: 12px;
  }
}

.message-item {
  display: flex;
  flex-direction: column;
  animation: fadeIn 0.3s ease-in;

  &:last-child {
    margin-bottom: 8px;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-bubble {
  max-width: 80%;
  padding: 12px 16px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  &.user {
    align-self: flex-end;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;

    .message-header {
      color: rgba(255, 255, 255, 0.9);
    }
  }

  &.assistant {
    align-self: flex-start;
    background: #f5f5f5;
    color: #333;
  }

  @media (max-width: 768px) {
    max-width: 90%;
    padding: 10px 12px;
    font-size: 14px;
  }
}

.message-header {
  display: flex;
  align-items: center;
  font-size: 13px;
  opacity: 0.8;

  @media (max-width: 768px) {
    font-size: 12px;
  }
}

.message-content {
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-state {
  margin-top: 4px;
}

.message-data {
  margin-top: 8px;

  pre {
    background: rgba(0, 0, 0, 0.05);
    padding: 8px;
    border-radius: 4px;
    font-size: 12px;
    overflow-x: auto;
  }
}

.input-area {
  padding: 16px;
  border-top: 1px solid #e0e0e0;
  background: white;

  @media (max-width: 768px) {
    padding: 12px;
  }
}
</style>
