# biliLive-tools

这是一个用于 B 站录播的一站式工具，支持弹幕与视频压制并上传至B站，支持录播姬与blrec的webhook。  
如果你是录播man正在寻找xml弹幕转换、弹幕压制、webhook上传工具，如果你是切片man正在寻找下载b站软件以及粗剪工具，如果你厌倦了b站的多p上传，你可以来试试本软件。  
做这款工具的初衷是为了解决录播工具的碎片化，往往想完整处理一场带有弹幕的录播要使用多个软件的配合，一些工具只有CLI，加大了使用难度。

**如果你使用了本软件，希望你在简介标注仓库地址或保留默认tag，本软件不存在任何数据追踪，我想大致知道使用使用人群及情况**

[更新历史](https://github.com/renmu123/biliLive-tools/blob/master/CHANGELOG.md)

1. 支持 Danmufactory GUI
2. 支持 ffmpeg 转封装
3. 支持视频与弹幕压制
4. 支持b站投稿
5. 支持录播姬与blrec的webhook
6. 支持B站视频下载

![preview](./docs/preview.png)

# 下载

目前有两个 Win 版本的包。两个包除了是否打包 `ffmpeg` 和 `ffprobe` 之外没有任何代码上的区别，如果你有自己编译的ffmpeg或者不需要用到相应的ffmpeg功能。  
如果你是普通用户，那就选择体积大的那个包，如果你是资深用户，那么请自行选择，因使用自定义 `ffmpeg` 出问题的 issue 是不会被处理的。

不提供 MacOS 和 Linux 安装包，需要的可以自行编译，编译时需要替换用到的二进制文件。

下载地址：https://github.com/renmu123/biliLive-tools/releases  
备用：https://www.alipan.com/s/iRyhxjdqGeL

## 断播续传

这个功能主要用于解决：由于主播的自身或录制端的网络原因导致录播片段被切割成多个。  
开启后，会将主播的一场直播上传到同一个视频中  
一场直播的定义：同一个主播，本次文件创建时间与上一个文件结束写入时间如果相差10分钟，那么会被定义为一场直播，不会使用webhook中比如录播姬的session定义。  
如果在主播录制后，或反复切换开关，可能会有奇怪的错误。  
如果出现bug，将设置中的日志等级调整为`debug`后复现然后进行反馈。

## 通知

**使用通知功能时，请妥善保存所有信息，请勿分享给他人，本软件不会发送任何信息到任何服务器**

## 邮箱

使用smtp服务来发送邮件，每个邮件服务商的参数各不相同，使用请自行参照各服务商的教程。

## server酱

serer酱支持免费推送信息到手机微信，免费账户有限制。

官网：https://sct.ftqq.com/

## tg bot

使用tg bot发送信息时默认使用系统代理。

tg bot 的搭建请自行寻找教程

## 自定义Webhook

如果想接入webhook相关功能，你可以自行构造参数并调用接口，采用`post`方法，端口为`/custom`，接收后立刻返回code=200。

参数：
`event`: `FileClosed`|`FileOpening` (如果你想使用断播续传功能，请在上一个`FileClosed`事件后在时间间隔内发送`FileOpening`事件)  
`filePath`: 视频文件的绝对路径，如果有弹幕，请保存文件名一致，仅支持`xml`文件  
`coverPath`: 视频封面的绝对路径，如果为空，会读取与视频文件名相同的后缀为`jpg`的文件，支持为空  
`danmuPath`: 视频弹幕`xml`文件，如果为空，会读取与视频文件名相同的`xml`文件，支持为空  
`roomId`: 数字类型，房间号，用于断播续传需要  
`time`: 用于标题格式化的时间，示例："2021-05-14T17:52:54.946"  
`title`: 标题，用于格式化视频标题  
`username`：主播名称，用于格式化视频标题

示例：

```bash
curl --location 'http://127.0.0.1:18010/custom' \
--header 'Content-Type: application/json' \
--data '{
    "event":"FileClosed",
    "filePath":"D:\\aa.mp4",
    "coverPath":"D:\\aa.jpg",
    "danmuPath":"D:\\aa.xml",
    "roomId":93589,
    "time":"2021-05-14T17:52:54.946",
    "title":"我是猪",
    "username":"djw"
}'
```

# 赞赏

如果本项目对你有帮助，请我喝瓶快乐水吧，有助于项目更好维护。  
爱发电：[https://afdian.net/a/renmu123](https://afdian.net/a/renmu123)  
你也可以给我的 B 站帐号 [充电](https://space.bilibili.com/10995238)

# 常见问题

## blrec开启转换为mp4后无法使用

请关闭该功能，使用本软件的“转封装为mp4”功能

## 有时上传和下载任务点击暂停无效

上传任务分为三个阶段，只有第二个阶段是支持暂停的：

1. 获取上传基础信息
2. 文件切片上传
3. 文件合并，调用提交接口

下载任务分为三个阶段，只有第二个阶段是支持暂停的：

1. 获取下载文件基础信息
2. 文件切片下载
3. 文件合并

# TODO

- [x] 支持使用ffmpeg压制弹幕至视频文件
- [ ] 工具页面
  - [x] 支持ffmpeg不同cpu，gpu以及相关配置
  - [x] 支持使用danmufactory自动处理xml文件并进行压制
  - [x] 工具页面，danmufactory的GUI
  - [x] 工具页面，flv的转封装
  - [x] 支持视频合并
  - [x] 下载页面
  - [ ] 根据弹幕切片
- [x] log记录及其展示
- [x] 配置持久化，压制高能进度条
- [x] B站上传支持
  - [ ] 移除biliup二进制文件依赖
  - [x] 支持分p
  - [x] 多账户支持
- [ ] webhook支持
  - [x] 录播姬webhook支持
  - [x] blrec webhook支持
  - [x] 支持自动上传
  - [x] 支持弹幕压制
  - [x] 断播续传
- [x] 打包不带ffmpeg的版本，支持自定义ffmpeg以及ffprobe

# 开发

交流群：872011161

node需要18及以上版本。  
下载项目后需要新建一个`resources\bin`文件夹，里面需要四个文件。
同时需要在应用中设置 ffmpeg 以及 ffprobe 可执行文件地址。

1. `DanmukuFactory.exe` [1.7.0版本](https://github.com/hihkm/DanmakuFactory/releases/tag/v1.70)
2. `ffmpeg.exe` [n6.0](https://github.com/BtbN/FFmpeg-Builds/releases)
3. `ffprobe.exe` [n6.0](https://github.com/BtbN/FFmpeg-Builds/releases)
4. `biliup.exe` [0.1.19](https://github.com/biliup/biliup-rs/releases/tag/v0.1.19)

## Install

```bash
$ npm install
```

## Development

```bash
$ npm run dev
```

## Build

```bash
# For windows
$ npm run build:win

# For windows without ffmpeg
$ npm run build:win-no-ffmpeg
```

# License

GPLv3
