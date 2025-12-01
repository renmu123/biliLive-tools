# next

- 录播姬引擎支持切割
- 录播姬引擎不再默认显示日志文件

# 1.10.0

- 重构：录制器相关的参数修改为 `Downloader`
- 修复：录播姬引擎分段时间不支持浮点数
- segment 参数如果以"B","KB","MB","GB"结尾，会使用文件大小分段

# 1.9.0

- `recordHandle` 新增参数 `recorderType`
- mesio 引擎默认禁用任何代理
- 优化弹幕内存占用
- 录制：优化ffmpeg默认参数，fmp4使用m4s后缀 [#224](https://github.com/renmu123/biliLive-tools/pull/224)
- savePathRule 参数支持 `startTime` `recordStartTime` `liveStartTime` 参数

# 1.8.0

- 标题黑名单增加额外状态
- 新增`debugLevel`参数，支持`none`、`basic`、`verbose`
- 增加`maxThreadCount`参数任务并发数
- 增加`waitTime`支持任务结束后的等待时间
- 录播姬引擎支持

# 1.7.0

- 修复 mesio 某些情况下录制结束重命名错误的bug
- 弹幕使用xml流式写入

# 1.6.0

- 支持 `recorderType` 参数用于配置底层录制器，支持`auto | ffmpeg | mesio`
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
