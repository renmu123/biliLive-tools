# AI Agent 架构文档

## 概述

这是一个基于 LLM 的智能对话 Agent 系统，允许用户通过自然语言调用内部功能。系统能够自动处理参数缺失的情况，通过多轮对话收集所需信息。

## 核心特性

- ✅ **意图识别**：自动识别用户想要执行的操作
- ✅ **参数提取**：从自然语言中提取结构化参数
- ✅ **参数补全**：自动检测缺失参数并通过对话收集
- ✅ **参数验证**：确保参数类型和格式正确
- ✅ **会话管理**：支持多用户、多会话并行
- ✅ **重试机制**：参数提取失败时自动重试
- ✅ **确认流程**：执行前请求用户确认
- ✅ **技能扩展**：通过 JSON 定义轻松添加新技能

## 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                        用户输入                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   AgentController                            │
│                 (对话流程控制器)                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  状态机: idle → identifying → collecting →           │   │
│  │         confirming → executing → completed           │   │
│  └──────────────────────────────────────────────────────┘   │
└────┬──────────┬───────────┬──────────┬──────────┬──────────┘
     │          │           │          │          │
     ▼          ▼           ▼          ▼          ▼
┌─────────┐ ┌────────┐ ┌──────┐ ┌──────────┐ ┌───────────┐
│Conversation│SkillLoader│ NLU  │Parameter │SkillExecutor│
│ Manager │         │  │ │Collector │         │
└─────────┘ └────────┘ └──────┘ └──────────┘ └───────────┘
     │          │           │          │          │
     │          │           │          │          │
     ▼          ▼           ▼          ▼          ▼
┌─────────┐ ┌────────┐ ┌──────┐ ┌──────────┐ ┌───────────┐
│会话存储 │ │技能JSON│ │LLM   │ │参数验证  │ │业务Service│
│上下文   │ │定义    │ │服务  │ │重试逻辑  │ │(Recorder等)│
└─────────┘ └────────┘ └──────┘ └──────────┘ └───────────┘
```

## 核心组件

### 1. ConversationManager（会话管理器）

负责管理对话会话的生命周期和状态。

**功能**：

- 创建、获取、更新、删除会话
- 维护对话历史
- 管理会话超时和清理
- 跟踪参数收集进度

**文件**：`ConversationManager.ts`

### 2. SkillLoader（技能加载器）

从 JSON 文件加载技能定义。

**功能**：

- 扫描 skills 目录
- 解析和验证技能定义
- 提供技能查询接口

**文件**：`SkillLoader.ts`

**技能定义格式**：

```json
{
  "name": "addRecorder",
  "description": "添加直播间录制器",
  "parameters": {
    "type": "object",
    "properties": {
      "url": {
        "type": "string",
        "description": "直播间链接"
      }
    },
    "required": ["url"]
  }
}
```

### 3. NLU（自然语言理解）

基于 LLM 的意图识别和参数提取。

**功能**：

- 识别用户意图（匹配技能）
- 从自然语言中提取参数
- 单个参数提取（用于补全）
- 参数类型验证和标准化

**文件**：`nlu/index.ts`

**关键特性**：

- 使用 LLM JSON Mode 确保结构化输出
- 低温度（0.1-0.3）确保精确提取
- 无法确定的参数返回 null

### 4. ParameterCollector（参数补全器）

处理参数缺失的情况。

**功能**：

- 检查参数完整性
- 生成参数询问提示
- 逐个收集缺失参数
- 参数验证和重试管理

**文件**：`ParameterCollector.ts`

**补全策略**：

1. 首次提取：尝试从初始输入中提取所有参数
2. 检查缺失：对比技能定义的 `required` 字段
3. 逐个询问：按顺序（或定义的 `paramOrder`）询问缺失参数
4. 重试机制：每个参数最多重试 3 次（可配置）
5. 友好提示：根据参数类型、枚举值等生成提示

### 5. SkillExecutor（技能执行引擎）

将技能映射到实际的执行函数。

**功能**：

- 注册技能处理器
- 执行参数验证
- 调用业务逻辑
- 统一错误处理

**文件**：`SkillExecutor.ts`

**使用方式**：

```typescript
const executor = new SkillExecutor();

// 注册处理器
executor.registerHandler("addRecorder", new AddRecorderHandler());

// 执行技能
const result = await executor.execute("addRecorder", { url: "..." }, skill);
```

### 6. AgentController（对话流程控制器）

协调所有组件，实现完整的对话流程。

**功能**：

- 状态机管理
- 消息路由
- 流程编排
- 错误处理

**文件**：`AgentController.ts`

**对话流程**：

```
用户输入 → 意图识别 → 参数提取 → 参数完整？
                                    ├─ 是 → 请求确认 → 用户确认？
                                    │                 ├─ 是 → 执行技能 → 返回结果
                                    │                 └─ 否 → 取消操作
                                    └─ 否 → 询问缺失参数 → 收集参数 → 重复检查
