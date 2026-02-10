import { randomUUID } from "node:crypto";
import type { ConversationSession, ConversationState } from "./types.js";

/**
 * 会话管理器 - 管理对话上下文和状态
 */
export class ConversationManager {
  private sessions: Map<string, ConversationSession> = new Map();
  private readonly sessionTimeout: number;

  constructor(sessionTimeout: number = 30 * 60 * 1000) {
    // 默认 30 分钟超时
    this.sessionTimeout = sessionTimeout;

    // 定期清理过期会话
    setInterval(() => this.cleanupExpiredSessions(), 5 * 60 * 1000); // 每 5 分钟清理一次
  }

  /**
   * 创建新会话
   */
  createSession(userId?: string): ConversationSession {
    const session: ConversationSession = {
      id: randomUUID(),
      userId,
      state: "idle" as ConversationState,
      context: [],
      currentSkill: null,
      collectedParams: {},
      missingParams: [],
      startTime: Date.now(),
      lastActiveTime: Date.now(),
      retryCount: {},
    };

    this.sessions.set(session.id, session);
    return session;
  }

  /**
   * 获取会话
   */
  getSession(sessionId: string): ConversationSession | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      // 检查是否过期
      if (Date.now() - session.lastActiveTime > this.sessionTimeout) {
        this.deleteSession(sessionId);
        return undefined;
      }
      // 更新活跃时间
      session.lastActiveTime = Date.now();
    }
    return session;
  }

  /**
   * 更新会话
   */
  updateSession(sessionId: string, updates: Partial<ConversationSession>): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    Object.assign(session, updates);
    session.lastActiveTime = Date.now();
    return true;
  }

  /**
   * 删除会话
   */
  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * 重置会话状态（保留会话 ID 和历史）
   */
  resetSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.state = "idle" as ConversationState;
    session.currentSkill = null;
    session.collectedParams = {};
    session.missingParams = [];
    session.retryCount = {};
    session.lastActiveTime = Date.now();

    return true;
  }

  /**
   * 添加消息到会话上下文
   */
  addMessage(sessionId: string, role: "user" | "assistant" | "system", content: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.context.push({
      role,
      content,
      timestamp: Date.now(),
    });

    session.lastActiveTime = Date.now();
    return true;
  }

  /**
   * 获取会话上下文
   */
  getContext(sessionId: string, limit?: number): any[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    const context = session.context;
    if (limit && limit > 0) {
      return context.slice(-limit);
    }
    return context;
  }

  /**
   * 更新会话状态
   */
  updateState(sessionId: string, state: ConversationState): boolean {
    return this.updateSession(sessionId, { state });
  }

  /**
   * 设置当前技能
   */
  setCurrentSkill(sessionId: string, skillName: string): boolean {
    return this.updateSession(sessionId, { currentSkill: skillName });
  }

  /**
   * 更新已收集的参数
   */
  updateParams(sessionId: string, params: Record<string, any>): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    Object.assign(session.collectedParams, params);
    session.lastActiveTime = Date.now();
    return true;
  }

  /**
   * 设置缺失参数列表
   */
  setMissingParams(sessionId: string, missingParams: string[]): boolean {
    return this.updateSession(sessionId, { missingParams });
  }

  /**
   * 增加参数重试计数
   */
  incrementRetry(sessionId: string, paramName: string): number {
    const session = this.sessions.get(sessionId);
    if (!session) return 0;

    if (!session.retryCount[paramName]) {
      session.retryCount[paramName] = 0;
    }
    session.retryCount[paramName]++;
    session.lastActiveTime = Date.now();

    return session.retryCount[paramName];
  }

  /**
   * 获取参数重试次数
   */
  getRetryCount(sessionId: string, paramName: string): number {
    const session = this.sessions.get(sessionId);
    return session?.retryCount[paramName] || 0;
  }

  /**
   * 清理过期会话
   */
  private cleanupExpiredSessions(): void {
    const now = Date.now();
    const expiredSessions: string[] = [];

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActiveTime > this.sessionTimeout) {
        expiredSessions.push(sessionId);
      }
    }

    for (const sessionId of expiredSessions) {
      this.sessions.delete(sessionId);
    }

    if (expiredSessions.length > 0) {
      console.log(`Cleaned up ${expiredSessions.length} expired sessions`);
    }
  }

  /**
   * 获取活跃会话数
   */
  getActiveSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * 清空所有会话
   */
  clearAll(): void {
    this.sessions.clear();
  }
}
