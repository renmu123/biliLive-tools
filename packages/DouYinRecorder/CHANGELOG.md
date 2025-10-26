# Next

- `recordHandle` 新增参数 `recorderType`

# 1.8.0

- 新增`debugLevel`参数，支持`none`、`basic`、`verbose`
- 支持标题黑名单
- 录播姬引擎支持
- 触发标题黑名单设定额外状态

# 1.7.1

- 修复检查错误状态不会被重置的bug

# 1.7.0

- 支持 `mobile`、`userHTML`、`balance`、`random` 接口, 其中 `mobile`、`userHTML` 需要传递`uid`参数，内容为`sec_user_id`
- 修复某些无法获取到直播间信息的查询
- 增加检查错误状态值

# 1.6.0

- 支持 `recorderType` 参数用于配置底层录制器，支持`auto | ffmpeg | mesio`
- 修复 `videoFormat=auto` 时某些情况下格式的判断
- 支持用户主页解析
- 支持客户端分享用户主页解析
- 支持HTML解析接口
- 修复“画质匹配重试次数”不生效的bug
- 礼物支持真实价格

# 1.5.3

- 修复抖音调用接口错误

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
