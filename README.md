# biliLive-tools

![Downloads](https://img.shields.io/github/downloads/renmu123/biliLive-tools/total)

这是一个直播的一站式工具，支持弹幕转换与视频压制并上传至B站，支持斗鱼、虎牙、B站、抖音直播录制，支持[B站录播姬](https://github.com/BililiveRecorder)、[blrec](https://github.com/acgnhiki/blrec)、[DDTV](https://github.com/CHKZL/DDTV)的webhook。  
如果你是录播man正在寻找xml弹幕转换、弹幕压制、webhook上传工具，如果你是切片man正在寻找下载录播视频工具，如果你厌倦了b站的多p上传，你可以来试试本软件。  
做这款工具的初衷是为了解决录播工具的碎片化，往往想完整处理一场带有弹幕的录播要使用多个软件的配合，一些工具只有CLI，加大了使用难度。  
软件的目标是开箱即用，体验优先，默认配置下满足大部分人使用需求，同时支持个性化需求来增加可用性。  
你可以在B站查看[系列教程](https://www.bilibili.com/video/BV1Hs421M755/)

# 功能介绍

- 支持斗鱼、虎牙、B站、抖音多平台直播录制，支持ffmpeg、mesio、录播姬多种录制引擎，支持弹幕录制及更多高级选项
- 支持录播姬、blrec、DDTV、onelivrec等多个平台的webhook自动化处理
- 支持录制文件自动压制弹幕、B站上传、同步至网盘
- 支持任意录制平台基于文件监听的自动化支持
- 支持基于Danmakufactory的现代化XML文件转ASS的GUI
- 支持利用弹幕及高能点进行视频粗剪
- 支持批量进行视频压制、转码、合并、FLV文件修复
- 支持自动下载搬运斗鱼、虎牙录播至B站
- 支持下载斗鱼、虎牙、B站、快手的直播录像
- 支持多种类型的通知

**如果你使用了本软件，希望你在简介标注仓库地址或保留默认tag，本软件不存在任何数据追踪，我想大致知道使用使用人群及情况**

![preview](./docs/public/preview.png)

# 在线文档

文档地址：https://docs.irenmu.com

# 更新历史

[更新历史](https://github.com/renmu123/biliLive-tools/blob/master/CHANGELOG.md)

# 安装

客户端可直接在 [release](https://github.com/renmu123/biliLive-tools/releases) 中下载，更多内容见[文档](https://docs.irenmu.com/guide/installation.html)

# 常见问题

## 支持的环境变量

windows下环境变量修改后可能需要重启电脑方能生效

### B站登录自定义密钥加密

可以使用环境变量`BILILIVE_TOOLS_BILIKEY`自定义账号密钥，自定义前请先退出原有全部账号。

### 鉴权密钥

通过环境变量`BILILIVE_TOOLS_PASSKEY`自定义登录密钥

## 压制预设如何设置

~~我也不知道~~  
如果你是一个小白，先根据自己的硬件选择对应的编码，推荐使用crf或cq等质量模式的默认参数，压制后查看视频大小，压制时间，画质，接下来调整参数，以满足你的需求，没有最好的参数，只有最合适的参数，不同视频，不同场景可能合适的参数都不一致。  
进阶请自行搜索ffmpeg相关的教程

## nvnec或其他硬件转码无法正常使用

请尝试更新显卡驱动，如果更新到最新后还无法使用，请尝试手动更换ffmpeg可执行文件为6.0，自定义后部分功能可能会无法使用

## 上传提示输入验证码

说明你上传过多装上风控了，请去web端端投稿解除风控

## 有时上传和下载任务点击暂停无效

上传任务分为三个阶段，只有第二个阶段是支持暂停的，第三节阶段不支持取消：

1. 获取上传基础信息
2. 文件切片上传
3. 文件合并，调用提交接口

下载任务分为三个阶段，只有第二个阶段是支持暂停的：

1. 获取下载文件基础信息
2. 文件切片下载
3. 文件合并

## 怎么评估压制的速度

进入队列，查看任务最后一栏的速率，可以根据速率调整压制参数

## 如何查看原始ffmpeg命令输出

压制之后查看log

## 最大任务数

1. 手动暂停的任务不会被自动启动
2. 高能进度条任务会自动进行，因为速度会很快

## 更改部分配置不生效

绝大部分配置修改后生效、某部分配置只对当场直播生效、小部分配置重启后生效

## 频繁上传失败怎么办

1. 升级软件到最新版本
2. 增加重试次数和时间
3. 尝试手动选择并测试上传路线
4. 尝试关闭ipv6
5. 尝试手动修改dns
6. 你已经被运营商限速了
7. 国外服务器请尝试使用 `qn` 线路

## 显示的上传下载速度不准确

所有相关速度仅限参考~

# 交流地址

交流 QQ 群：872011161

# 开发

具体见内容 [文档](https://docs.irenmu.com/development/guide.html)

## 关于PR

提 PR 前，最好先提一个 issue，以防重复或者 PR 不被接收

## Build

```bash
# APP应用，如果需要分发也可以在github action进行自动编译
$ pnpm run build:app
# CLI应用
$ pnpm run build:cli
# docker
# 相关文件在`docker`文件夹下
```

## WebUI项目地址

为github actions自动编译

地址：https://github.com/renmu123/biliLive-webui

## 直播录制相关库

- [录制管理](https://www.npmjs.com/package/@bililive-tools/manager)
- [B站录制](https://www.npmjs.com/package/@bililive-tools/bilibili-recorder)
- [斗鱼录制](https://www.npmjs.com/package/@bililive-tools/douyu-recorder)
- [虎牙录制](https://www.npmjs.com/package/@bililive-tools/huya-recorder)
- [抖音录制](https://www.npmjs.com/package/@bililive-tools/douyin-recorder)
- [虎牙弹幕监听](https://www.npmjs.com/package/huya-danma-listener)
- [抖音弹幕监听](https://www.npmjs.com/package/huya-danma-listener)

# 赞赏

如果本项目对你有帮助，请我喝瓶快乐水吧，有助于项目更好维护。  
爱发电：[https://afdian.com/a/renmu123](https://afdian.com/a/renmu123)  
你也可以给我的 B 站帐号 [充电](https://space.bilibili.com/10995238)

# License

GPLv3

# 参考资料 & 鸣谢

<ul>
  <li>
    <a href="https://github.com/hihkm/DanmakuFactory" class="external" target="_blank"
      >DanmakuFactory</a
    >
  </li>
  <li>
    <a href="https://github.com/biliup/biliup-rs" class="external" target="_blank"
      >biliup-rs</a
    >
  </li>
  <li>
    <a
      href="https://github.com/BililiveRecorder/BililiveRecorder"
      class="external"
      target="_blank"
      >BililiveRecorder</a
    >
  </li>
  <li>
    <a href="https://github.com/renmu123/biliAPI" class="external" target="_blank">biliAPI</a>
  </li>
  <li>
    <a href="https://github.com/WhiteMinds/LiveAutoRecord" class="external" target="_blank"
      >LiveAutoRecord</a
    >
  </li>
</ul>
