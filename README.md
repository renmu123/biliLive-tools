# biliLive-tools

这是一个用于 B 站录播的一站式工具，支持弹幕与视频压制并上传至B站，支持录播姬与blrec的webhook。  
做这款工具的主要原因是为了解决录播工具的碎片化，往往想完整处理一场带有弹幕的录播要使用多个软件的配合，一些工具只有CLI，加大了使用难度。  
[更新历史](https://github.com/renmu123/biliLive-tools/blob/master/CHANGELOG.md)  
**希望使用webhook功能标注仓库地址或保留默认tag**

1. 支持 Danmufactory GUI
2. 支持 ffmpeg 转封装
3. 支持视频与弹幕压制
4. 支持b站投稿
5. 支持录播姬与blrec的webhook

# 下载

目前有两个 Win 版本的包。两个包处理有没有打包 `ffmpeg` 和 `ffprobe` 之外没有任何代码上的区别，如果你不需要转封装功能，可以尝试下载体积较小的包，我不是特别推荐。
如果你是普通用户，那就选择体积大的那个包，如果你是资深用户，那么请自行选择，因使用自定义 `ffmpeg` 出问题的 issue 是不会被处理的。
下载地址：https://github.com/renmu123/biliLive-tools/releases
备用：https://www.alipan.com/s/iRyhxjdqGeL

1. 自带 `ffmpeg` 版本的包
2. 在设置中自定义`ffmpeg`以及`ffprobe`文件路径，减小安装包体积。

# TODO

- [x] 支持使用ffmpeg压制弹幕至视频文件
- [ ] 工具页面
  - [x] 支持ffmpeg不同cpu，gpu以及相关配置
  - [x] 支持使用danmufactory自动处理xml文件并进行压制
  - [x] 工具页面，danmufactory的GUI
  - [x] 工具页面，flv的转封装
  - [x] 支持视频合并
- [x] log记录及其展示
- [ ] 配置持久化，平均码率、支持使用ass-convert来进行弹幕处理以及压制高能进度条
- [x] B站上传支持
  - [ ] 移除biliup二进制文件依赖
  - [x] 支持分p
  - [x] 多账户支持
- [ ] 支持webhook
  - [x] 录播姬webhook支持
  - [x] blrec webhook支持
  - [x] 支持自动上传
  - [x] 支持弹幕压制
  - [x] 断播续传
- [x] 打包不带ffmpeg的版本，支持自定义ffmpeg以及ffprobe

## 断播续传

这个功能主要用于解决：由于主播的自身或录制端的网络原因导致录播片段被切割成多个。
开启后，会将主播的一场直播上传到同一个视频中  
一场直播的定义：同一个主播，本次文件创建时间与上一个文件结束写入时间如果相差10分钟，那么会被定义为一场直播，不会使用webhook中比如录播姬的session定义。
如果在主播录制后，或反复切换开关，可能会有奇怪的错误。
如果出现bug，将设置中的日志等级调整为`debug`后复现然后进行反馈。

# 赞赏

如果本项目对你有帮助，请我喝瓶快乐水吧，有助于项目更好维护：[https://afdian.net/a/renmu123](https://afdian.net/a/renmu123)

# 开发

交流群：872011161

node需要18及以上版本
下载项目后需要新建一个`resources\bin`文件夹，里面需要三个文件。
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
