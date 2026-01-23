# Agent API 使用指南

## 概述

AI Agent API 提供语义化的功能调用接口，用户可以通过自然语言与系统交互，Agent 会自动识别意图、收集参数并执行相应操作。

## 基础 URL

```
http://localhost:18010/agent
```

## 认证

所有请求需要在 Header 中携带 `Authorization` 或在 query 参数中携带 `auth`：

```bash
Authorization: your-passkey
```

## API 端点

### 1. 创建会话

创建一个新的对话会话。

**请求**

```http
POST /agent/session
Content-Type: application/json

{
  "userId": "user-123"  // 可选
}
```

**响应**

```json
{
  "success": true,
  "payload": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### 2. 发送消息（标准模式）

向 Agent 发送消息并获取响应。

**请求**

```http
POST /agent/chat
Content-Type: application/json

{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "帮我添加一个录制器，地址是 https://live.bilibili.com/123456"
}
```

**响应**

```json
{
  "success": true,
  "payload": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "message": "请确认以下信息：\n\n- 直播间链接: https://live.bilibili.com/123456\n\n是否确认执行？（回复\"是\"或\"否\"）",
    "state": "confirming",
    "action": "confirm_required",
    "data": {
      "params": {
        "url": "https://live.bilibili.com/123456"
      }
    }
  }
}
```

**状态说明**

- `idle`: 空闲，等待用户输入
- `identifying_intent`: 正在识别意图
- `collecting_params`: 正在收集参数
- `confirming`: 等待用户确认
- `executing`: 执行中
- `completed`: 已完成
- `error`: 出错

**操作说明**

- `input_required`: 需要用户提供更多信息
- `confirm_required`: 需要用户确认
- `completed`: 操作完成
- `error`: 发生错误

### 3. 发送消息（流式模式）

使用 Server-Sent Events (SSE) 获取流式响应。

**请求**

```http
POST /agent/chat/stream
Content-Type: application/json

{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "添加录制器"
}
```

**响应（SSE 流）**

```
data: {"type":"start"}

data: {"type":"response","data":{"sessionId":"...","message":"...","state":"...","action":"..."}}

data: {"type":"end"}
```

### 4. 获取会话信息

获取当前会话的详细信息。

**请求**

```http
GET /agent/session/{sessionId}
```

**响应**

```json
{
  "success": true,
  "payload": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "user-123",
    "state": "collecting_params",
    "context": [
      {
        "role": "user",
        "content": "添加录制器",
        "timestamp": 1706000000000
      },
      {
        "role": "assistant",
        "content": "请提供直播间链接",
        "timestamp": 1706000001000
      }
    ],
    "currentSkill": "addRecorder",
    "collectedParams": {},
    "missingParams": ["url"],
    "startTime": 1706000000000,
    "lastActiveTime": 1706000001000,
    "retryCount": {}
  }
}
```

### 5. 重置会话

重置会话状态，清除已收集的参数和对话历史。

**请求**

```http
POST /agent/session/{sessionId}/reset
```

**响应**

```json
{
  "success": true,
  "payload": {
    "success": true
  }
}
```

### 6. 获取可用技能列表

获取当前 Agent 支持的所有技能。

**请求**

```http
GET /agent/skills
```

**响应**

```json
{
  "success": true,
  "payload": {
    "skills": ["addRecorder", "uploadVideoToBilibli"]
  }
}
```

### 7. 重新加载技能

重新扫描并加载技能定义文件。

**请求**

```http
POST /agent/skills/reload
```

**响应**

```json
{
  "success": true,
  "payload": {
    "message": "技能已重新加载"
  }
}
```

## 使用示例

### 示例 1：完整参数，一次完成

```bash
# 1. 创建会话
curl -X POST http://localhost:18010/agent/session \
  -H "Authorization: your-passkey" \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-123"}'

# 响应: {"success":true,"payload":{"sessionId":"xxx"}}

# 2. 发送包含完整参数的消息
curl -X POST http://localhost:18010/agent/chat \
  -H "Authorization: your-passkey" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId":"xxx",
    "message":"帮我添加一个录制器，地址是 https://live.bilibili.com/123456"
  }'

# 响应: Agent 识别意图并提取参数，请求确认

# 3. 确认执行
curl -X POST http://localhost:18010/agent/chat \
  -H "Authorization: your-passkey" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId":"xxx",
    "message":"是的，确认"
  }'

# 响应: {"success":true,"payload":{"message":"成功添加直播间录制器...","state":"completed"}}
```

### 示例 2：缺少参数，多轮对话

```bash
# 1. 创建会话
curl -X POST http://localhost:18010/agent/session \
  -H "Authorization: your-passkey" \
  -H "Content-Type: application/json"

# 2. 发送缺少参数的消息
curl -X POST http://localhost:18010/agent/chat \
  -H "Authorization: your-passkey" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId":"xxx",
    "message":"我想添加一个录制器"
  }'

# 响应: {"payload":{"message":"好的，我将帮您添加直播间录制器。\n\n请提供 url（直播间链接）","state":"collecting_params","action":"input_required"}}

# 3. 提供缺失的参数
curl -X POST http://localhost:18010/agent/chat \
  -H "Authorization: your-passkey" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId":"xxx",
    "message":"https://live.bilibili.com/123456"
  }'

# 响应: Agent 收集到参数，请求确认

# 4. 确认执行
curl -X POST http://localhost:18010/agent/chat \
  -H "Authorization: your-passkey" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId":"xxx",
    "message":"确认"
  }'

