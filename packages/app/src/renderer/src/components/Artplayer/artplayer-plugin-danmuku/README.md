# 本地弹幕插件

源码来自 [ArtPlayer](https://github.com/zhw2590582/ArtPlayer/tree/daf133b22630b4a0eecfa3336bbddab0e9119d96/packages/artplayer-plugin-danmuku)，对应 npm `artplayer-plugin-danmuku@5.3.0`。保留上游 MIT 许可证，直接由 Vite 编译源码、Less、SVG 和内联 Worker。

本地修改：

- `fontSize` 改为 50–200 的字号百分比，默认 100，设置面板显示 `%`。
- 100% 的基准为播放器容器高度的 4%，并随容器尺寸变化；720px 高的播放区域约 29px，1080px 高约 43px。
- 调整窗口或全屏时，更新正在显示及暂停中的弹幕字号。
- `Index.vue` 使用 `fontSizeVersion: 2` 标记新的本地存储单位。旧字号统一迁移为 100%，新版已保存的百分比继续沿用，保留其他设置。
