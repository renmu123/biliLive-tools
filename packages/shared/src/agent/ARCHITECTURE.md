# AI Agent 架构图

## 整体架构

\`\`\`mermaid
graph TB
User[用户] --> AC[AgentController<br/>对话流程控制器]

    AC --> CM[ConversationManager<br/>会话管理器]
    AC --> SL[SkillLoader<br/>技能加载器]
    AC --> NLU[NLU<br/>自然语言理解]
    AC --> PC[ParameterCollector<br/>参数补全器]
    AC --> SE[SkillExecutor<br/>技能执行引擎]

    CM --> SessionStore[(会话存储<br/>上下文)]
    SL --> SkillJSON[技能JSON定义]
    NLU --> LLM[LLM服务<br/>通义千问/Ollama]
    PC --> NLU
    SE --> Handler[技能处理器]
    Handler --> Service[业务Service<br/>RecorderService等]

    style AC fill:#4a90e2,stroke:#2e5c8a,stroke-width:3px,color:#fff
    style User fill:#50c878,stroke:#2d7a4a,stroke-width:2px,color:#fff
    style LLM fill:#ff6b6b,stroke:#c92a2a,stroke-width:2px,color:#fff
    style Service fill:#ffd93d,stroke:#c9a800,stroke-width:2px

\`\`\`

## 对话流程状态机

\`\`\`mermaid
stateDiagram-v2
[*] --> IDLE: 创建会话
IDLE --> IDENTIFYING_INTENT: 用户输入消息
IDENTIFYING_INTENT --> COLLECTING_PARAMS: 意图已识别<br/>参数不完整
IDENTIFYING_INTENT --> CONFIRMING: 意图已识别<br/>参数完整
COLLECTING_PARAMS --> COLLECTING_PARAMS: 继续收集参数
COLLECTING_PARAMS --> CONFIRMING: 参数已完整
COLLECTING_PARAMS --> ERROR: 重试次数超限
CONFIRMING --> EXECUTING: 用户确认
CONFIRMING --> IDLE: 用户取消
EXECUTING --> COMPLETED: 执行成功
EXECUTING --> ERROR: 执行失败
COMPLETED --> IDLE: 重置会话
ERROR --> IDLE: 重置会话
IDLE --> [*]: 会话超时
\`\`\`

## 参数收集流程

\`\`\`mermaid
flowchart TD
Start([用户输入]) --> Extract[LLM提取参数]
Extract --> Check{检查参数完整性}
Check -->|完整| Confirm[请求用户确认]
Check -->|不完整| Next[获取下一个缺失参数]
Next --> Prompt[生成询问提示]
Prompt --> Wait[等待用户回复]
Wait --> Parse[解析用户输入]
Parse --> Validate{验证参数}
Validate -->|有效| Save[保存参数]
Validate -->|无效| Retry{是否超过重试次数?}
Retry -->|否| Prompt
Retry -->|是| Cancel[取消操作]
Save --> Check
Confirm --> UserConfirm{用户确认?}
UserConfirm -->|是| Execute[执行技能]
UserConfirm -->|否| Cancel
Execute --> Result[返回结果]
Cancel --> End([结束])
Result --> End

    style Start fill:#50c878,stroke:#2d7a4a,stroke-width:2px,color:#fff
    style Execute fill:#4a90e2,stroke:#2e5c8a,stroke-width:2px,color:#fff
    style Result fill:#ffd93d,stroke:#c9a800,stroke-width:2px
    style Cancel fill:#ff6b6b,stroke:#c92a2a,stroke-width:2px,color:#fff
    style End fill:#95a5a6,stroke:#636e72,stroke-width:2px,color:#fff

\`\`\`

## 组件交互序列图

\`\`\`mermaid
sequenceDiagram
participant User as 用户
participant AC as AgentController
participant CM as ConversationManager
participant NLU as NLU层
participant LLM as LLM服务
participant PC as ParameterCollector
participant SE as SkillExecutor
participant Service as 业务Service

    User->>AC: 发送消息
    AC->>CM: 获取/创建会话
    CM-->>AC: 返回会话对象

    AC->>NLU: 识别意图
    NLU->>LLM: 发送提示词
    LLM-->>NLU: 返回意图和参数
    NLU-->>AC: 返回识别结果

    AC->>PC: 检查参数完整性

    alt 参数不完整
        PC-->>AC: 缺失参数列表
        AC->>User: 询问缺失参数
        User->>AC: 提供参数
        AC->>NLU: 提取单个参数
        NLU->>LLM: 发送提示词
        LLM-->>NLU: 返回参数值
        NLU-->>AC: 返回参数
        AC->>CM: 保存参数
        AC->>PC: 重新检查
    end

    PC-->>AC: 参数已完整
    AC->>User: 请求确认
    User->>AC: 确认执行

    AC->>SE: 执行技能
    SE->>Service: 调用业务逻辑
    Service-->>SE: 返回结果
    SE-->>AC: 返回执行结果

    AC->>CM: 保存结果并重置
    AC->>User: 返回结果

\`\`\`

## 技能注册流程

\`\`\`mermaid
flowchart LR
JSON[技能JSON定义] --> SL[SkillLoader]
SL --> Validate{验证定义}
Validate -->|有效| Store[存储到Map]
Validate -->|无效| Error[记录错误]

    Handler[技能处理器实现] --> SE[SkillExecutor]
    SE --> Register[注册Handler]

    Store --> AC[AgentController]
    Register --> AC

    style JSON fill:#dfe6e9,stroke:#636e72,stroke-width:2px
    style Handler fill:#dfe6e9,stroke:#636e72,stroke-width:2px
    style AC fill:#4a90e2,stroke:#2e5c8a,stroke-width:3px,color:#fff

\`\`\`

## 类图

\`\`\`mermaid
classDiagram
class AgentController {
-conversationManager
-skillLoader
-nlu
-parameterCollector
-skillExecutor
-config
+createSession(userId) string
+handleMessage(sessionId, message) AgentResponse
+getSession(sessionId) ConversationSession
+resetSession(sessionId) boolean
+reloadSkills() void
}

    class ConversationManager {
        -sessions Map
        -sessionTimeout number
        +createSession(userId) ConversationSession
        +getSession(sessionId) ConversationSession
        +updateSession(sessionId, updates) boolean
        +addMessage(sessionId, role, content) boolean
        +updateState(sessionId, state) boolean
        +updateParams(sessionId, params) boolean
    }

    class SkillLoader {
        -skills Map
        -skillsDir string
        +loadAll() void
        +getSkill(name) SkillSchema
        +getAllSkills() SkillSchema[]
        +reload() void
    }

    class NLU {
        -llm LLMProvider
        +identifyIntent(input, skills) IntentResult
        +extractParameters(input, skill) ParameterExtractionResult
        +extractSingleParameter(input, param, schema) any
        +generateParameterPrompt(param, schema, retry) string
    }

    class ParameterCollector {
        -nlu NLU
        -maxRetries number
        +checkParameters(session, skill) object
        +getNextParameter(session, skill) string
        +collectParameter(input, param, skill) any
        +validateParameter(param, value, skill) object
        +generatePrompt(param, skill, retry) string
    }

    class SkillExecutor {
        -handlers Map
        +registerHandler(name, handler) void
        +execute(name, params, skill) SkillExecutionResult
        +isRegistered(name) boolean
        -validateParams(params, skill) object
    }

    class SkillHandler {
        <<interface>>
        +execute(params) SkillExecutionResult
    }

    AgentController --> ConversationManager
    AgentController --> SkillLoader
    AgentController --> NLU
    AgentController --> ParameterCollector
    AgentController --> SkillExecutor
    ParameterCollector --> NLU
    SkillExecutor --> SkillHandler

\`\`\`
