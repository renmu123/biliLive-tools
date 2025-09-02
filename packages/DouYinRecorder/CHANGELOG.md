# 1.6.0

- 支持 `recorderType` 参数用于配置底层录制器，支持`ffmpeg | mesio`

# 1.5.2

- `resolveChannelInfoFromURL` 新增返回参数：`avatar`
- 增加更多链接的解析
- 优化获取ttwid的策略

# 1.5.1

- 增加 `a_bogus` 修复抖音无法录制的bug

# 1.5.0

- 支持 `useServerTimestamp` 控制弹幕是否使用服务端时间戳

# 1.4.0

- 支持 `doubleScreen` 选项用来处理双屏录播流，开启后如果是双屏直播，那么就使用拼接的流

# 1.3.0

- 支持 `https://v.douyin.com/xxx/` 链接解析
- 分P时获取更加准确的标题以及封面信息
- 弹幕时间使用服务端时间
- 支持 `auth` 参数，用于传递cookie
- 支持 `formatPriorities` 用来控制 `flv`和`hls`流的优先级

# 1.2.0

1. 支持 `videoFormat`参数: "auto", "ts", "mkv"

# 1.0.1

1. 修复礼物弹幕时间戳错误
