# 1.6.0

- 支持 `recorderType` 参数用于配置底层录制器，支持`ffmpeg | mesio`
- 修复 `videoFormat=auto` 时某些情况下格式的判断

# 1.3.2

- 修复星秀区录制原画可能失败的bug
- `resolveChannelInfoFromURL` 新增返回参数：`avatar`

# 1.3.1

- 修复获取未直播主播时的信息失败

# 1.3.0

1. 分P时获取更加准确的标题以及封面信息
2. 废弃 `formatName` 参数，转为使用 `formatPriorities` 参数，默
3. 认为['flv','hls']

# 1.2.0

1. 支持 `videoFormat`参数: "auto", "ts", "mkv"

# 1.1.1

## Bug修复

1. 修复虎牙星秀区无法录制的bug，感谢 https://github.com/ihmily/DouyinLiveRecorder/pull/993

# 1.1.0

## 破坏性更改

1. `quality` 参数值修改，具体见文档

## 功能

1. 支持 `api` 参数，用于获取直播流时选择使用 `web` 还是 `mp` 接口，默认情况下星秀区使用mp，其他使用web接口
2. 支持 `sourcePriorities` 参数，按提供的源优先级去给CDN列表排序，并过滤掉不在优先级配置中的源，在未匹配到的情况下会优先使用TX的CDN，具体参数见 CDN 参数
3. 支持 `formatName` 参数，支持 flv,hls 参数，默认使用flv
4. 画质支持 蓝光20M,蓝光10M

## Bug修复

1. 修复画质无法生效的bug
2. 录制星秀专区不再破碎，默认使用 web 接口，如果检测到为星秀专区，使用 mp 接口

# 1.0.1

## Bug fix

1. 修复缺少依赖的bug
