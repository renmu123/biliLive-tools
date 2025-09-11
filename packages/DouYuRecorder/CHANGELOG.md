# 1.6.0

- 支持 `recorderType` 参数用于配置底层录制器，支持`ffmpeg | mesio`
- 修复cdn错误显示
- 增加更多礼物
- 修复 `videoFormat=auto` 时某些情况下格式的判断

# 1.5.1

- `resolveChannelInfoFromURL` 新增返回参数：`avatar`
- 优化直播间解析

# 1.5.0

- 支持 `useServerTimestamp` 控制弹幕是否使用服务端时间戳
- 荧光棒价格置为0

# 1.4.0

- 支持 `onlyAudio` 来只录制音频

# 1.3.0

1. 分P时获取更加准确的标题以及封面信息
2. 弹幕时间使用服务端时间

# 1.2.0

- 支持 `source` 参数，用于指定 cdn
- 支持 `videoFormat`参数: "auto", "ts", "mkv"
- 弹幕默认重连次数修改为10

# 1.1.0

1. 重用ffmpeg录制器
2. 礼物弹幕支持开通钻粉和续费钻粉
3. 斗鱼录制支持标题关键词来不进行录制 [#53](https://github.com/renmu123/biliLive-tools/pull/53)
4. `qualityRetry` 支持 -1 参数

# 1.0.3

1. 更新依赖

# 1.0.1

## Bug fix

1. 修复缺少依赖的bug
