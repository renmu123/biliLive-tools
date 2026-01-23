<template>
  <div class="agent-page">
    <n-card title="AI 智能助手-测试版" :bordered="false">
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
        <!-- 拖拽提示遮罩 -->
        <div v-if="isDragging" class="drag-overlay">
          <div class="drag-hint">
            <n-icon :component="CloudUpload" size="48" />
            <n-text style="margin-top: 16px; font-size: 18px">释放文件以添加附件</n-text>
          </div>
        </div>

        <!-- 消息列表 -->
        <div
          class="message-list"
          ref="messageListRef"
          @dragenter.prevent="handleDragEnter"
          @dragover.prevent="handleDragOver"
          @dragleave.prevent="handleDragLeave"
          @drop.prevent="handleDrop"
        >
          <n-empty
            v-if="messages.length === 0"
            description="开始对话，我可以帮您添加录制器、上传视频等操作"
          >
            <template #icon>
              <n-icon size="40"><ChatbubbleEllipses></ChatbubbleEllipses></n-icon>
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
                    添加录制直播间
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
              <!-- <div class="message-header">
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
              </div> -->
              <div class="message-content">
                <n-text>{{ msg.content }}</n-text>
              </div>

              <!-- 文件选择器 -->
              <div
                v-if="
                  msg.role === 'assistant' && msg.action === 'input_required' && isFileParam(msg)
                "
                class="file-input-area"
              >
                <n-button
                  v-if="!msg.isOperated"
                  size="small"
                  secondary
                  @click="handleSelectFile(msg)"
                >
                  <template #icon>
                    <n-icon :component="FolderOpen" />
                  </template>
                  选择文件
                </n-button>
                <n-text v-if="msg.selectedFile" depth="3" style="margin-left: 8px; font-size: 12px">
                  {{ msg.selectedFile }}
                </n-text>
                <n-tag v-if="msg.isOperated && !msg.selectedFile" size="small" type="default">
                  已操作
                </n-tag>
              </div>

              <!-- 状态标签或确认按钮 -->
              <div v-if="msg.role === 'assistant' && msg.state" class="message-state">
                <!-- 等待确认状态：显示按钮 -->
                <div v-if="msg.state === 'confirming'" class="confirm-buttons">
                  <n-space v-if="!msg.isOperated">
                    <n-button
                      type="success"
                      size="small"
                      :disabled="loading"
                      @click="handleConfirm(true, msg)"
                    >
                      <template #icon>
                        <n-icon :component="Checkmark" />
                      </template>
                      确认
                    </n-button>
                    <n-button
                      type="error"
                      size="small"
                      secondary
                      :disabled="loading"
                      @click="handleConfirm(false, msg)"
                    >
                      <template #icon>
                        <n-icon :component="CloseOutline" />
                      </template>
                      取消
                    </n-button>
                  </n-space>
                  <n-tag v-else size="small" type="default" :bordered="false"> 已操作 </n-tag>
                </div>
                <!-- 其他状态：显示标签 -->
                <n-tag v-else size="small" :type="getStateType(msg.state)" :bordered="false">
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
          <!-- 附件预览 -->
          <div v-if="attachedFiles.length > 0" class="attached-files">
            <n-space :size="8">
              <div v-for="(file, index) in attachedFiles" :key="index" class="attached-file-item">
                <n-icon :component="Document" size="16" />
                <n-text style="margin: 0 8px; font-size: 12px">{{ file.name }}</n-text>
                <n-button text size="tiny" @click="removeAttachedFile(index)" style="padding: 0">
                  <n-icon :component="Close" size="14" />
                </n-button>
              </div>
            </n-space>
          </div>

          <n-input
            v-model:value="inputMessage"
            type="textarea"
            placeholder="输入您的指令，例如：帮我添加直播间。单个指令完成后推荐重置会话"
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
              <n-tooltip trigger="hover">
                <template #trigger>
                  <n-tag size="small" type="info" :bordered="false">
                    {{ skills.length }} 个可用技能
                  </n-tag>
                </template>
                <div style="max-width: 400px">
                  <div v-if="skills.length > 0">
                    <div
                      v-for="(skill, index) in skills"
                      :key="index"
                      style="padding: 4px 0; border-bottom: 1px solid #f0f0f0; margin-bottom: 4px"
                      :style="{
                        borderBottom: index === skills.length - 1 ? 'none' : '1px solid #f0f0f0',
                      }"
                    >
                      <n-text strong>{{ skill.showName }}</n-text>
                      <n-text depth="3" style="font-size: 12px; display: block; margin-top: 2px">{{
                        skill.description
                      }}</n-text>
                    </div>
                  </div>
                  <div v-else>加载中...</div>
                </div>
              </n-tooltip>
            </n-space>
            <n-space>
              <n-button secondary :disabled="loading" @click="handleAttachFile">
                <template #icon>
                  <n-icon :component="Attach" />
                </template>
                附件
              </n-button>
              <n-button
                type="primary"
                :disabled="(!inputMessage.trim() && attachedFiles.length === 0) || loading"
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
  FolderOpen,
  Attach,
  Document,
  Close,
  CloudUpload,
  Checkmark,
  CloseOutline,
} from "@vicons/ionicons5";
import { agentApi } from "@renderer/apis";
import type { AgentChatMessage, AgentResponse } from "@renderer/apis/agent";
import { showFileDialog } from "@renderer/utils/fileSystem";
import { cloneDeep } from "lodash-es";

