# biliLive-tools

![Downloads](https://img.shields.io/github/downloads/renmu123/biliLive-tools/total)

这是一个用于 B 站录播的一站式工具，支持弹幕转换与视频压制并上传至B站，支持[B站录播姬](https://github.com/BililiveRecorder)、[blrec](https://github.com/acgnhiki/blrec)、[DDTV](https://github.com/CHKZL/DDTV)的webhook。  
如果你是录播man正在寻找xml弹幕转换、弹幕压制、webhook上传工具，如果你是切片man正在寻找下载b站视频工具，如果你厌倦了b站的多p上传，你可以来试试本软件。  
做这款工具的初衷是为了解决录播工具的碎片化，往往想完整处理一场带有弹幕的录播要使用多个软件的配合，一些工具只有CLI，加大了使用难度。  
你可以在B站查看[使用教程](https://www.bilibili.com/video/BV1Hs421M755/)

**如果你使用了本软件，希望你在简介标注仓库地址或保留默认tag，本软件不存在任何数据追踪，我想大致知道使用使用人群及情况**

[更新历史](https://github.com/renmu123/biliLive-tools/blob/master/CHANGELOG.md)

1. 支持录播姬与blrec的webhook自动化处理
2. 支持 Danmafactory GUI 弹幕xml转换
3. 支持根据弹幕切片
4. 支持b站分P投稿
5. 支持视频与弹幕压制
6. 支持 ffmpeg 转码及转封装
7. 支持B站视频下载
8. 支持斗鱼录播及其弹幕下载

![preview](./docs/preview.png)

# 安装

**任何版本更新前请查看更新记录，避免破坏性更新带来的问题**

最优先支持的是桌面程序，其余或多或少少了部分功能

## 桌面程序

不提供 MacOS 安装包，需要的可以自行编译，编译时需要替换用到的二进制文件。  
由于我不在Linux开发，测试覆盖不广，如果存在问题可以提issue。

下载地址：https://github.com/renmu123/biliLive-tools/releases  
备用阿里云盘：https://www.alipan.com/s/iRyhxjdqGeL

## CLI

CLI的使用参考[文档](https://github.com/renmu123/biliLive-tools/tree/master/packages/CLI)

下载地址：https://github.com/renmu123/biliLive-tools/releases

也可以使用`npm i bililive-cli -g`来进行安装

## docker

待施工

## webui

可用于国内未备案机器，或懒得自部署的情况，由于浏览器安全措施，需要关闭https和http混合的安全选项，或者选择自签名，或者自部署

线上地址：https://bililive.irenmu.com

# 功能介绍

## webhook

### [B站录播姬](https://github.com/BililiveRecorder)

默认webhook地址：http://127.0.0.1:18010/webhook/bililiverecorder

需要在本软件的“设置-webhook-录播姬工作目录”设置录播的工作目录

### [blrec](https://github.com/acgnhiki/blrec)

默认webhook地址：http://127.0.0.1:18010/webhook/blrec

依赖于“视频文件创建”,“视频文件完成”两个webhhook，建议直接勾选全部事件。

### [DDTV](https://github.com/CHKZL/DDTV)

默认webhook地址：http://127.0.0.1:18010/webhook/custom

需要将DDTV的软件“设置-文件与路径设置-录制文件保存路径”设置为绝对路径。

由于DDTV的webhook设计的非常扭曲~~难用~~，无法保证任意配置下的可用性

### 自定义Webhook

如果想接入webhook相关功能，你可以自行构造参数并调用接口，采用`post`方法，端口为`/webhook/custom`，接收后立刻返回http code=200。

参数：
`event`: `FileClosed`|`FileOpening` (如果你想使用断播续传功能，请在上一个`FileClosed`事件后在设置的时间间隔内发送`FileOpening`事件)  
`filePath`: 视频文件的绝对路径
`coverPath`: 可选，视频封面的绝对路径，如果为空，会读取与视频文件名相同的后缀为`jpg`的文件
`danmuPath`: 可选，视频弹幕`xml`文件，如果为空，会读取与视频文件名相同的`xml`文件
`roomId`: 数字类型，房间号，用于断播续传  
`time`: 用于标题格式化的时间，示例："2021-05-14T17:52:54.946"  
`title`: 标题，用于格式化视频标题  
`username`：主播名称，用于格式化视频标题

**以下参数用于弹幕分析功能，非必要**
有些弹幕中存在元数据(参考blrec)的会被自动解析，比如弹幕姬或blrec或douyu-cli(0.6.1及以上)生成的弹幕
`platform`：平台，如果是b站推荐为`bilibili`，斗鱼推荐为`douyu`，其实填啥都可以  
`live_start_time`：直播开始时间，示例："2021-05-14T17:52:54.946"
`live_title`：直播标题

示例：

```bash
curl --location 'http://127.0.0.1:18010/webhook/custom' \
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

## Web & docker注意事项

项目地址：https://github.com/renmu123/biliLive-webui  
在线地址：https://bililive.irenmu.com  
目前版本尚未完成  
**由于软件并非针对web设计，无法保证安全性，请谨慎暴露在公网中**

密钥为`appConfig.json`的`passKey`字段

### webhook使用

docker下由于存储的隔离，webhook使用其他安装方式并不一致
待完善

#### 录播姬

#### blrec

## 断播续传

这个功能主要用于解决：由于网络或者设置分段原因导致录播片段被切割成多个。  
开启后，会将主播的一场直播上传到同一个视频中  
一场直播的定义：同一个主播，本次文件创建时间与上一个文件结束写入时间如果相差n分钟（使用配置），那么会被定义为一场直播，不会使用webhook中比如录播姬的session定义。  
开启录制后，或反复切换开关，可能会有奇怪的错误。  
如果出现bug，将设置中的日志等级调整为`debug`后复现然后进行反馈。

## xml弹幕转换

xml弹幕转换底层使用[DanmakuFactory](https://github.com/hihkm/DanmakuFactory)，B站弹幕确认可以使用，其余类型请自行测试。  
部分功能如自适应分辨率

## 切片功能

用于局部渲染带有弹幕的视频，支持[lossless-cut](https://github.com/mifi/lossless-cut)项目导入

### 支持哪些快捷键

- `ctrl+s` 保存到llc项目
- `ctrl+shift+s` 另存为llc项目
- `ctrl+enter` 导出
- `ctrl+z` 撤销
- `ctrl+shift+z` 重做
- `I` 在当前时间开始当前片段
- `O` 在当前时间结束当前片段
- `up` 上一个片段
- `down` 下一个片段
- `del` 删除片段
- `space` 播放/暂停
- `ctrl+left` 后退1秒
- `ctrl+right` 前进1秒
- `ctrl+k` 切换视图

## 通知

**使用通知功能时，请妥善保存所有信息，请勿分享给他人，本软件不会发送任何信息到任何服务器**

### 邮箱

使用smtp服务来发送邮件，每个邮件服务商的参数各不相同，使用请自行参照各服务商的教程。

### server酱

serer酱支持免费推送信息到手机微信，免费账户有限制。

官网：https://sct.ftqq.com/

### tg bot

使用tg bot发送信息时默认使用系统代理。

tg bot 的搭建请自行寻找教程

### ntfy

官网：https://docs.ntfy.sh/

## CLI的使用

你可以使用二进制文件或者使用`npm i bililive-cli -g`进行安装。

具体文档[参考](https://github.com/renmu123/biliLive-tools/tree/master/packages/CLI)页面

# 常见问题

## 支持的环境变量

windows下环境变量修改后可能需要重启电脑方能生效

### B站登录自定义密钥加密

可以使用环境变量`BILILIVE_TOOLS_BILIKEY`自定义密钥，自定义前请先退出原有全部账号。

## Webhook标题模板引擎如何使用

1.5.0起 Webhook 标题支持[ejs模板引擎](https://github.com/mde/ejs)，具体语法参考文档，**如果标题超过80字，会被自动截断**，会优先执行模板引擎，之后会对`{{}}`占位符进行替换，如果有语法错误，会被跳过，优先保证上传。

```ts
// 以下为支持注入的参数
{
  title: string; // 直播间标题
  user: string; // 主播名称
  time: Date; // 直播开始时间
  roomId: number | string; // 房间号
}
```

示例：`<%= user %>-<%= time.getFullYear() %><%= String(time.getMonth() + 1).padStart(2, "0") %>直播录像`
渲染结果：`djw-202408直播录像`

## 压制预设如何设置

~~我也不知道~~  
如果你是一个小白，先根据自己的硬件选择对应的编码，推荐使用crf或cq等质量模式的默认参数，压制后查看视频大小，压制时间，画质，接下来调整参数，以满足你的需求，没有最好的参数，只有最合适的参数，不同视频，不同场景可能合适的参数都不一致。  
进阶请自行搜索ffmpeg相关的教程

## nvnec或其他硬件转码无法正常使用

请尝试更新显卡驱动，如果更新到最新后还无法使用，请尝试手动更换ffmpeg可执行文件为6.0

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

## 投稿后自动评论未生效

该功能会每隔一段时间（自行设置）会查询一次投稿中心的前20个稿件，如果为本软件投稿且开启了自动评论的已审核非续传稿件，会进行自动评论，如果一个稿件24小时内状态不为审核通过，那么这个稿件将被移出队列。  
如果你的稿件不为以上情况却未进行投稿，请提issue

## 怎么评估压制的速度

进入队列，查看任务最后一栏的速率，可以根据速率调整压制参数

## 如何查看原始ffmpeg命令输出

压制之后查看log

## 最大任务数

1. 手动暂停的任务不会被自动启动
2. 高能进度条任务会自动进行，因为速度会很快

## 使用zip包后安装包无法使用

zip包并非传统意义上的绿色包，数据和安装包文件的不会存放在同一个文件夹中，如果你尝试使用安装包后使用压缩包，可能会导致二进制文件的路径错误从而无法使用，请尝试在设置中手动修改二进制文件路径。

如果你想将数据放在同一个文件夹内，请在可执行文件所在文件夹创建一个`portable`文件，无拓展名如`.txt`，更改后重启应用，如有需要可以新建文件前在设置中备份设置。

## 更改webhook部分配置不生效

请不要在直播开始后修改相应的配置，比如标题，断播续传等配置，本场直播可能并不会生效

# TODO

- [x] 支持使用ffmpeg压制弹幕至视频文件
- [ ] 工具页面
  - [x] 支持ffmpeg不同cpu，gpu以及相关配置
  - [x] 支持使用danmufactory自动处理xml文件并进行压制
  - [x] 工具页面，danmufactory的GUI
  - [x] 工具页面，flv的转封装
  - [x] 支持视频合并
  - [x] 下载页面
  - [x] 支持切片
- [x] log记录及其展示
- [x] 配置持久化，压制高能进度条
- [x] B站上传支持
  - [x] 移除biliup二进制文件依赖
  - [x] 支持分p
  - [x] 多账户支持
- [ ] webhook支持
  - [x] 录播姬webhook支持
  - [x] blrec webhook支持
  - [x] 支持自动上传
  - [x] 支持弹幕压制
  - [x] 断播续传
- [x] 支持自定义ffmpeg以及ffprobe
- [ ] 斗鱼直播录制
- [ ] 弹幕分析

# 开发

交流群：872011161

node请使用20及以上版本。

## Install

```bash
$ pnpm install
$ pnpm run install:bin
```

### better-sqlite3

`弹幕分析`功能依赖于`better-sqlite3`，如果你无法编译安装，尝试安装[visual-studio2022](https://visualstudio.microsoft.com/zh-hans/thank-you-downloading-visual-studio/?sku=Community)中的c++相关工具，以及python3(也许)。
如果你是Win，你还可能遇到报错比如`cause=fork/exec %1 is not a valid Win32 application.`，根据[提示](https://github.com/pnpm/pnpm/issues/5638#issuecomment-1327988206)修改pnpm源文件，如果应用无法启动，尝试使用electron-rebuild。
如果你最后还是无法安装，尝试在项目根目录运行`node scripts\github-ci-better-sqlite3.js`手动安装依赖。

### 其他依赖

如果二进制依赖安装失败或者不支持你的平台，请尝试[手动下载安装](https://github.com/renmu123/biliLive-tools/releases/tag/0.2.1)二进制依赖。

新建`packages\app\resources\bin`文件夹，里面需要三个个文件。
同时需要在应用的设置里设置相关可执行文件地址。

1. `DanmukuFactory.exe` [自编译版本](https://github.com/renmu123/DanmakuFactory/tree/test)
2. `ffmpeg.exe` [n7.0](https://github.com/BtbN/FFmpeg-Builds/releases)
3. `ffprobe.exe` [n7.0](https://github.com/BtbN/FFmpeg-Builds/releases)

## Development

`pnpm run dev`

## Build

```bash
# APP应用
$ pnpm run build:app
# APP应用且没有ffmpeg二进制文件
$ pnpm run build:app:no-ffmpeg
# CLI应用
$ pnpm run build:cli
```

## WebUI项目地址

为github actions自动编译

地址：https://github.com/renmu123/biliLive-webui

# 赞赏

如果本项目对你有帮助，请我喝瓶快乐水吧，有助于项目更好维护。  
爱发电：[https://afdian.com/a/renmu123](https://afdian.com/a/renmu123)  
你也可以给我的 B 站帐号 [充电](https://space.bilibili.com/10995238)

# License

GPLv3
