# 常见问题 (FAQ)

## 安装与配置

### Q: zip包和安装包有什么区别？

zip包并非传统意义上的绿色包，数据和可执行文件不会存放在同一个文件夹中。

如果想将数据放在同一个文件夹内，请在可执行文件所在文件夹创建一个名为 `portable` 的文件（无扩展名），然后重启应用。

### Q: 使用zip包后安装包无法使用怎么办？

zip包和安装包的二进制文件路径可能不同，导致路径错误：

1. 打开"设置" -> "二进制文件"
2. 手动修改 FFmpeg、FFprobe、DanmakuFactory 路径
3. 重启应用

### Q: 如何备份配置？

**方式一：使用界面**

1. 打开"设置"
2. 点击"导出配置"
3. 保存备份文件

**方式二：手动备份**

找到配置文件夹，备份以下文件：

- `appConfig.json` - 应用配置
- `presets.json` - 预设配置
- `danmu_presets.json` - 弹幕预设
- `ffmpeg_presets.json` - FFmpeg预设
- `app.db` - 数据库文件
- `cover/` - 封面文件夹

### Q: 更改部分配置不生效？

- 绝大部分配置修改后**立即生效**
- 某部分配置只对**当场直播生效**
- 小部分配置**重启后生效**

### Q: 支持哪些环境变量？

| 变量名                   | 说明            |
| ------------------------ | --------------- |
| `BILILIVE_TOOLS_BILIKEY` | B站账号加密密钥 |
| `BILILIVE_TOOLS_PASSKEY` | 登录鉴权密钥    |

::: tip 提示
Windows下环境变量修改后可能需要重启电脑才能生效。
:::

## 视频处理

### Q: 如何查看原始 FFmpeg 命令输出？

压制完成后，在任务列表中查看日志。

### Q: 如何评估压制速度？

进入队列页面，查看任务最后一栏的速率。可以根据速率调整压制参数。

### Q: 压制预设如何设置？

1. 根据硬件选择对应的编码器
2. 推荐使用 CRF 或 CQ 等质量模式的默认参数
3. 压制后查看视频大小、时间、画质
4. 调整参数以满足需求

没有最好的参数，只有最合适的参数。不同视频、不同场景可能需要不同参数。

进阶请自行搜索 FFmpeg 相关教程。

### Q: NVENC 或其他硬件转码无法正常使用？

1. 更新显卡驱动到最新版本
2. 如果仍然无法使用，尝试手动更换 FFmpeg 可执行文件为 6.0 版本

::: warning 注意
自定义 FFmpeg 后部分功能可能会无法使用。
:::

### Q: FLV修复失败怎么办？

