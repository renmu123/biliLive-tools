# 开发指南

欢迎参与 biliLive-tools 的开发！本指南将帮助你快速开始。

## 技术栈

- **桌面程序**：Electron + Vue 3 + TypeScript + Vite
- **CLI**：Node.js + TypeScript
- **后端**：Node.js + Koa + TypeScript
- **前端**：Vue 3 + TypeScript + Vite
- **数据库**：SQLite (better-sqlite3)
- **视频处理**：FFmpeg
- **弹幕处理**：DanmakuFactory

## 开发环境

### Node.js 版本

根据 `.node-version` 文件选择 Node.js 版本。

推荐使用 [nvm](https://github.com/nvm-sh/nvm) 或 [fnm](https://github.com/Schniz/fnm) 管理 Node.js 版本。

### 包管理器

项目使用 pnpm 作为包管理器，具体版本参考 `package.json` 中的相关字段。

安装 pnpm：

```bash
npm install -g pnpm@9.15.2
```

## 克隆仓库

```bash
git clone https://github.com/renmu123/biliLive-tools.git
cd biliLive-tools
```

## 安装依赖

```bash
pnpm install
pnpm run install:bin
```

### 关于 better-sqlite3

如果 `better-sqlite3` 无法安装：

1. 安装 [Visual Studio 2022](https://visualstudio.microsoft.com/zh-hans/thank-you-downloading-visual-studio/?sku=Community) 中的 C++ 工具
2. 安装 Python 3
3. 如果还是无法安装，运行：
   ```bash
   node scripts\github-ci-better-sqlite3.js
   ```

详见 [Issue #5638](https://github.com/pnpm/pnpm/issues/5638#issuecomment-1327988206)

如果你是Win，你还可能遇到报错比如`cause=fork/exec %1 is not a valid Win32 application.`，根据[提示](https://github.com/pnpm/pnpm/issues/5638#issuecomment-1327988206)修改pnpm源文件。

### 关于二进制依赖

**二进制依赖下载完成后，需要手动去设置中配置对应的可执行文件路径**

如果二进制依赖安装失败或不支持你的平台，请参考 `scripts\install-bin.js` 文件中进行下载

创建 `packages\app\resources\bin` 目录，放入以下文件：

- **DanmukuFactory**：[2.0.0](https://github.com/renmu123/DanmakuFactory)
- **FFmpeg**：[n7.1](https://github.com/yt-dlp/FFmpeg-Builds)
- **FFprobe**：[n7.1](https://github.com/yt-dlp/FFmpeg-Builds)
- **录播姬cli**：[3.3.1](https://github.com/renmu123/BililiveRecorder)
- **mesio**：[0.3.6](https://github.com/hua0512/rust-srec)
- **audiowaveform**：[1.10.2](https://github.com/bbc/audiowaveform)

同时需要在应用设置中配置可执行文件路径。

## 项目结构

```
biliLive-tools/
├── packages/
│   ├── app/              # Electron 桌面应用
│   │   ├── src/
│   │   │   ├── main/     # 主进程
│   │   │   ├── preload/  # 预加载脚本
│   │   │   └── renderer/ # 渲染进程（Vue）
│   │   └── resources/    # 资源文件
│   ├── CLI/              # 命令行工具
│   ├── http/             # HTTP 服务
│   ├── shared/           # 核心代码
│   ├── types/            # 类型定义
│   ├── BilibiliRecorder/ # B站录制
│   ├── DouYinRecorder/   # 抖音录制
│   ├── DouYuRecorder/    # 斗鱼录制
│   ├── HuYaRecorder/     # 虎牙录制
│   ├── liveManager/      # 直播管理
│   └── ...
├── docs/                 # 文档
├── docker/               # Docker 配置
└── scripts/              # 脚本
```

## 开发命令

### 桌面应用开发

```bash
# 启动开发服务器
pnpm run dev

# 构建应用
pnpm run build:app

```

### CLI 开发

```bash
# 构建 CLI
pnpm run build:cli

# 本地测试
cd packages/CLI
npm link
bililive-cli --help
```

### 运行测试

```bash
# 运行所有测试
pnpm run test

# 运行特定包的测试
cd packages/shared
pnpm run test
```

## 代码规范

### TypeScript

项目使用 TypeScript，请确保：

- 所有新代码都使用 TypeScript
- 遵循已有的类型定义风格
- 不使用 `any`，除非必要

### 代码风格

项目使用 ESLint 和 Prettier：

```bash
# 检查代码风格
pnpm run lint

# 自动修复
pnpm run lint:fix

# 格式化代码
pnpm run format
```

### 提交规范

使用 Conventional Commits 规范：

```
feat: 添加新功能
fix: 修复bug
docs: 文档更新
style: 代码风格修改
refactor: 代码重构
test: 测试相关
chore: 构建/工具相关
```

示例：

```
feat: 支持抖音直播录制
fix: 修复上传失败的问题
docs: 更新安装文档
```

## 开发流程

### 1. 创建分支

```bash
git checkout -b feature/your-feature
# 或
git checkout -b fix/your-fix
```

### 2. 开发功能

- 编写代码
- 添加测试
- 更新文档

### 3. 测试

```bash
# 运行测试
pnpm run test

# 本地测试应用
pnpm run dev
```

### 4. 提交代码

```bash
git add .
git commit -m "feat: your feature description"
```

### 5. 推送分支

```bash
git push origin feature/your-feature
```

### 6. 创建 Pull Request

在 GitHub 上创建 Pull Request。

## 测试

### 单元测试

使用 Vitest：

```typescript
import { describe, it, expect } from "vitest";

describe("MyFunction", () => {
  it("should work correctly", () => {
    expect(myFunction()).toBe("expected");
  });
});
```

### 集成测试

```typescript
describe("Integration Test", () => {
  it("should integrate correctly", async () => {
    const result = await integrateFunction();
    expect(result).toBeDefined();
  });
});
```

### 运行测试

```bash
# 运行所有测试
pnpm run test
```

## 构建

### 桌面应用构建

```bash
pnpm run build:app
```

### Docker 构建

项目使用多阶段构建的 Dockerfile，支持构建三种不同的镜像：

#### 镜像类型

1. **frontend** - 纯前端镜像
2. **backend** - 纯后端 API 镜像
3. **fullstack** - 全栈镜像（包含前端和后端）

#### 本地构建

```bash
# 构建全栈镜像（推荐）
docker build -f docker/Dockerfile --target fullstack --build-arg VITE_FULLSTACK=true --build-arg VITE_DEFAULT_SERVER=/api -t bililive-tools:local .

# 构建前端镜像
docker build -f docker/Dockerfile --target frontend -t bililive-tools-frontend:local .

# 构建后端镜像
docker build -f docker/Dockerfile --target backend -t bililive-tools-backend:local .

```

#### 镜像架构

项目构建的镜像支持以下平台：

- `linux/amd64` (x86_64)
- `linux/arm64` (aarch64)

#### CI/CD 自动构建

项目使用 GitHub Actions 自动构建和推送镜像：

- **自动触发**: 推送 tag 时自动构建所有镜像
- **手动触发**: 在 Actions 页面手动触发，构建带 `test` 标签的镜像
- **镜像仓库**: Docker Hub (`renmu1234/bililive-tools*`)

查看构建配置: `.github/workflows/docker.yml`

## 发布

发布流程：

1. 更新版本号（`package.json`）
2. 更新 CHANGELOG.md
3. 提交更改
4. 创建 Tag
5. 推送到 GitHub
6. GitHub Actions 自动构建和发布

```bash
# 更新版本
npm version patch # 或 minor, major

# 推送
git push origin master --tags
```

## 常见问题

### 依赖安装失败

1. 清理缓存：`pnpm store prune`
2. 删除 node_modules：`rm -rf node_modules`
3. 重新安装：`pnpm install`

### 编译错误

1. 检查 TypeScript 版本
2. 检查 Node.js 版本
3. 清理构建缓存
4. 重新构建

### 运行时错误

1. 检查日志文件
2. 使用调试模式
3. 查看浏览器控制台

## 相关资源

### 文档

- [Electron 文档](https://www.electronjs.org/docs)
- [Vue 3 文档](https://vuejs.org/)
- [TypeScript 文档](https://www.typescriptlang.org/)
- [Vite 文档](https://vitejs.dev/)

### 社区

- [GitHub Issues](https://github.com/renmu123/biliLive-tools/issues)
- [QQ 群](872011161)

## 贡献指南

参考 [贡献指南](./contributing.md) 了解如何贡献代码。
