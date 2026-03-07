# 工作流系统 - 已知问题与优化建议

## 待修复问题

### 1. BaseModel 继承问题

当前工作流模型中的 `update()` 和 `list()` 方法与 BaseModel 的类型签名不兼容。

**解决方案**:

- 选项 1: 不继承 BaseModel，直接使用 Database 操作
- 选项 2: 调整方法签名以符合 BaseModel 接口
- 选项 3: 使用组合而非继承

**推荐**: 选项 1，因为工作流模型有特殊的 JSON 字段处理需求

### 2. 节点实现待完善

当前节点实现为占位符，需要集成实际的任务系统:

```typescript
// TODO 项
- FfmpegProcessNode: 集成 FfmpegTask
- DanmuConvertNode: 集成 DanmuTask
- BilibiliUploadNode: 集成 BiliUploadTask
- NotificationNode: 集成通知服务
```

### 3. 路由配置

需要在 Vue Router 中添加工作流路由:

```typescript
// packages/app/src/renderer/src/router/index.ts
{
  path: '/workflow',
  component: () => import('@/pages/workflow/index.vue')
},
{
  path: '/workflow/editor/:id',
  component: () => import('@/pages/workflow/editor.vue')
}
```

### 4. 导航菜单

需要在设置页面或主菜单添加工作流入口

## 性能优化建议

### 1. 大型工作流渲染

- 使用虚拟滚动优化节点列表
- 实现节点懒加载
- 降低高频更新的 reactivity

### 2. 执行日志

- 实现日志分页查询
- 添加日志级别过滤
- 定期清理旧日志

### 3. 数据库优化

```sql
-- 推荐索引
CREATE INDEX idx_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX idx_executions_status ON workflow_executions(status);
CREATE INDEX idx_node_logs_execution_id ON workflow_node_logs(execution_id);
CREATE INDEX idx_node_logs_node_id ON workflow_node_logs(node_id);
```

## 功能扩展路线图

### Phase 1: 基础完善 (当前)

- [x] 核心架构
- [x] 基础节点实现
- [x] 可视化编辑器
- [ ] 路由和菜单集成
- [ ] 节点配置面板
- [ ] 错误提示优化

### Phase 2: 节点丰富

- [ ] 文件操作节点 (复制/移动/删除)
- [ ] 条件判断节点
- [ ] 循环节点
- [ ] 文本处理节点
- [ ] 网盘同步节点

### Phase 3: 高级功能

- [ ] 子工作流支持
- [ ] 变量系统
- [ ] 错误处理和重试
- [ ] 工作流模板
- [ ] 版本控制

### Phase 4: 集成与自动化

- [ ] Webhook 触发
- [ ] 录制事件触发
- [ ] Cron 定时调度
- [ ] 实时执行监控
- [ ] 性能统计

## 代码质量改进

### 1. 类型安全

- 为所有 any 类型添加具体类型定义
- 添加更严格的 Zod 验证
- 完善泛型约束

### 2. 错误处理

- 统一错误码和错误消息
- 添加错误上下文
- 实现错误边界

### 3. 测试覆盖

```typescript
// 推荐测试用例
- 节点执行单元测试
- DAG 拓扑排序测试
- 循环检测测试
- 并行执行测试
- 数据流转测试
```

### 4. 文档完善

- API 文档 (JSDoc)
- 节点开发指南
- 工作流最佳实践
- 故障排查指南

## 兼容性注意事项

### 1. 数据库迁移

首次运行时会自动创建工作流相关表，无需手动迁移

### 2. 与现有功能共存

- ✅ 不影响现有 webhook 系统
- ✅ 复用 TaskQueue 和预设系统
- ✅ 保持向后兼容

### 3. Electron 版本要求

- Electron >= 28
- Node.js >= 18
- better-sqlite3 >= 11

## 部署检查清单

- [ ] 安装 vue-flow 依赖: `pnpm add @vue-flow/core ...`
- [ ] 确认数据库表已创建
- [ ] 验证内置节点已注册
- [ ] 测试工作流创建和执行
- [ ] 检查日志输出
- [ ] 验证 IPC 通信正常
- [ ] 测试错误处理
- [ ] UI 响应性测试

## 贡献指南

### 添加新节点

1. 继承 BaseNode 实现节点逻辑
2. 在 registerNodes.ts 中注册
3. 添加节点图标和样式
4. 编写节点文档

### 报告问题

- 提供详细的错误日志
- 包含工作流定义 JSON
- 描述重现步骤
- 附上环境信息

## 联系方式

有问题请在 GitHub 项目中提 Issue。