```

## 对话状态机

```
     ┌──────┐
     │ IDLE │ (空闲，等待用户输入)
     └───┬──┘
         │ 用户发送消息
         ▼
┌────────────────────┐
│ IDENTIFYING_INTENT │ (识别意图)
└────────┬───────────┘
         │ 意图已识别
         ▼
┌──────────────────┐
│ COLLECTING_PARAMS│ (收集参数)
└────────┬─────────┘
         │ 参数完整
         ▼
┌──────────────┐
│  CONFIRMING  │ (等待用户确认)
└────┬─────────┘
     │ 用户确认
     ▼
┌───────────┐
│ EXECUTING │ (执行中)
└─────┬─────┘
      │
      ▼
┌───────────┐
│ COMPLETED │ (完成) → 返回 IDLE
└───────────┘
```

## 使用指南

### 基本使用

```typescript
import { AgentController, SkillExecutor } from "@bililive-tools/shared/agent";
import { QwenLLM } from "@bililive-tools/http/vendor/llm/QwenLLM";

// 1. 初始化 LLM
const llm = new QwenLLM(/* config */);

// 2. 创建技能执行器并注册处理器
const skillExecutor = new SkillExecutor();
skillExecutor.registerHandler("addRecorder", new AddRecorderHandler());

// 3. 创建 Agent
const agent = new AgentController(llm, skillExecutor, {
  sessionTimeout: 30 * 60 * 1000,
  maxRetries: 3,
  debug: true,
});

// 4. 创建会话
const sessionId = agent.createSession("user-123");

// 5. 处理用户消息
const response = await agent.handleMessage(
  sessionId,
  "帮我添加一个录制器，地址是 https://live.bilibili.com/123456",
);

console.log(response.message); // Agent 的回复
console.log(response.state); // 当前状态
console.log(response.action); // 需要的操作
```

### 添加新技能

#### 1. 创建技能定义 JSON

在 `packages/shared/src/agent/skills/` 创建 `mySkill.json`：

```json
{
  "name": "mySkill",
  "description": "我的技能描述",
  "parameters": {
    "type": "object",
    "properties": {
      "param1": {
        "type": "string",
        "description": "参数1描述"
      },
      "param2": {
        "type": "number",
        "description": "参数2描述",
        "enum": [1, 2, 3]
      }
    },
    "required": ["param1"]
  },
  "paramOrder": ["param1", "param2"]
}
```

#### 2. 实现技能处理器

```typescript
import { SkillHandler, SkillExecutionResult } from "./types";

export class MySkillHandler implements SkillHandler {
  constructor(private myService: any) {}

  async execute(params: Record<string, any>): Promise<SkillExecutionResult> {
    const { param1, param2 } = params;

    try {
      // 调用实际的业务逻辑
      const result = await this.myService.doSomething(param1, param2);

      return {
        success: true,
        data: result,
        message: `操作成功：${result}`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: `操作失败：${error.message}`,
      };
    }
  }
}
```

#### 3. 注册处理器

```typescript
skillExecutor.registerHandler("mySkill", new MySkillHandler(myService));
```

## 参数缺失处理示例

### 场景 1：用户提供完整参数

```
用户: 帮我添加录制器 https://live.bilibili.com/123456
Agent: 请确认以下信息：
       - 直播间链接: https://live.bilibili.com/123456
       是否确认执行？（回复"是"或"否"）
用户: 是
Agent: 成功添加直播间录制器：https://live.bilibili.com/123456
```

### 场景 2：用户缺少参数

```
用户: 我想添加一个录制器
Agent: 好的，我将帮您添加直播间录制器。
       请提供 url（直播间链接）
用户: https://live.bilibili.com/123456
Agent: 请确认以下信息：
       - 直播间链接: https://live.bilibili.com/123456
       是否确认执行？（回复"是"或"否"）
用户: 确认
Agent: 成功添加直播间录制器：https://live.bilibili.com/123456
```

### 场景 3：参数提取失败，重试

```
用户: 添加录制器
Agent: 请提供 url（直播间链接）
用户: 不知道
Agent: 抱歉，我没有理解您提供的 url 信息，请重新输入
用户: 随便
Agent: 抱歉，我没有理解您提供的 url 信息，请重新输入
用户: https://live.bilibili.com/123456
Agent: 请确认以下信息：...
```

## 配置选项

```typescript
interface AgentConfig {
  /** 会话超时时间（毫秒），默认 30 分钟 */
  sessionTimeout: number;

