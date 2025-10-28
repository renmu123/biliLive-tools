# 环境变量

biliLive-tools 支持通过环境变量进行配置。

## 支持的环境变量

### BILILIVE_TOOLS_PASSKEY

**用途**：登录鉴权密钥

**说明**：用于 Web 界面和 API 的登录验证

**默认值**：无（首次启动时自动生成）

**示例**：

```bash
# Windows PowerShell
$env:BILILIVE_TOOLS_PASSKEY="your_secret_key"

# Linux/Mac
export BILILIVE_TOOLS_PASSKEY="your_secret_key"

# Docker
environment:
  - BILILIVE_TOOLS_PASSKEY=your_secret_key
```

**注意事项**：

- 首次启动时如果未设置，会自动生成随机密钥
- 修改后需要重启应用
- 请使用强密码，不要使用简单密码
- 不要分享给他人

### BILILIVE_TOOLS_BILIKEY

**用途**：B站账号加密密钥

**说明**：用于加密存储B站账号的Cookie等敏感信息

**默认值**：无（首次启动时自动生成）

**示例**：

```bash
# Windows PowerShell
$env:BILILIVE_TOOLS_BILIKEY="your_encryption_key"

# Linux/Mac
export BILILIVE_TOOLS_BILIKEY="your_encryption_key"

# Docker
environment:
  - BILILIVE_TOOLS_BILIKEY=your_encryption_key
```

**注意事项**：

- **在添加B站账号前设置**，否则需要重新登录
- 修改后已有账号需要重新登录
- 请使用强密码
- 不要分享给他人
- 丢失后无法恢复已保存的账号信息

::: danger 重要
`BILILIVE_TOOLS_BILIKEY` 用于加密B站账号信息，设置后不要修改！
如果丢失或修改，已保存的账号信息将无法解密，需要重新登录所有账号。
:::

### TZ

**用途**：时区设置

**说明**：设置应用的时区，影响日志时间、文件命名等

**默认值**：系统时区

**示例**：

```bash
# Windows PowerShell
$env:TZ="Asia/Shanghai"

# Linux/Mac
export TZ="Asia/Shanghai"

# Docker
environment:
  - TZ=Asia/Shanghai
```

**常用时区**：

- 中国：`Asia/Shanghai`
- 美国东部：`America/New_York`
- 美国西部：`America/Los_Angeles`
- 日本：`Asia/Tokyo`
- 欧洲中部：`Europe/Berlin`

## Windows 环境变量设置

### 方式一：通过系统设置

1. 右键"此电脑" -> "属性"
2. 点击"高级系统设置"
3. 点击"环境变量"
4. 在"用户变量"或"系统变量"中添加
5. 重启应用（可能需要重启电脑）

### 方式二：通过 PowerShell

**临时设置**（仅当前会话有效）：

```powershell
$env:BILILIVE_TOOLS_PASSKEY="your_secret_key"
$env:BILILIVE_TOOLS_BILIKEY="your_encryption_key"
```

**永久设置**（用户级别）：

```powershell
[System.Environment]::SetEnvironmentVariable("BILILIVE_TOOLS_PASSKEY", "your_secret_key", "User")
[System.Environment]::SetEnvironmentVariable("BILILIVE_TOOLS_BILIKEY", "your_encryption_key", "User")
```

**永久设置**（系统级别，需要管理员权限）：

```powershell
[System.Environment]::SetEnvironmentVariable("BILILIVE_TOOLS_PASSKEY", "your_secret_key", "Machine")
[System.Environment]::SetEnvironmentVariable("BILILIVE_TOOLS_BILIKEY", "your_encryption_key", "Machine")
```

::: tip 提示
Windows 下修改环境变量后可能需要重启电脑才能生效。
:::

## Linux/Mac 环境变量设置

### 临时设置

```bash
export BILILIVE_TOOLS_PASSKEY="your_secret_key"
export BILILIVE_TOOLS_BILIKEY="your_encryption_key"
export TZ="Asia/Shanghai"
```

### 永久设置

编辑 `~/.bashrc` 或 `~/.zshrc`：

```bash
echo 'export BILILIVE_TOOLS_PASSKEY="your_secret_key"' >> ~/.bashrc
echo 'export BILILIVE_TOOLS_BILIKEY="your_encryption_key"' >> ~/.bashrc
echo 'export TZ="Asia/Shanghai"' >> ~/.bashrc

# 重新加载配置
source ~/.bashrc
```

