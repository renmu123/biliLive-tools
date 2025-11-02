# Next

- `recordHandle` 新增参数 `recorderType`
- 录制：优化ffmpeg默认参数，fmp4使用m4s后缀 [#224](https://github.com/renmu123/biliLive-tools/pull/224)

# 1.8.0

- 新增`debugLevel`参数，支持`none`、`basic`、`verbose`
- 触发标题黑名单设定额外状态
- 录播姬引擎支持

# 1.7.1

- 修复检查错误状态不会被重置的bug

# 1.7.0

- 增加检查错误状态值

# 1.6.0

- 支持 `recorderType` 参数用于配置底层录制器，支持`auto | ffmpeg | mesio`
- 修复 `videoFormat=auto` 时某些情况下格式的判断
- 修复上船的礼物价格错误

# 1.5.1

- `resolveChannelInfoFromURL` 新增返回参数：`avatar`
- 弹幕录制切换回原项目`blive-message-listener`

# 1.5.0

- 修复部分服务端礼物弹幕时间戳错误的bug
- 支持 `useServerTimestamp` 控制弹幕是否使用服务端时间戳

# 1.4.1

- 修复无法获取弹幕的bug

# 1.4.0

- 支持 `onlyAudio` 参数来只录制音频

# 1.3.0

- 支持标题关键词来不进行录制
- 修改默认画质匹配逻辑以处理hevc真原画
- 分P时获取更加准确的标题以及封面信息
- 优化弹幕时间使用服务端时间

# 1.2.0

1. 支持 `videoFormat`参数: "auto", "ts", "mkv"
2. 弹幕默认重试次数修改为10

# 1.1.0

## 优化

1. 优化 http_hls 流优化非法流的判定
2. ts流比fmp4优先级更高
3. 弹幕服务器增加重试
4. `qualityRetry` 支持 -1 参数

## Bug fix

1. 修复hls代理未生效

# 1.0.1

## Bug fix

1. 修复缺少依赖的bug
