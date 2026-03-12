# 工作流系统实现文档

## 概述

基于 Vue Flow 实现了一个类似 ComfyUI 的可视化工作流系统，用于串联软件中的自动化流程。

## 架构设计

### 核心组件

```
packages/shared/src/workflow/
├── types.ts                    # TypeScript 类型定义
├── index.ts                    # 统一导出
├── registerNodes.ts            # 内置节点注册
├── nodeRegistry.ts             # 节点注册表
├── db/                         # 数据模型
│   ├── workflowModel.ts        # 工作流模型
│   ├── executionModel.ts       # 执行记录模型
│   └── nodeLogModel.ts         # 节点日志模型
├── engine/                     # 执行引擎
│   ├── Executor.ts             # DAG 执行引擎
│   └── DataBus.ts              # 节点数据流转
└── nodes/                      # 节点实现
    ├── base/
    │   └── BaseNode.ts         # 节点基类
    ├── triggers/
    │   └── FileInputNode.ts    # 文件输入节点
    ├── processors/
    │   ├── FfmpegProcessNode.ts    # FFmpeg 处理
    │   └── DanmuConvertNode.ts     # 弹幕转换
    ├── actions/
    │   ├── BilibiliUploadNode.ts   # B站上传
    │   └── NotificationNode.ts     # 通知
    └── utils/
        └── ParallelSplitNode.ts    # 并行分发
```

### 前端组件

```
packages/app/src/renderer/src/
├── stores/
│   └── workflow.ts             # Pinia Store
└── pages/workflow/
    ├── index.vue               # 工作流列表
    └── editor.vue              # 可视化编辑器
```

## 核心功能

### 1. 数据模型

#### Workflow（工作流）
- **字段**: id, name, description, definition, is_active, created_at, updated_at
- **definition 结构**:
  ```typescript
  {
    nodes: WorkflowNode[];    // 节点列表
    edges: WorkflowEdge[];    // 连接关系
    variables?: Record<string, any>;  // 全局变量
  }
  ```

#### WorkflowExecution（执行记录）
- **字段**: id, workflow_id, status, start_time, end_time, error, node_results
- **状态**: running, success, failed, cancelled

#### NodeExecutionLog（节点日志）
- **字段**: id, execution_id, node_id, status, start_time, end_time, input_data, output_data, error
- **状态**: pending, running, success, failed, skipped

### 2. 节点系统

#### BaseNode 抽象类
所有节点必须继承此类并实现：
- `type`: 节点类型标识符
- `displayName`: 显示名称
- `description`: 描述
- `inputs`: 输入端口定义
- `outputs`: 输出端口定义
- `category`: 分类（trigger/processor/action/util）
- `execute()`: 执行逻辑
- `validate()`: 配置验证

#### 内置节点
1. **FileInputNode**: 文件输入（触发器）
2. **FfmpegProcessNode**: 视频处理
3. **DanmuConvertNode**: 弹幕转换
4. **BilibiliUploadNode**: B站上传
5. **NotificationNode**: 发送通知
6. **ParallelSplitNode**: 并行分发

#### 扩展节点
```typescript
import { BaseNode } from "@biliLive-tools/shared/workflow";

export class CustomNode extends BaseNode {
  readonly type = "custom-node";
  readonly displayName = "自定义节点";
  readonly description = "节点描述";
  readonly category = "processor";
  
  readonly inputs = [
    { id: "input", name: "输入", type: "file", required: true }
  ];
  
  readonly outputs = [
    { id: "output", name: "输出", type: "file", required: true }
  ];
  
  async execute(inputs, config, context) {
    // 实现逻辑
    return { output: inputs.input };
  }
}

// 注册节点
import { nodeRegistry } from "@biliLive-tools/shared/workflow";
nodeRegistry.register(CustomNode);
```

### 3. 执行引擎

#### WorkflowExecutor
- **拓扑排序**: Kahn 算法检测循环依赖
- **层级构建**: 将节点分层以实现并行执行
- **并行执行**: 同一层级的无依赖节点并行运行
- **数据流转**: 通过 DataBus 管理节点间数据传递
- **事件系统**: 基于 mitt 发射执行事件

#### 事件
- `workflow-start`: 工作流开始
- `workflow-complete`: 工作流完成
- `node-start`: 节点开始执行
- `node-complete`: 节点执行完成
- `node-error`: 节点执行出错

### 4. 前端 UI

#### 工作流列表 (index.vue)
- 显示所有工作流
- 创建/编辑/删除/运行工作流
- 查看执行历史

#### 可视化编辑器 (editor.vue)
- **左侧面板**: 节点选择（按分类）
- **中央画布**: Vue Flow 编辑区
  - 拖拽节点
  - 连接节点
  - 背景网格
  - 小地图
  - 缩放控制
- **顶部工具栏**: 保存、运行按钮

## API 接口

### IPC 通信

```typescript
// 获取工作流列表
window.api.workflow.list(): Promise<Workflow[]>

// 获取单个工作流
window.api.workflow.findById(id: string): Promise<Workflow>

// 创建工作流
window.api.workflow.create(data): Promise<string>

// 更新工作流
window.api.workflow.update(id: string, updates): Promise<boolean>

// 删除工作流
window.api.workflow.delete(id: string): Promise<boolean>

// 执行工作流
window.api.workflow.execute(id: string, initialInputs?): Promise<string>

// 获取执行历史
window.api.workflow.getExecutionHistory(workflowId: string): Promise<WorkflowExecution[]>

// 获取节点日志
window.api.workflow.getNodeLogs(executionId: string): Promise<NodeExecutionLog[]>

// 获取节点元数据
window.api.workflow.getNodeMetadata(): Promise<any[]>

// 监听执行更新
window.api.workflow.onExecutionUpdate(callback)
```