## Docker 环境变量设置

### docker-compose.yml

```yaml
services:
  api:
    image: renmu1234/bililive-tools-backend
    environment:
      - BILILIVE_TOOLS_PASSKEY=your_secret_key
      - BILILIVE_TOOLS_BILIKEY=your_encryption_key
      - TZ=Asia/Shanghai
```

### docker run

```bash
docker run -d \
  -e BILILIVE_TOOLS_PASSKEY="your_secret_key" \
  -e BILILIVE_TOOLS_BILIKEY="your_encryption_key" \
  -e TZ="Asia/Shanghai" \
  renmu1234/bililive-tools-backend
```

### .env 文件

创建 `.env` 文件：

```env
BILILIVE_TOOLS_PASSKEY=your_secret_key
BILILIVE_TOOLS_BILIKEY=your_encryption_key
TZ=Asia/Shanghai
```

在 `docker-compose.yml` 中引用：

```yaml
services:
  api:
    image: renmu1234/bililive-tools-backend
    env_file:
      - .env
```

## 安全建议

### 1. 使用强密码

**不推荐**：

```
123456
password
admin
```

**推荐**：

```
aB3$dF6#hJ9@mN2
X7y$Pq9@Rt5#Wz2
```

可以使用密码生成器生成强密码。

### 2. 定期更换

建议定期更换密钥，特别是 `BILILIVE_TOOLS_PASSKEY`。

更换 `BILILIVE_TOOLS_BILIKEY` 会导致已保存的账号失效。

### 3. 不要硬编码

不要将密钥硬编码在代码或配置文件中，使用环境变量。

### 4. 不要分享

不要将密钥分享给他人，不要提交到版本控制系统。

### 5. 使用 .env 文件

对于 Docker 部署，使用 `.env` 文件管理环境变量，并将其添加到 `.gitignore`。

```
# .gitignore
.env
```

## 查看当前环境变量

### Windows PowerShell

```powershell
# 查看单个变量
$env:BILILIVE_TOOLS_PASSKEY

# 查看所有环境变量
Get-ChildItem Env: | Where-Object { $_.Name -like "BILILIVE_*" }
```

### Linux/Mac

```bash
# 查看单个变量
echo $BILILIVE_TOOLS_PASSKEY

# 查看所有相关变量
env | grep BILILIVE_
```

### Docker

```bash
# 查看容器内的环境变量
docker exec <container_id> env | grep BILILIVE_
```

## 故障排除

### 环境变量不生效

**Windows**：

1. 检查是否重启应用
2. 可能需要重启电脑
3. 检查是设置的用户变量还是系统变量

**Linux/Mac**：

1. 检查是否 source 配置文件
2. 检查是否在正确的配置文件中设置
3. 重新打开终端

**Docker**：

1. 检查 docker-compose.yml 语法
2. 重新启动容器
3. 使用 `docker inspect` 检查环境变量

### 密钥丢失

**BILILIVE_TOOLS_PASSKEY**：

- 可以重新设置
- 需要使用新密钥重新登录

**BILILIVE_TOOLS_BILIKEY**：

- 丢失后无法恢复已保存的账号
- 需要清除账号数据并重新登录
- 建议提前备份

### 密钥错误

如果设置了错误的密钥：

1. 停止应用
2. 修改环境变量
3. 重启应用

如果是 `BILILIVE_TOOLS_BILIKEY` 错误，可能需要：

1. 清除账号数据
2. 重新设置正确的密钥
3. 重新登录所有账号

## 最佳实践

### 1. 首次部署时设置

在首次部署前设置好所有环境变量，避免后续修改带来的问题。

### 2. 使用配置管理

对于生产环境，使用专业的配置管理工具：

- Kubernetes Secrets
- Docker Secrets
- Ansible Vault
- 等等...

### 3. 备份密钥

将密钥保存在安全的地方：

- 密码管理器
- 加密的配置文件
- 安全的笔记

### 4. 文档记录

记录环境变量的用途和设置位置，方便团队协作。

### 5. 分环境管理

不同环境使用不同的密钥：

- 开发环境
- 测试环境
- 生产环境

## 下一步

- [Webhook API](./webhook.md) - Webhook API 文档
- [安装指南](../guide/installation.md) - 安装说明
- [Docker部署](../guide/installation.md#docker) - Docker 部署指南
