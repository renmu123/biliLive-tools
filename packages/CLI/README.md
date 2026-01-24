# 介绍

[biliLive-tools](https://github.com/renmu123/biliLive-tools)的命令行版本

# 安装

`npm i bililive-cli -g`

也有可能需要使用

`npm i bililive-cli -g --force`

<!-- 或者下载二进制[文件](https://github.com/renmu123/biliLive-tools/releases) -->

# 使用

## 配置

使用前通过 `biliLive config gen` 生成默认配置文件，如果你已经安装客户端，相关配置会被自动设置（仅限win）  
如果你仅使用上传功能，那么无需配置二进制文件，二进制文件见[文档](https://docs.irenmu.com/development/guide.html#%E5%85%B3%E4%BA%8E%E4%BA%8C%E8%BF%9B%E5%88%B6%E4%BE%9D%E8%B5%96)，配置为绝对路径以及分配执行权限

```js
{
  port: 18010, // 启动端口，如果不希望与客户端的冲突，请修改为其他端口号
  host: "127.0.0.1",  // host，如果需要暴露出去，可以修改为0.0.0.0
  configFolder: "config", // 配置文件夹
  ffmpegPath: "ffmpeg.exe", // ffmpeg二进制路径
  ffprobePath: "ffprobe.exe",  // ffprobe二进制路径
  danmakuFactoryPath: "DanmakuFactory.exe",  // DanmakuFactory二进制路径
  logPath: "main.log",  // log文件路径，绝对路径
  mesioPath: "mesio.exe",
  bililiveRecorderPath: "BililiveRecorder.Cli.exe",
  audiowaveformPath: "audiowaveform.exe"
}
```

## 运行

```bash
Usage: biliLive server

启动web服务器

Options:
  -c, --config                         配置文件
  -h, --host                           host，覆盖配置文件的参数，可选
  -p, --port                           port，覆盖配置文件的参数，可选
```

## webui

鉴权密钥为 `config/appConfig.json` 的 `passKey` 参数，或者设置 `BILILIVE_TOOLS_PASSKEY` 环境变量

你可以选择线上页面：https://bililive.irenmu.com/

或者也可以自行[部署](https://github.com/renmu123/biliLive-webui)
