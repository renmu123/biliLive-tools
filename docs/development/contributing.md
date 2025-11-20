# 贡献指南

感谢你有兴趣为 biliLive-tools 做出贡献！

## 开始之前

### 提 Issue 还是直接 PR？

- **Bug 修复**：建议先提 Issue，描述问题
- **新功能**：**必须**先提 Issue 讨论，避免重复工作或不被接受
- **文档改进**：可以直接提 PR
- **代码优化**：建议先提 Issue 讨论

::: tip 提示
提 PR 前，最好先提一个 Issue，以防重复或者 PR 不被接收。
:::

## 贡献方式

### 1. 报告 Bug

发现 Bug？请提交 Issue：

1. 访问 [Issues](https://github.com/renmu123/biliLive-tools/issues)
2. 点击 "New Issue"
3. 选择 "Bug Report" 模板
4. 填写详细信息

**Bug 报告应包含**：

- 软件版本
- 操作系统
- 重现步骤
- 预期行为
- 实际行为
- 错误日志（如有）
- 截图（如有）

### 2. 提出功能建议

有好的想法？提交 Feature Request：

1. 访问 [Issues](https://github.com/renmu123/biliLive-tools/issues)
2. 点击 "New Issue"
3. 选择 "Feature Request" 模板
4. 描述你的建议

**功能建议应包含**：

- 功能描述
- 使用场景
- 为什么需要这个功能
- 可能的实现方式（可选）

### 3. 改进文档

文档永远不够完善，欢迎：

- 修正错别字
- 补充说明
- 添加示例
- 翻译文档

### 4. 贡献代码

参与代码开发：

- 修复 Bug
- 实现新功能
- 优化性能
- 重构代码

## 开发流程

### 1. Fork 项目

在 GitHub 上 Fork 项目到你的账号。

### 2. 克隆仓库

```bash
git clone https://github.com/your-username/biliLive-tools.git
cd biliLive-tools
```

### 3. 添加上游仓库

```bash
git remote add upstream https://github.com/renmu123/biliLive-tools.git
```

### 4. 创建分支

```bash
git checkout -b feature/your-feature-name
# 或
git checkout -b fix/your-bug-fix
```

分支命名规范：

- `feature/` - 新功能
- `fix/` - Bug 修复
- `docs/` - 文档更新
- `refactor/` - 代码重构
- `test/` - 测试相关
- `chore/` - 构建/工具相关

### 5. 开发

参考 [开发指南](./guide.md) 进行开发。

#### 代码规范

- 遵循项目的代码风格
- 使用 TypeScript
- 添加必要的注释
- 编写测试（如适用）

#### 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type**：

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（不影响代码运行）
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具相关
- `perf`: 性能优化

**示例**：

```
feat(recorder): 支持抖音直播录制

- 添加抖音API接口
- 实现直播状态监听
- 支持弹幕录制

Closes #123
```

### 6. 同步上游

定期同步上游更新：

```bash
git fetch upstream
git rebase upstream/master
```

### 7. 测试

提交前确保：

```bash
# 代码检查
pnpm run lint

# 运行测试
pnpm run test

# 本地构建
pnpm run build
```

### 8. 提交代码

```bash
git add .
git commit -m "feat: your feature description"
```

### 9. 推送分支

```bash
git push origin feature/your-feature-name
```

### 10. 创建 Pull Request

1. 访问你 Fork 的仓库
2. 点击 "Compare & pull request"
3. 填写 PR 描述
4. 提交 PR

## Pull Request 指南

### PR 标题

使用清晰的标题，遵循 Conventional Commits：

```
feat: 添加抖音直播录制功能
fix: 修复上传失败的问题
docs: 更新安装文档
```

### PR 描述

**应包含**：

- 改动说明
- 解决的问题（如果有，关联 Issue）
- 测试情况
- 截图（如果是 UI 改动）
- Breaking Changes（如果有）

**模板**：

```markdown
## 改动说明

简要描述这个 PR 做了什么

## 相关 Issue

Closes #123

## 测试

- [ ] 本地测试通过
- [ ] 添加了测试用例
- [ ] 文档已更新

## 截图（如有）

## Breaking Changes（如有）
```

### PR 检查清单

提交前检查：

- [ ] 代码遵循项目规范
- [ ] 添加了必要的测试
- [ ] 所有测试通过
- [ ] 文档已更新
- [ ] 提交信息清晰
- [ ] 没有不必要的文件改动
- [ ] 代码已经过自测

## 代码审查

### 审查流程

1. 提交 PR 后，维护者会进行审查
2. 可能会提出修改建议
3. 根据反馈修改代码
4. 再次推送更新
5. 审查通过后合并

### 响应反馈

- 及时响应审查意见
- 友好讨论技术问题
- 必要时解释设计决策
- 接受建设性批评

### 常见审查意见

- 代码风格问题
- 缺少测试
- 文档不完善
- 性能问题
- 安全问题
- 兼容性问题

## 社区准则

### 行为准则

- 友好、尊重、包容
- 欢迎新手提问
- 接受建设性批评
- 专注于技术讨论
- 禁止人身攻击

### 沟通方式

- **GitHub Issues**：Bug 报告、功能建议
- **GitHub Discussions**：一般性讨论
- **Pull Requests**：代码审查讨论
- **QQ 群**：快速交流

## 获得帮助

### 新手指南

第一次贡献开源项目？

- 阅读 [GitHub 开源指南](https://opensource.guide/zh-hans/)
- 从简单的 Issue 开始
- 查看标记为 `good first issue` 的 Issue

### 提问

提问前：

1. 搜索是否已有相同问题
2. 查看文档
3. 尝试自己解决

提问时：

- 清晰描述问题
- 提供必要信息
- 展示你的尝试

### 寻求帮助

- 在 Issue 中 @ 维护者
- 加入 QQ 群交流
- 查看开发文档

## 许可证

贡献代码即表示你同意：

- 你的贡献将在 GPL-3.0 许可证下发布
- 你拥有贡献代码的权利
- 你的贡献不侵犯他人权利

## 致谢

感谢所有贡献者！你们的贡献让这个项目变得更好。

查看 [贡献者列表](https://github.com/renmu123/biliLive-tools/graphs/contributors)。

## 联系方式

- GitHub: [@renmu123](https://github.com/renmu123)
- B站: [@renmu123](https://space.bilibili.com/10995238)
- QQ群: 872011161
