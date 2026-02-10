import Router from "@koa/router";
import { getAgentService } from "../services/agent.js";
import logger from "@biliLive-tools/shared/utils/log.js";

const router = new Router({
  prefix: "/agent",
});

/**
 * AI Agent 对话接口
 */

/**
 * 创建新会话
 * @route POST /agent/session
 * @param userId 用户 ID（可选）
 * @returns { sessionId: string }
 */
router.post("/session", async (ctx) => {
  try {
    const { userId } = ctx.request.body as { userId?: string };
    const agentService = getAgentService();

    const sessionId = agentService.createSession(userId);

    ctx.body = {
      success: true,
      payload: { sessionId },
    };
  } catch (error: any) {
    logger.error("[Agent API] Create session error:", error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: error.message || "创建会话失败",
    };
  }
});

/**
 * 发送消息
 * @route POST /agent/chat
 * @param sessionId 会话 ID
 * @param message 用户消息
 * @returns AgentResponse
 */
router.post("/chat", async (ctx) => {
  try {
    const { sessionId, message } = ctx.request.body as {
      sessionId: string;
      message: string;
    };

    if (!sessionId || !message) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: "sessionId 和 message 是必需参数",
      };
      return;
    }

    const agentService = getAgentService();
    const response = await agentService.chat(sessionId, message);

    ctx.body = {
      success: true,
      payload: response,
    };
  } catch (error: any) {
    logger.error("[Agent API] Chat error:", error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: error.message || "处理消息失败",
    };
  }
});

/**
 * 获取会话信息
 * @route GET /agent/session/:sessionId
 * @param sessionId 会话 ID
 * @returns ConversationSession
 */
router.get("/session/:sessionId", async (ctx) => {
  try {
    const { sessionId } = ctx.params;
    const agentService = getAgentService();

    const session = agentService.getSession(sessionId);

    if (!session) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        error: "会话不存在或已过期",
      };
      return;
    }

    ctx.body = {
      success: true,
      payload: session,
    };
  } catch (error: any) {
    logger.error("[Agent API] Get session error:", error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: error.message || "获取会话信息失败",
    };
  }
});

/**
 * 重置会话
 * @route POST /agent/session/:sessionId/reset
 * @param sessionId 会话 ID
 * @returns { success: boolean }
 */
router.post("/session/:sessionId/reset", async (ctx) => {
  try {
    const { sessionId } = ctx.params;
    const agentService = getAgentService();

    const success = agentService.resetSession(sessionId);

    ctx.body = {
      success: true,
      payload: { success },
    };
  } catch (error: any) {
    logger.error("[Agent API] Reset session error:", error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: error.message || "重置会话失败",
    };
  }
});

/**
 * 获取可用技能列表
 * @route GET /agent/skills
 * @returns { skills: Array<{ name: string; showName: string; description: string }> }
 */
router.get("/skills", async (ctx) => {
  try {
    const agentService = getAgentService();
    const skills = agentService.getAvailableSkillsInfo();

    ctx.body = {
      success: true,
      payload: { skills },
    };
  } catch (error: any) {
    logger.error("[Agent API] Get skills error:", error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: error.message || "获取技能列表失败",
    };
  }
});

/**
 * 重新加载技能
 * @route POST /agent/skills/reload
 * @returns { success: boolean }
 */
router.post("/skills/reload", async (ctx) => {
  try {
    const agentService = getAgentService();
    agentService.reloadSkills();

    ctx.body = {
      success: true,
      payload: { message: "技能已重新加载" },
    };
  } catch (error: any) {
    logger.error("[Agent API] Reload skills error:", error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: error.message || "重新加载技能失败",
    };
  }
});

/**
 * 流式对话接口（可选功能）
 * @route POST /agent/chat/stream
 * @param sessionId 会话 ID
 * @param message 用户消息
 * @returns Server-Sent Events stream
 */
router.post("/chat/stream", async (ctx) => {
  try {
    const { sessionId, message } = ctx.request.body as {
      sessionId: string;
      message: string;
    };

    if (!sessionId || !message) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: "sessionId 和 message 是必需参数",
      };
      return;
    }

    // 设置 SSE 响应头
    ctx.set({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    const agentService = getAgentService();

    // 发送开始事件
    ctx.res.write(`data: ${JSON.stringify({ type: "start" })}\n\n`);

    // 处理消息
    const response = await agentService.chat(sessionId, message);

    // 发送响应事件
    ctx.res.write(`data: ${JSON.stringify({ type: "response", data: response })}\n\n`);

    // 发送结束事件
    ctx.res.write(`data: ${JSON.stringify({ type: "end" })}\n\n`);

    ctx.res.end();
  } catch (error: any) {
    logger.error("[Agent API] Stream chat error:", error);
    ctx.res.write(
      `data: ${JSON.stringify({ type: "error", error: error.message || "处理消息失败" })}\n\n`,
    );
    ctx.res.end();
  }
});

export default router;