# 响应: 执行成功
```

### 示例 3：取消操作

```bash
# 在确认步骤选择取消
curl -X POST http://localhost:18010/agent/chat \
  -H "Authorization: your-passkey" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId":"xxx",
    "message":"不，取消"
  }'

# 响应: {"payload":{"message":"操作已取消。如需帮助，请告诉我您想做什么。","state":"idle"}}
```

### 示例 4：使用流式接口

```bash
curl -X POST http://localhost:18010/agent/chat/stream \
  -H "Authorization: your-passkey" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId":"xxx",
    "message":"添加录制器 https://live.bilibili.com/123456"
  }'

# SSE 流式响应
# data: {"type":"start"}
# data: {"type":"response","data":{...}}
# data: {"type":"end"}
```

## JavaScript 客户端示例

```javascript
// 创建会话
async function createSession() {
  const response = await fetch("http://localhost:18010/agent/session", {
    method: "POST",
    headers: {
      Authorization: "your-passkey",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId: "user-123" }),
  });
  const data = await response.json();
  return data.payload.sessionId;
}

// 发送消息
async function chat(sessionId, message) {
  const response = await fetch("http://localhost:18010/agent/chat", {
    method: "POST",
    headers: {
      Authorization: "your-passkey",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sessionId, message }),
  });
  const data = await response.json();
  return data.payload;
}

// 完整对话流程
async function conversationFlow() {
  // 创建会话
  const sessionId = await createSession();
  console.log("Session created:", sessionId);

  // 第一轮：发送初始消息
  let response = await chat(sessionId, "添加录制器");
  console.log("Agent:", response.message);
  console.log("State:", response.state);
  console.log("Action:", response.action);

  // 第二轮：提供参数（如果需要）
  if (response.action === "input_required") {
    response = await chat(sessionId, "https://live.bilibili.com/123456");
    console.log("Agent:", response.message);
  }

  // 第三轮：确认执行
  if (response.action === "confirm_required") {
    response = await chat(sessionId, "是");
    console.log("Agent:", response.message);
    console.log("Result:", response.data);
  }
}

conversationFlow();
```

## Python 客户端示例

```python
import requests
import json

BASE_URL = "http://localhost:18010/agent"
PASSKEY = "your-passkey"

def create_session(user_id=None):
    """创建会话"""
    response = requests.post(
        f"{BASE_URL}/session",
        headers={
            "Authorization": PASSKEY,
            "Content-Type": "application/json"
        },
        json={"userId": user_id} if user_id else {}
    )
    return response.json()["payload"]["sessionId"]

def chat(session_id, message):
    """发送消息"""
    response = requests.post(
        f"{BASE_URL}/chat",
        headers={
            "Authorization": PASSKEY,
            "Content-Type": "application/json"
        },
        json={
            "sessionId": session_id,
            "message": message
        }
    )
    return response.json()["payload"]

def conversation_flow():
    """完整对话流程"""
    # 创建会话
    session_id = create_session("user-123")
    print(f"Session created: {session_id}")

    # 第一轮：发送初始消息
    response = chat(session_id, "添加录制器 https://live.bilibili.com/123456")
    print(f"Agent: {response['message']}")
    print(f"State: {response['state']}")

    # 第二轮：确认执行
    if response["action"] == "confirm_required":
        response = chat(session_id, "确认")
        print(f"Agent: {response['message']}")
        print(f"Result: {response.get('data')}")

if __name__ == "__main__":
    conversation_flow()
```

## 错误处理

### 常见错误码

- `400`: 请求参数错误
- `401`: 认证失败
- `404`: 会话不存在或已过期
- `500`: 服务器内部错误

### 错误响应格式

```json
{
  "success": false,
  "error": "错误描述信息"
}
```

## 配置要求

Agent 依赖 LLM 服务，需要在配置文件中设置：

```json
{
  "llm": {
    "qwen": {
      "apiKey": "your-qwen-api-key",
      "baseUrl": "https://dashscope.aliyuncs.com/compatible-mode/v1",
      "model": "qwen-turbo"
    }
  }
}
```

## 注意事项

1. **会话超时**：会话默认 30 分钟无活动后自动过期
2. **参数重试**：每个参数最多重试 3 次，超过后会取消操作
3. **并发会话**：支持多用户多会话并行，每个会话独立管理
4. **技能扩展**：可在 `packages/shared/src/agent/skills/` 添加新技能 JSON 定义
5. **日志记录**：所有操作都会记录在系统日志中

## 支持的技能

### 1. addRecorder - 添加录制器

**描述**：添加直播间录制器

**参数**：

- `url` (必需): 直播间链接

**示例**：

```
"帮我添加一个录制器，地址是 https://live.bilibili.com/123456"
"添加录制器 https://live.bilibili.com/123456"
"我想录制这个直播间 https://live.bilibili.com/123456"
```

### 2. uploadVideoToBilibli - 上传视频到 B 站

**描述**：将本地视频文件上传至 Bilibili

**参数**：

- `filePath` (必需): 视频本地文件路径

**示例**：

```
"上传视频 /path/to/video.mp4"
"把这个视频上传到B站 /path/to/video.mp4"
```

## 更多信息

- 完整架构文档：`packages/shared/src/agent/README.md`
- 架构图：`packages/shared/src/agent/ARCHITECTURE.md`
- 技能定义：`packages/shared/src/agent/skills/`