import defaultUserAvatar from "../../assets/images/moehime.jpg";

const message = useMessage();

// 会话状态
const sessionId = ref<string>("");
const loading = ref(false);

// 消息列表
interface MessageItem extends AgentChatMessage {
  state?: string;
  action?: string;
  data?: any;
  selectedFile?: string;
  isOperated?: boolean; // 标记是否已操作
}

const messages = ref<MessageItem[]>([]);
const inputMessage = ref("");
const messageListRef = ref<HTMLElement>();

// 附件相关
interface AttachedFile {
  name: string;
  path: string;
}
const attachedFiles = ref<AttachedFile[]>([]);

// 拖拽相关
const isDragging = ref(false);
let dragCounter = 0;

// 技能列表
interface SkillInfo {
  name: string;
  showName: string;
  description: string;
}
const skills = ref<SkillInfo[]>([]);

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
  if ((!inputMessage.value.trim() && attachedFiles.value.length === 0) || loading.value) return;

  // 如果没有会话，先创建
  if (!sessionId.value) {
    await handleNewSession();
    if (!sessionId.value) return;
  }

  let userMessage = inputMessage.value.trim();

  // 如果有附件，将文件路径添加到消息中
  if (attachedFiles.value.length > 0) {
    const filePaths = attachedFiles.value.map((f) => f.path).join("\n");
    userMessage = userMessage ? `${userMessage}\n\n附件：\n${filePaths}` : filePaths;
  }

  inputMessage.value = "";
  attachedFiles.value = [];

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

// 处理确认
const handleConfirm = async (confirmed: boolean, msg: MessageItem) => {
  if (msg.isOperated) return; // 防止重复操作

  msg.isOperated = true; // 标记为已操作
  const confirmMessage = confirmed ? "确认" : "取消";
  inputMessage.value = confirmMessage;
  await handleSend();
};

// 判断是否为文件参数
const isFileParam = (msg: MessageItem) => {
  return msg.data?.paramSchema?.format === "file-path";
};