## 数据库集成

### 表结构

```sql
-- 工作流表
CREATE TABLE workflows (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  definition TEXT NOT NULL,  -- JSON
  is_active INTEGER DEFAULT 1,
  created_at INTEGER,
  updated_at INTEGER
);

-- 执行记录表
CREATE TABLE workflow_executions (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL,
  status TEXT NOT NULL,
  start_time INTEGER NOT NULL,
  end_time INTEGER,
  error TEXT,
  node_results TEXT DEFAULT '{}',  -- JSON
  FOREIGN KEY (workflow_id) REFERENCES workflows(id)
);

-- 节点日志表
CREATE TABLE workflow_node_logs (
  id TEXT PRIMARY KEY,
  execution_id TEXT NOT NULL,
  node_id TEXT NOT NULL,
  status TEXT NOT NULL,
  start_time INTEGER,
  end_time INTEGER,
  input_data TEXT DEFAULT '{}',   -- JSON
  output_data TEXT DEFAULT '{}',  -- JSON
  error TEXT,
  FOREIGN KEY (execution_id) REFERENCES workflow_executions(id)
);
```

### 依赖注入

工作流模型已集成到 `dbContainer`:
```typescript
const workflowModel = dbContainer.resolve("workflowModel");
const executionModel = dbContainer.resolve("executionModel");
const nodeLogModel = dbContainer.resolve("nodeLogModel");
```

## 使用示例

### 创建简单工作流

```typescript
// 1. 创建工作流
const workflowId = await window.api.workflow.create({
  name: "视频处理工作流",
  description: "转码并上传到B站",
  definition: {
    nodes: [
      {
        id: "input",
        type: "file-input",
        position: { x: 100, y: 100 },
        data: {
          label: "输入文件",
          config: { filePath: "/path/to/video.flv" }
        }
      },
      {
        id: "ffmpeg",
        type: "ffmpeg-process",
        position: { x: 300, y: 100 },
        data: {
          label: "转码",
          config: { presetId: "preset-123" }
        }
      },
      {
        id: "upload",
        type: "bilibili-upload",
        position: { x: 500, y: 100 },
        data: {
          label: "上传B站",
          config: { presetId: "upload-preset-456" }
        }
      }
    ],
    edges: [
      {
        id: "e1",
        source: "input",
        target: "ffmpeg",
        sourceHandle: "filePath",
        targetHandle: "inputFile"
      },
      {
        id: "e2",
        source: "ffmpeg",
        target: "upload",
        sourceHandle: "outputFile",
        targetHandle: "videoFile"
      }
    ]
  }
});

// 2. 执行工作流
await window.api.workflow.execute(workflowId);
```

## 技术栈

- **后端**:
  - TypeScript
  - better-sqlite3 (数据库)
  - mitt (事件系统)
  - nanoid (ID生成)
  - zod (数据验证)

- **前端**:
  - Vue 3
  - Pinia (状态管理)
  - Vue Flow (可视化编辑)
  - Naive UI (UI组件)

## 下一步扩展

### 待完善功能
1. **节点配置面板**: 点击节点后显示配置表单
2. **条件节点**: if/switch 分支控制
3. **循环节点**: for/while 循环支持
4. **子工作流**: 嵌套工作流调用
5. **变量系统**: 全局变量与节点间传递
6. **错误处理**: 失败重试、错误分支
7. **事件触发**: webhook/录制事件触发工作流
8. **定时调度**: cron 表达式定时执行
9. **工作流模板**: 预设常用流程
10. **执行监控**: 实时查看执行状态

### 节点扩展建议
- **文件操作**: 复制、移动、删除、重命名
- **条件判断**: 文件大小、时长、格式检查
- **文本处理**: 正则匹配、字符串操作
- **网盘同步**: 百度网盘、阿里云盘等
- **视频下载**: M3U8、HTTP 下载器
- **FLV 修复**: 集成现有修复任务
- **视频切片**: 自动分P上传

### 性能优化
- 大型工作流渲染优化
- 执行日志分页查询
- 长时运行任务的进度推送
- 数据库索引优化

## 文件清单

### 新增文件
```
packages/shared/src/workflow/
  - types.ts
  - index.ts
  - registerNodes.ts
  - nodeRegistry.ts
  - db/workflowModel.ts
  - db/executionModel.ts
  - db/nodeLogModel.ts
  - engine/Executor.ts
  - engine/DataBus.ts
  - nodes/base/BaseNode.ts
  - nodes/triggers/FileInputNode.ts
  - nodes/processors/FfmpegProcessNode.ts
  - nodes/processors/DanmuConvertNode.ts
  - nodes/actions/BilibiliUploadNode.ts
  - nodes/actions/NotificationNode.ts
  - nodes/utils/ParallelSplitNode.ts

packages/app/src/renderer/src/
  - stores/workflow.ts
  - pages/workflow/index.vue
  - pages/workflow/editor.vue

packages/app/src/main/
  - workflowHandlers.ts
```

### 修改文件
```
packages/shared/src/db/
  - container.ts (添加工作流模型)
  - index.ts (注册节点)

packages/app/src/
  - preload/index.ts (添加 workflow API)
  - main/index.ts (注册 handlers)
```

## 兼容性

- ✅ 与现有 webhook 系统独立运行
- ✅ 复用 TaskQueue 作为执行基础
- ✅ 使用现有数据库和预设系统
- ✅ 无需修改现有业务逻辑

## License

MIT
