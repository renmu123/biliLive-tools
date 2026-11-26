# 本地弹幕插件

源码来自 [ArtPlayer](https://github.com/zhw2590582/ArtPlayer/tree/daf133b22630b4a0eecfa3336bbddab0e9119d96/packages/artplayer-plugin-danmuku)，对应 npm `artplayer-plugin-danmuku@5.3.0`。保留上游 MIT 许可证，直接由 Vite 编译源码、Less、SVG 和内联 Worker。

本地修改：

- `fontSize` 改为 50–200 的字号百分比，默认 100，设置面板显示 `%`。
- 设置面板新增“高能进度条”开关，对应 `heatmap`，默认关闭，支持动态显示、隐藏和保存选择。`heatmapEnable` 默认 `true`；设为 `false` 时隐藏配置项并强制 `heatmap: false`，后续调用 `config({ heatmap: true })` 也无法开启。
- 播放器组件可通过 `option.plugins.danmuku.heatmapEnable` 禁用此配置项；直播及已有独立 heatmap 插件的页面始终禁用，避免重复高能进度条。
- 100% 的基准为播放器容器高度的 4%，并随容器尺寸变化；720px 高的播放区域约 29px，1080px 高约 43px。
- 调整窗口或全屏时，更新正在显示及暂停中的弹幕字号。
- 速度以 7.5 秒作为“适中”，五档持续时间：极慢 15 秒、较慢 11.25 秒、适中 7.5 秒、较快 3.75 秒、极快 1.5 秒，默认适中。
