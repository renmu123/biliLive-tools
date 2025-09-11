# 1.6.0

- 支持 `recorderType` 参数用于配置底层录制器，支持`ffmpeg | mesio`
- 修复未设置分段时录制音频时不触发文件创建和结束时间的bug
- 部分事件的参数修改为序列化参数
- 新增`recordRetryImmediately`即“录制错误立即重试”选项，用于在触发"invalid stream"后自动重试，一场直播最多触发五次，不对虎牙生效

# 1.4.1

- `resolveChannelInfoFromURL` 新增返回参数：`avatar`

# 1.4.0

- `savePathRule` 支持 [ejs](https://ejs.co/) 模板引擎
- 修复 `.mp4` 及 `.mkv` 录制出错时数据不完整的bug
- 支持 `useServerTimestamp` 控制弹幕是否使用服务端时间戳

# 1.3.0

1. 分P时获取更加准确的标题以及封面信息

# 1.2.1

- 修复 `videoFormat=auto` 时开启分段结束后的重命名错误

# 1.2.0

1. 支持 `videoFormat`参数: "auto", "ts", "mkv"

# 1.1.0

## 功能

1. 增加虎牙 `quality` 类型、`api`，`formatName` 参数支持
2. 封面保存现在在这个包中实现了

# 1.0.1

## Bug fix

1. 修复缺少依赖的bug
