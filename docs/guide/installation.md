# 安装指南

## 桌面程序

### Windows

#### 下载

1. 访问 [GitHub Releases](https://github.com/renmu123/biliLive-tools/releases)
2. 下载最新版本的 `.exe` 安装包
3. 运行安装程序

**备用下载地址**：[夸克网盘](https://pan.quark.cn/s/6da253a1ecb8)

#### 安装

双击下载的安装包，按照向导完成安装。

#### 绿色版（Zip包）

如果你不想安装，可以下载 zip 压缩包，升级直接覆盖即可：

1. 下载 zip 压缩包
2. 解压到任意目录
3. 运行可执行文件

::: warning 注意
zip包并非传统意义上的绿色包，数据和可执行文件不会存放在同一个文件夹中。

如果想将数据放在同一个文件夹内，请在可执行文件所在文件夹创建一个名为 `portable` 的文件（无扩展名），然后重启应用。
:::

### Linux

1. 下载 `.deb` 文件
2. 运行安装

::: tip 提示
由于开发者不在Linux环境开发，测试覆盖不广，如果存在问题请提 issue。
:::

### MacOS

1. 下载文件
2. 运行安装

MacOs 版本如果要使用切片中的波形图，需要手动使用homebrew安装audiowaveform

::: tip 提示
由于开发者不在 MacOs 环境开发，测试覆盖不广，如果存在问题请提 issue。
:::

## CLI

查看 [CLI 文档](https://github.com/renmu123/biliLive-tools/tree/master/packages/CLI) 了解更多命令和选项。

## Docker

### 前后端分离

创建 `docker-compose.yml`：

```yaml
services:
  # UI镜像
  webui:
    image: renmu1234/bililive-tools-frontend
    ports:
      - "3000:3000"
  # 接口镜像
  api:
    image: renmu1234/bililive-tools-backend
    ports:
      - "18010:18010"
    volumes:
      # 映射的配置目录，用于持久化配置文件
      - ./data:/app/data
      # 存储文件的默认目录
      - ./video:/app/video
      # 字体目录
      - ./fonts:/usr/local/share/fonts
    environment:
      # 登录密钥
      - BILILIVE_TOOLS_PASSKEY=your_passkey
      # 账户加密密钥
      - BILILIVE_TOOLS_BILIKEY=your_bilikey
      # 中国时区
      - TZ=Asia/Shanghai
```

运行：

```bash
docker-compose up -d
```

访问 `http://ip地址:3000` 即可使用，如果你使用云服务，请注意打开防火墙。

![web ui 界面](/webui.png)

**其中第一项为api接口地址，注意当前网络可访问**  
**第二项为登录密钥**

:::tip
注意要部署两个镜像！！！
:::

### 单镜像

创建 `docker-compose.yml`：

```yaml
services:
  fullstack:
    image: renmu1234/bililive-tools
    ports:
      - "3000:3000"
    volumes:
      # 映射的配置目录，用于持久化配置文件
      - ./data:/app/data
      # 存储文件的默认目录
      - ./video:/app/video
      # 字体目录
      - ./fonts:/usr/local/share/fonts
    environment:
      # 登录密钥
      - BILILIVE_TOOLS_PASSKEY=your_passkey
      # 账户加密密钥
      - BILILIVE_TOOLS_BILIKEY=your_bilikey
      # 中国时区
      - TZ=Asia/Shanghai
```

运行：

```bash
docker-compose up -d
```

访问 `http://ip地址:3000` 即可使用，如果你使用云服务，请注意打开防火墙。

::: tip
此镜像中的api地址将会被代理到 `/api` 路径
:::

### 视频教程

查看 [Docker部署视频教程](https://www.bilibili.com/video/BV1HVd5YdEGh)

### 配置说明

#### 环境变量

| 变量名                   | 说明                              | 必填 |
| ------------------------ | --------------------------------- | ---- |
| `BILILIVE_TOOLS_PASSKEY` | 登录密钥，用于Web界面登录         | 是   |
| `BILILIVE_TOOLS_BILIKEY` | 账户加密密钥，用于加密B站账号信息 | 是   |
| `TZ`                     | 时区设置                          | 否   |

::: tip 提示
这些环境变量也可以在非docker生效，Windows下环境变量修改后可能需要重启电脑才能生效。
:::

#### 卷映射

| 容器路径                 | 说明                     |
| ------------------------ | ------------------------ |
| `/app/data`              | 配置文件目录             |
| `/app/video`             | 视频文件默认存储目录     |
| `/usr/local/share/fonts` | 字体目录（用于弹幕压制） |

### Webhook配置

Docker下使用Webhook需要注意存储和网络的隔离。以录播姬为例：

```yaml
services:
  webui:
    image: renmu1234/bililive-tools-frontend
    ports:
      - "3000:3000"

  api:
    image: renmu1234/bililive-tools-backend
    ports:
      - "18010:18010"
    volumes:
      - ./data:/app/data
      # 与录播姬使用相同的映射路径
      - ./video:/app/video
      - ./fonts:/usr/local/share/fonts
    environment:
      - BILILIVE_TOOLS_PASSKEY=your_passkey
      - BILILIVE_TOOLS_BILIKEY=your_bilikey
      - TZ=Asia/Shanghai

  # 录播姬
  recorder:
    image: bililive/recorder:latest
    restart: unless-stopped
    volumes:
      # 与 api 使用相同的映射路径
      - ./video:/rec
    ports:
      - "2356:2356"
    environment:
      - BREC_HTTP_BASIC_USER=用户名
      - BREC_HTTP_BASIC_PASS=密码
```

配置录播姬的 WebhookV2 地址为：`http://api:18010/webhook/bililiverecorder`

**无须在软件中设置"录播姬工作目录"**

### 硬件编码

#### Intel核显 (QSV)

参考 [Issue #59](https://github.com/renmu123/biliLive-tools/issues/59) 进行配置。

需要在 `docker-compose.yml` 中添加设备映射：

```yaml
api:
  image: renmu1234/bililive-tools-backend
  devices:
    - /dev/dri:/dev/dri
  # ... 其他配置
```

## 更新

### 桌面程序

软件会自动检查更新并提示，点击更新即可。

也可以手动下载最新版本覆盖安装。

::: warning 重要
任何版本更新前请查看[更新记录](https://github.com/renmu123/biliLive-tools/blob/master/CHANGELOG.md)，避免破坏性更新带来的问题。
:::

### Docker

```bash
docker-compose pull
docker-compose up -d
```

## 备份与恢复

### 方式一：使用界面导出

1. 打开"设置"
2. 点击"导出配置"保存备份
3. 需要恢复时点击"导入配置"

### 方式二：手动备份

找到配置文件夹，备份以下文件：

- `appConfig.json` - 应用配置
- `presets.json` - 预设配置
- `danmu_presets.json` - 弹幕预设
- `ffmpeg_presets.json` - FFmpeg预设
- `app.db` - 数据库文件
- `cover/` - 封面文件夹（可选）

::: tip 提示
恢复时直接覆盖原文件，然后重启应用。建议在恢复前备份原文件。
:::

## 卸载

### Windows

在"控制面板" -> "程序和功能"中找到 biliLive-tools，点击卸载。

::: warning
卸载后，用户数据会被自动删除
:::

## 故障排除

### 启用后接口返回`undefined`

1. 检查系统用户名是否为中文
2. 尝试使用压缩包
