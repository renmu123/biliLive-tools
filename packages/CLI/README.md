# 介绍

[biliLive-tools](https://github.com/renmu123/biliLive-tools)的命令行版本

这是一个用于 B 站录播的一站式工具，支持弹幕转换与视频压制并上传至B站，支持录播姬与blrec的webhook。  
如果你是录播man正在寻找xml弹幕转换、弹幕压制、webhook上传工具，如果你是切片man正在寻找下载b站视频工具，如果你厌倦了b站的多p上传，你可以来试试本软件。  
做这款工具的初衷是为了解决录播工具的碎片化，往往想完整处理一场带有弹幕的录播要使用多个软件的配合，一些工具只有CLI，加大了使用难度。

# 安装

`npm i bililive-cli -g`

# 使用

CLI是GUI的拓展，使用前需要设置相关目录，由于配置文件很多且复杂，请在GUI中生成并进行修改配置后复制到CLI所配置的目录，或直接将目录设置为GUI的配置目录。  
暂时只支持webhook相关的指令，也即启动webhook server，可以避免启动electron带来的消耗。

**CLI版本暂时不支持删除到回收站，高能进度条功能**

## 配置

使用前通过 `biliLive config gen` 生成默认配置文件，如果你已经安装客户端，相关配置会被自动设置（仅限win）  
如果你仅使用上传功能，那么无需配置二进制文件，二进制文件可在[这里](https://github.com/renmu123/biliLive-tools/releases/tag/0.2.1)找到，以`platform--arch-version`命名，如果没有当前版本，以最近版本为准，配置为绝对路径以及分配执行权限

```js
{
  port: 18010, // 启动端口，如果不希望与客户端的冲突，请修改为其他端口号
  host: "127.0.0.1",  // host
  configFolder: "", // 配置文件夹，推荐在GUI中生成并进行修改配置后复制到CLI所配置的目录，可在“打开配置文件夹”文件夹找到，分别为ffmpeg_presets.json、danmu_presets.json、presets.json、appConfig.json
  ffmpegPath: "ffmpeg.exe", // ffmpeg二进制路径
  ffprobePath: "ffprobe.exe",  // ffprobe二进制路径
  danmakuFactoryPath: "DanmakuFactory.exe",  // DanmakuFactory二进制路径
  logPath: "main.log",  // log文件路径
}
```

## 运行

`biliLive server`
