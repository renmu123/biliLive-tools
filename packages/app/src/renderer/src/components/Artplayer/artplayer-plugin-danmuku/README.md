# 本地弹幕插件

源码来自 [ArtPlayer](https://github.com/zhw2590582/ArtPlayer/tree/daf133b22630b4a0eecfa3336bbddab0e9119d96/packages/artplayer-plugin-danmuku)，对应 npm `artplayer-plugin-danmuku@5.3.0`。保留上游 MIT 许可证，直接由 Vite 编译源码、Less、SVG 和内联 Worker。

本地修改：

- `fontSize` 改为 50–200 的字号百分比，默认 100，设置面板显示 `%`。
- 弹幕项支持 `img` 图片地址，有图片时替代文字显示，`text` 用作替代说明，可省略。例如 `plugin.emit({ img: "https://example.com/emote.png", text: "点赞", mode: 0 })`；批量载入使用相同格式。图片按实际视频显示区域短边缩放：100% 时短边 720px 对应 60px，基准尺寸限制在 37.5–75px，再乘以现有的 50%–200% 设置并取整。图片在该尺寸方框内保持原比例，兼容滚动、顶部、底部和防重叠；加载失败显示替代文字，尺寸同步更新。直播播放器及监控室透传消息中的 `img`。
- 行内小表情使用 `emoticons` 映射，例如 `{ text: "你好[dog]", emoticons: { "[dog]": "https://example.com/dog.png" } }`，匹配到的表情文字会被替换为图片，其他文字正常显示。所有图片使用 `no-referrer`，B 站消息同时转发独立大表情和行内小表情。
- 设置面板新增“高能进度条”开关，对应 `heatmap`，默认关闭，支持动态显示、隐藏和保存选择。`heatmapEnable` 默认 `true`；设为 `false` 时隐藏配置项并强制 `heatmap: false`，后续调用 `config({ heatmap: true })` 也无法开启。
- 播放器组件可通过 `option.plugins.danmuku.heatmapEnable` 禁用此配置项；直播及已有独立 heatmap 插件的页面始终禁用，避免重复高能进度条。
- 100% 的基准为实际视频显示区域短边的 4%，限制在 18–36px，再乘以设置的 50%–200%。默认等比显示时扣除容器中的黑边，自定义宽高比时采用视频元素显示尺寸；视频元数据尚未就绪时按容器短边计算，未布局时临时使用 720px 短边。1280 × 720 时约 29px，2560 × 1440 和 1440 × 2560 均为 36px，360 × 640 为 18px。
- 调整窗口或全屏时，更新正在显示及暂停中的弹幕字号。
- 速度以 7.5 秒作为“适中”，五档持续时间：极慢 15 秒、较慢 11.25 秒、适中 7.5 秒、较快 3.75 秒、极快 1.5 秒，默认适中。