// 处理文件选择
const handleSelectFile = async (msg: MessageItem) => {
  if (msg.isOperated) return; // 防止重复操作

  const paramSchema = cloneDeep(msg.data?.paramSchema);
  const fileOptions = paramSchema?.fileOptions || {};

  try {
    console.log("Opening file dialog with options:", fileOptions);
    const files = await showFileDialog({
      extensions: fileOptions.extensions || ["*"],
      multi: fileOptions.multi || false,
    });
    console.log("Selected files:", files);
    if (files && files.length > 0) {
      const filePath = files[0];
      // 保存选择的文件路径到消息中（用于显示）
      msg.selectedFile = filePath;
      msg.isOperated = true; // 标记为已操作
      // 自动填充到输入框并发送
      inputMessage.value = filePath;
      await handleSend();
    }
  } catch (error: any) {
    message.error(`选择文件失败：${error.message || "未知错误"}`);
  }
};

// 处理附件选择
const handleAttachFile = async () => {
  try {
    const files = await showFileDialog({
      extensions: ["*"],
      multi: true,
    });

    if (files && files.length > 0) {
      files.forEach((filePath) => {
        const fileName = filePath.split(/[\\\/]/).pop() || filePath;
        attachedFiles.value.push({
          name: fileName,
          path: filePath,
        });
      });
    }
  } catch (error: any) {
    message.error(`选择文件失败：${error.message || "未知错误"}`);
  }
};

// 移除附件
const removeAttachedFile = (index: number) => {
  attachedFiles.value.splice(index, 1);
};

// 拖拽进入
const handleDragEnter = (e: DragEvent) => {
  dragCounter++;
  if (e.dataTransfer?.types.includes("Files")) {
    isDragging.value = true;
  }
};

// 拖拽经过
const handleDragOver = (e: DragEvent) => {
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = "copy";
  }
};

// 拖拽离开
const handleDragLeave = () => {
  dragCounter--;
  if (dragCounter === 0) {
    isDragging.value = false;
  }
};

// 拖拽释放
const handleDrop = async (e: DragEvent) => {
  dragCounter = 0;
  isDragging.value = false;

  const files = e.dataTransfer?.files;
  if (!files || files.length === 0) return;

  // 在 Electron 环境中，可以直接获取文件路径
  if (!window.isWeb) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // @ts-ignore - Electron 提供的 path 属性
      const filePath = file.path || (file as any).path;
      if (filePath) {
        attachedFiles.value.push({
          name: file.name,
          path: filePath,
        });
      }
    }
    message.success(`已添加 ${files.length} 个文件`);
  } else {
    message.warning("Web 环境下请使用附件按钮选择文件");
  }
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
  padding-top: 0;
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
  position: relative;
}

.drag-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(24, 160, 88, 0.1);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.drag-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px;
  background: var(--bg-card);
  border-radius: 16px;
  border: 2px dashed rgba(24, 160, 88, 0.5);
  color: var(--primary-color);
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;

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
    background: var(--bg-secondary);
    color: var(--text-primary);

    .message-header {
      color: var(--text-secondary);
    }
  }

  &.assistant {
    align-self: flex-start;
    background: var(--bg-secondary);
    color: var(--text-primary);
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
  line-height: normal;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-state {
  margin-top: 4px;
}

.confirm-buttons {
  margin-top: 4px;
  animation: fadeIn 0.3s ease-in;
}

.file-input-area {
  margin-top: 8px;
  display: flex;
  align-items: center;
  padding: 8px;
  background: rgba(24, 160, 88, 0.1);
  border-radius: 6px;
  border: 1px dashed rgba(24, 160, 88, 0.3);
}

.message-data {
  margin-top: 8px;

  pre {
    background: rgba(0, 0, 0, 0.05);
    padding: 8px;
    color: var(--text-primary);
    border-radius: 4px;
    font-size: 12px;
    overflow-x: auto;
  }
}

.input-area {
  padding: 16px;
  background: var(--bg-card);

  @media (max-width: 768px) {
    padding: 12px;
  }
}

.attached-files {
  margin-bottom: 12px;
  padding: 8px 12px;
  background: var(--bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.attached-file-item {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  background: var(--bg-card);
  border-radius: 6px;
  border: 1px solid var(--border-color);
  font-size: 12px;
  color: var(--text-primary);

  &:hover {
    background: var(--bg-hover);
  }
}
</style>