  /** 参数收集最大重试次数，默认 3 次 */
  maxRetries: number;

  /** 是否启用会话持久化，默认 false */
  enablePersistence: boolean;

  /** LLM 温度参数，默认 0.3 */
  llmTemperature: number;

  /** 是否启用调试日志，默认 false */
  debug: boolean;
}
```

## 扩展建议

### 1. 与现有服务集成

在 `packages/http/src/services/` 创建 Agent Service：

```typescript
import { AgentController } from "@bililive-tools/shared/agent";
import { AddRecorderHandler } from "./handlers/AddRecorderHandler";

export class AgentService {
  private agent: AgentController;

  constructor(
    private container: any,
    private llm: QwenLLM,
  ) {
    const skillExecutor = new SkillExecutor();

    // 注入实际的 Service
    const recorderService = container.resolve("recorderService");
    skillExecutor.registerHandler("addRecorder", new AddRecorderHandler(recorderService));

    this.agent = new AgentController(llm, skillExecutor);
  }

  async chat(sessionId: string, message: string) {
    return await this.agent.handleMessage(sessionId, message);
  }
}
```

### 2. 添加 HTTP API 路由

在 `packages/http/src/router/` 创建 agent 路由：

```typescript
import Router from "@koa/router";
import { AgentService } from "../services/AgentService";

const router = new Router({ prefix: "/agent" });

router.post("/chat", async (ctx) => {
  const { sessionId, message } = ctx.request.body;
  const agentService = ctx.container.resolve("agentService");

  const response = await agentService.chat(sessionId, message);

  ctx.body = response;
});

router.post("/session", async (ctx) => {
  const agentService = ctx.container.resolve("agentService");
  const sessionId = agentService.createSession(ctx.userId);

  ctx.body = { sessionId };
});

export default router;
```

### 3. 支持流式响应

```typescript
router.post("/chat/stream", async (ctx) => {
  ctx.set("Content-Type", "text/event-stream");
  ctx.set("Cache-Control", "no-cache");
  ctx.set("Connection", "keep-alive");

  const { sessionId, message } = ctx.request.body;
  const agentService = ctx.container.resolve("agentService");

  // 流式返回
  const stream = agentService.chatStream(sessionId, message);

  for await (const chunk of stream) {
    ctx.res.write(`data: ${JSON.stringify(chunk)}\n\n`);
  }

  ctx.res.end();
});
```

## 测试

查看 `examples.ts` 文件获取更多使用示例。

## 目录结构

```
packages/shared/src/agent/
├── types.ts                 # 类型定义
├── ConversationManager.ts   # 会话管理器
├── SkillLoader.ts          # 技能加载器
├── SkillExecutor.ts        # 技能执行引擎
├── ParameterCollector.ts   # 参数补全器
├── AgentController.ts      # 对话流程控制器
├── handlers.ts             # 示例处理器
├── examples.ts             # 使用示例
├── index.ts                # 导出文件
├── README.md               # 本文档
└── nlu/
    └── index.ts            # NLU 模块
└── skills/
    ├── addRecorder.json           # 添加录制器技能
    └── uploadVideoToBilibli.json  # 上传视频技能
```

## 常见问题

### Q: 如何处理复杂的参数依赖关系？

A: 在技能定义中使用 `paramOrder` 字段指定参数收集顺序：

```json
{
  "paramOrder": ["param1", "param2", "param3"]
}
```

### Q: 如何自定义参数验证逻辑？

A: 在技能处理器的 `execute` 方法中添加自定义验证：

```typescript
async execute(params: Record<string, any>): Promise<SkillExecutionResult> {
  // 自定义验证
  if (!isValidUrl(params.url)) {
    return {
      success: false,
      error: "Invalid URL format",
      message: "URL 格式不正确",
    };
  }

  // 执行业务逻辑
  // ...
}
```

### Q: 如何支持可选参数？

A: 在技能定义中不要将参数加入 `required` 数组：

```json
{
  "parameters": {
    "properties": {
      "required_param": { "type": "string" },
      "optional_param": { "type": "string", "default": "默认值" }
    },
    "required": ["required_param"]
  }
}
```

### Q: 会话数据会持久化吗？

A: 默认仅保存在内存中。如需持久化，可以：

1. 设置 `enablePersistence: true`
2. 实现自定义的会话存储（使用数据库或 electron-store）

## 下一步计划

- [ ] 支持 Function Calling（提高意图识别准确率）
- [ ] 支持语音输入（集成现有的 ASR）
- [ ] 支持多模态（图像理解）
- [ ] 会话持久化实现
- [ ] 更多内置技能
- [ ] Web UI 界面
- [ ] 性能优化和缓存

## 贡献

欢迎提交 Issue 和 Pull Request！