1. 尝试使用录播姬引擎进行修复
2. 尝试使用 mesio 录制器
3. 检查原文件是否损坏
4. 使用专业工具如 [FLV Extract](https://www.videohelp.com/software/FLV-Extract)

## B站上传

### Q: 上传提示输入验证码？

说明你上传过多触发风控了：

1. 去 [B站投稿页面](https://member.bilibili.com/platform/upload/video/frame) 解除风控
2. 减少上传频率
3. 等待一段时间再尝试

### Q: 频繁上传失败怎么办？

1. 升级软件到最新版本
2. 增加重试次数和时间
3. 尝试手动选择并测试上传线路
4. 尝试关闭 IPv6
5. 尝试手动修改 DNS
6. 可能已被运营商限速
7. 国外服务器请尝试使用 `qn` 线路

### Q: 显示的上传/下载速度不准确？

所有相关速度仅限参考，非精确值。

### Q: 有时上传和下载任务点击暂停无效？

**上传任务**分为三个阶段，只有第二阶段支持暂停：

1. 获取上传基础信息（不可暂停）
2. 文件切片上传（可暂停）
3. 文件合并，调用提交接口（不可暂停、不可取消）

**下载任务**分为三个阶段，只有第二阶段支持暂停：

1. 获取下载文件基础信息（不可暂停）
2. 文件切片下载（可暂停）
3. 文件合并（不可暂停）

## 直播录制

### Q: 添加大量直播间后无法录制？

可能已被平台风控：

1. 关闭软件等待风控解除
2. 减少直播间数量
3. 加大检查间隔
4. 检查网络连接
5. 检查硬盘读写

### Q: 录制电台直播时帧数过低？

如果需要压制弹幕，请尝试手动指定帧数参数。

### Q: 分辨率变化后不会切割？

设计如此。如果播放器不支持多分辨率：

- 使用 VLC 播放器
- 或尝试使用 `mesio` 录制器

### Q: 抖音风控怎么办？

1. 调大监听间隔
2. 修改 API 接口（参考 [直播录制文档](./features/live-record.md#抖音特殊功能)）

### Q: 录制如何转换为MP4？

1. 单个直播间配置打开"发送至webhook"
2. "设置" -> "Webhook" 打开webhook开关
3. "设置" -> "Webhook" -> "转封装为mp4" 打开开关

### Q: 如何为不同直播间配置不同存储路径？

`文件命名规则` 支持 [ejs](https://ejs.co/) 模板引擎。

示例：斗鱼与其他站点保存在不同盘符

```
<% if (platform=='斗鱼') { %>C<% } %><% if (platform!='斗鱼') { %>D<% } %>:\录制\{platform}/{owner}/{year}-{month}-{date} {hour}-{min}-{sec} {title}
```

::: tip 提示
将 `保存文件夹` 置空，将全部路径配置在 `文件命名规则` 中。
:::

## 弹幕处理

### Q: 弹幕转换失败？

Windows 新安装的系统可能缺少运行库：

1. 安装 [Visual C++ Redistributable](https://aka.ms/vs/17/release/vc_redist.x64.exe)
2. 重启应用

### Q: 字体问题？

- Web 和客户端使用的字体方式不同，会有差异
- 某些字体在 Web 中选择后可能无法使用
- Docker 下的 emoji 文本渲染可能错误

## Webhook

### Q: blrec开启转换为mp4后无法使用？

请关闭 blrec 的该功能，使用本软件的"转封装为mp4"功能。

### Q: Webhook标题模板引擎如何使用？

支持 [ejs模板引擎](https://github.com/mde/ejs)，可用参数：

```typescript
{
  title: string; // 直播间标题
  user: string; // 主播名称
  time: Date; // 直播开始时间
  roomId: number | string; // 房间号
}
```

示例：

```
<%= user %>-<%= time.getFullYear() %><%= String(time.getMonth() + 1).padStart(2, "0") %>直播录像
```

渲染结果：`djw-202408直播录像`

::: warning 注意
标题超过80字会被自动截断。
:::

## 任务与队列

### Q: 最大任务数如何理解？

1. 手动暂停的任务不会被自动启动
2. 高能进度条任务会自动进行（速度很快）

### Q: 如何查看任务日志？

在队列页面点击任务，可以查看详细日志和 FFmpeg 输出。

## Docker

### Q: Docker下Webhook如何配置？

由于存储和网络的隔离，需要特别注意：

1. **无须设置工作目录**
2. **卷映射必须一致**
3. **使用服务名访问**（如 `http://api:18010/webhook/...`）

参考 [安装指南 - Docker](./guide/installation.md#docker) 中的完整示例。

### Q: Docker下硬件编码如何配置？

参考 [安装指南 - 硬件编码](./guide/installation.md#硬件编码)。

## 其他

### Q: 这个软件的录制太难用了，有其他推荐吗？

biliLive-tools 的录制功能主要用于与其他功能集成。如果只需录制，推荐专业工具：

| 工具                                                               | 特点           | 协议       |
| ------------------------------------------------------------------ | -------------- | ---------- |
| [录播姬](https://github.com/BililiveRecorder/BililiveRecorder)     | B站FLV流最稳   | GPL-3.0    |
| [biliup](https://github.com/biliup/biliup)                         | 支持上传、弹幕 | MIT        |
| [DouyinLiveRecorder](https://github.com/ihmily/DouyinLiveRecorder) | 多平台、无GUI  | MIT        |
| [StreamCap](https://github.com/ihmily/StreamCap)                   | 多平台、有GUI  | Apache 2.0 |
| [stream-rec](https://github.com/stream-rec/stream-rec)             | 自实现引擎     | MIT        |
| [oneliverec](https://www.oneliverec.cc/zh-cn/)                     | 多平台         | 闭源免费   |

### Q: 如何联系开发者？

- QQ群：872011161
- GitHub Issues：[提交问题](https://github.com/renmu123/biliLive-tools/issues)
- B站：[@renmu123](https://space.bilibili.com/10995238)

### Q: 如何贡献代码？

欢迎提交 Pull Request！提交前请：

1. 先提一个 Issue 讨论
2. 遵循项目代码风格
3. 添加必要的测试
4. 更新相关文档

参考 [贡献指南](./development/contributing.md)。

### Q: 软件是否收费？

完全免费且开源，遵循 GPL-3.0 协议。

如果觉得有帮助，欢迎：

- [爱发电赞赏](https://afdian.com/a/renmu123)
- [B站充电](https://space.bilibili.com/10995238)
- 在视频简介标注项目地址

### Q: 软件会收集我的数据吗？

**不会**。本软件不存在任何数据追踪和上报。

所有数据都存储在本地，不会发送到任何服务器。

### Q: 为什么希望标注仓库地址？

软件不做任何数据追踪，作者想大致了解使用人群和使用情况，方便更好地改进软件。

## 更多问题

如果以上没有解决你的问题：

1. 查看 [视频教程](https://www.bilibili.com/video/BV1Hs421M755/)
2. 加入 QQ群：872011161
3. 提交 [GitHub Issue](https://github.com/renmu123/biliLive-tools/issues)
4. 查看 [更新日志](https://github.com/renmu123/biliLive-tools/blob/master/CHANGELOG.md)
