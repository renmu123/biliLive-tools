import api from "./request";

export interface AgentChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: number;
}

export interface AgentResponse {
  sessionId: string;
  message: string;
  state:
    | "idle"
    | "identifying_intent"
    | "collecting_params"
    | "confirming"
    | "executing"
    | "completed"
    | "error";
  action?: "input_required" | "confirm_required" | "completed" | "error";
  data?: any;
}

export interface ConversationSession {
  id: string;
  userId?: string;
  state: string;
  context: AgentChatMessage[];
  currentSkill: string | null;
  collectedParams: Record<string, any>;
  missingParams: string[];
  startTime: number;
  lastActiveTime: number;
  retryCount: Record<string, number>;
}

const agentApi = {
  /**
   * 创建新会话
   */
  createSession: async (userId?: string) => {
    const { data } = await api.post<{ success: boolean; payload: { sessionId: string } }>(
      "/agent/session",
      { userId },
    );
    return data.payload;
  },

  /**
   * 发送消息
   */
  chat: async (sessionId: string, message: string) => {
    const { data } = await api.post<{ success: boolean; payload: AgentResponse }>("/agent/chat", {
      sessionId,
      message,
    });
    return data.payload;
  },

  /**
   * 获取会话信息
   */
  getSession: async (sessionId: string) => {
    const { data } = await api.get<{ success: boolean; payload: ConversationSession }>(
      `/agent/session/${sessionId}`,
    );
    return data.payload;
  },

  /**
   * 重置会话
   */
  resetSession: async (sessionId: string) => {
    const { data } = await api.post<{ success: boolean; payload: { success: boolean } }>(
      `/agent/session/${sessionId}/reset`,
    );
    return data.payload;
  },

  /**
   * 获取可用技能列表
   */
  getSkills: async () => {
    const { data } = await api.get<{ success: boolean; payload: { skills: string[] } }>(
      "/agent/skills",
    );
    return data.payload;
  },

  /**
   * 重新加载技能
   */
  reloadSkills: async () => {
    const { data } = await api.post<{ success: boolean; payload: { message: string } }>(
      "/agent/skills/reload",
    );
    return data.payload;
  },
};

export default agentApi;
