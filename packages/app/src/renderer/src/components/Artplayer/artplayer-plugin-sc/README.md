# Artplayer SC 插件

在 Artplayer 视频画面左上角显示 Super Chat（醒目留言）。支持按录播时间轴显示，也支持直播时实时推送。样式定义在同目录的 `style.less`，由插件入口自动引入。

## 接入

项目的 Artplayer 组件已注册该插件，启用时同时传入 `danmuku` 和 `sc`：

```vue
<Artplayer
  ref="playerRef"
  :plugins="['danmuku', 'sc']"
  :option="{ plugins: { sc: { duration: 20 } } }"
/>
```

`duration` 为可选项，单位秒，默认 `20`。不传或传入非正数时使用默认值。加载录播 SC 数据：

```ts
playerRef.value?.switchSC([{ time: 12.5, text: "支持主播！", user: "观众A", price: 30 }]);
```

通过项目的 Artplayer 组件使用时，SC 跟随弹幕总开关：关闭弹幕会立即隐藏 SC，重新打开会按当前时间恢复显示。若未启用 `danmuku` 插件，SC 不显示。无需单独操作 SC 开关。

也可以直接作为 Artplayer 插件使用：

```ts
import Artplayer from "artplayer";
import artplayerPluginSC from "@renderer/components/Artplayer/artplayer-plugin-sc";

const art = new Artplayer({
  container: "#player",
  url: "video.mp4",
  plugins: [
    artplayerPluginSC({
      duration: 20,
      data: [{ time: 12.5, text: "支持主播！", user: "观众A", price: 30 }],
    }),
  ],
});

const scPlugin = art.plugins.artplayerPluginSC as ReturnType<ReturnType<typeof artplayerPluginSC>>;

scPlugin.setData([{ time: 45, text: "新的留言", user: "观众B", price: 100 }]);
scPlugin.emit({
  text: "直播中的留言",
  user: "观众C",
  price: 50,
  avatar: "https://example.com/avatar.png",
});
```

## 数据格式

| 字段     | 类型      | 说明                                             |
| -------- | --------- | ------------------------------------------------ |
| `time`   | `number`  | 录播中的出现时间，单位秒；调用 `emit` 时无需传入 |
| `text`   | `string`  | 留言内容，必填                                   |
| `user`   | `string?` | 用户名，缺省时显示“匿名用户”                     |
| `price`  | `number?` | 人民币金额，缺省时显示 `¥0`                      |
| `avatar` | `string?` | 头像图片地址                                     |

## 显示规则

- `setData(items)` 会替换全部录播 SC 数据，并立即根据当前播放时间刷新。播放或跳转到 `time` 时开始显示，达到 `time + duration` 时隐藏；暂停时跟随视频时间保持显示。
- `emit(item)` 用于直播消息，收到后立即显示，并按实际时间在 `duration` 秒后隐藏。
- `setVisible(visible)` 可直接控制插件显示状态；项目的 Artplayer 组件会根据弹幕总开关自动调用。直接使用插件时默认显示。
- 同时最多显示 3 条，最新的消息在最上方。金额按 ¥30、¥50、¥100、¥500、¥1000、¥2000 的上限分为六档，每档包含上限金额；超过 ¥2000 沿用最后一档。标题使用深色文字，内容使用白色文字。
- 插件销毁时会移除画面元素、事件监听和计时器。

XML 中的 SC 需先转换为上述数据格式；插件本身不解析弹幕文件。

| 金额范围                | 标题背景  | 内容背景  |
| ----------------------- | --------- | --------- |
| ≤ ¥30                   | `#edf5ff` | `#2a60b2` |
| ¥30 < 金额 ≤ ¥50        | `#dbfffd` | `#427d9e` |
| ¥50 < 金额 ≤ ¥100       | `#fff1c5` | `#e2b52b` |
| ¥100 < 金额 ≤ ¥500      | `#ffead2` | `#e09443` |
| ¥500 < 金额 ≤ ¥1000     | `#ffe7e4` | `#e54d4d` |
| > ¥1000（含超过 ¥2000） | `#ffd8d8` | `#ab1a32` |
