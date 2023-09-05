# biliLive-tools

这是一个用于上传录播到 B 站的工具。

# TODO

- [ ] 支持使用ffmpeg压制弹幕至视频文件
- [ ] 支持使用danmufactory自动处理xml文件并进行压制
- [x] 工具页面，danmufactory的GUI
- [ ] 工具页面，flv的转封装
- [ ] 支持使用ass-convert来进行弹幕处理以及压制高能进度条
- [ ] 支持自动上传
- [ ] 支持录播姬的webhook
- [ ] 支持ffmpeg不同cpu，gpu以及相关配置

# 开发

下载完成项目后需要新建一个`bin`文件夹，里面需要三个文件：

1. `DanmukuFactory.exe` [1.7.0版本](https://github.com/hihkm/DanmakuFactory/releases/tag/v1.70)
2. `ffmpeg.exe` [n6.0](https://github.com/BtbN/FFmpeg-Builds/releases)
3. `ffprobe.exe` [n6.0](https://github.com/BtbN/FFmpeg-Builds/releases)

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
```

# License

GPL
