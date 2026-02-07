# XML弹幕转换

支持将XML格式的弹幕文件转换为 ASS 字幕格式，可用于弹幕压制或播放器加载。

底层使用 [DanmakuFactory](https://github.com/hihkm/DanmakuFactory) 实现，兼容 B 站弹幕。

实际项目地址为 [自编译](https://github.com/renmu123/DanmakuFactory) 版本，功能尽量与上游一致，可能存在某些不被上游接受的功能

## 快速开始

### 使用界面

1. 打开"工具" -> "弹幕转换"
2. 选择XML弹幕文件
3. 配置转换参数
4. 点击"开始转换"

## 配置选项

### 视频分辨率

设置弹幕的目标分辨率，需要与视频分辨率一致，**这个参数非常重要**

::: tip 自适应分辨率
支持自适应分辨率功能，可以根据视频自动调整，只在和视频压制时生效。
:::

### 弹幕字体

web和客户端使用的字体方式并不相同，会有差异，再加上获取字体 `postscriptName` 的微妙的有些不同，导致某些字体web中选择后无法使用。

docker下的emoji文本渲染错误，猜测和fontconfig有关，但是我不会改，如果你会欢迎发issue

### 字体大小

弹幕文字的大小，单位：像素。

推荐值：

- 1080p: 35-45
- 720p: 25-35
- 4K: 65-85

### 不透明度

弹幕的不透明度，范围：0-1。

- 1.0: 完全不透明
- 0.8: 推荐值
- 0.5: 半透明
- 0.0: 完全透明

### 屏蔽关键词

过滤包含特定关键词的弹幕。

支持正则表达式，每行一个关键词。

示例：

```
广告
联系方式
\d{6,}  # 过滤6位以上数字（如QQ号）
```

### 描边宽度

弹幕文字的描边宽度，增强可读性。

推荐值：2-3

### 阴影

为弹幕添加阴影效果，增强可读性。

### 加粗

将弹幕文字设置为粗体。

## 批量转换

支持批量转换多个弹幕文件：

1. 选择多个XML文件
2. 使用相同的配置
3. 批量转换

## 与Webhook配合

可以在 Webhook 中配置自动转换弹幕：

1. 打开"设置" -> "Webhook"
2. 启用"自动转换弹幕"
3. 选择弹幕预设

录制完成后会自动转换弹幕。

## 导入导出预设

可以导出预设分享给他人，或备份预设：

1. 点击"导出预设"保存为文件
2. 点击"导入预设"加载文件

:::tip
请尽量保证导出与导入的软件版本一致
:::

## 自定义函数

### 过滤函数

自定义过滤函数允许您编写 JavaScript 代码来精确控制哪些弹幕应该被保留或过滤，提供比基础过滤选项更灵活的控制能力。

::: warning 注意
此功能为 biliLive-tools 的原生实现，并非 DanmakuFactory 原生实现。转换完成后请查看生成的 ASS 文件以确认过滤效果。
:::

#### 函数签名

```typescript
function filter(
  type: "danmu" | "sc" | "guard" | "gift",
  data: DanmakuData,
  logger: Console,
): boolean;
```

**参数:**

- `type`: 弹幕类型
  - `danmu`: 普通弹幕
  - `sc`: SuperChat(醒目留言)
  - `guard`: 舰长/提督/总督等上舰消息
  - `gift`: 其他礼物消息
- `data`: 弹幕数据对象，包含该条弹幕的所有信息

**返回值:**

- `true`: 保留该条弹幕
- `false`: 过滤掉该条弹幕

#### 数据结构

- 弹幕文本内容使用 `#text` 属性
- 其他属性使用 `@_` 前缀，如 `@_user`、`@_uid`
- `raw` 原始数据属性不会被解析

由于不同工具生成的弹幕格式可能存在差异，**建议在判断时使用可选链(?.)等防御式编程方式，避免报错**。

##### danmu (普通弹幕)

| 参数          | 类型   | 说明                         |
| ------------- | ------ | ---------------------------- |
| `#text`       | string | 弹幕文本内容                 |
| `@_p`         | string | B站弹幕参数(参考B站弹幕格式) |
| `@_user`      | string | 发送者用户名                 |
| `@_uid`       | string | 发送者用户ID                 |
| `@_timestamp` | number | 弹幕发送的Unix时间戳         |

##### sc (SuperChat/醒目留言)

<!-- | 参数          | 类型   | 说明             |
| ------------- | ------ | ---------------- |
| `#text`       | string | SC内容           |
| `@_user`      | string | 发送者用户名     |
| `@_uid`       | string | 发送者用户ID     |
| `@_price`     | number | SC金额           |
| `@_timestamp` | number | 发送的Unix时间戳 | -->

##### gift (礼物)

| 参数          | 类型   | 说明             |
| ------------- | ------ | ---------------- |
| `@_ts`        | number | 相对时间(秒)     |
| `@_giftname`  | string | 礼物名称         |
| `@_giftcount` | number | 礼物数量         |
| `@_user`      | string | 发送者用户名     |
| `@_uid`       | string | 发送者用户ID     |
| `@_timestamp` | number | 发送的Unix时间戳 |

##### guard (舰长/上舰)

<!-- | 参数          | 类型   | 说明             |
| ------------- | ------ | ---------------- |
| `@_user`      | string | 购买者用户名     |
| `@_uid`       | string | 购买者用户ID     |
| `@_level`     | number | 舰长等级         |
| `@_timestamp` | number | 购买的Unix时间戳 | -->

#### 使用示例

##### 示例 1: 按关键词过滤

仅保留包含特定表情的弹幕:

```js
function filter(type, data) {
  // 只处理普通弹幕
  if (type !== "danmu") return true;

  // 保留包含 🐖 的弹幕
  return data["#text"]?.includes("🐖");
}
```

#### 调试技巧

在开发过滤函数时，可以使用 `logger.info` 输出信息帮助调试，可以在log文件中找到 **注意不要使用大文件，不然可能会爆**:

```js
function filter(type, data, logger) {
  // 输出所有弹幕信息查看结构
  logger.info("Type:", type, "Data:", data);

  // 您的过滤逻辑
  return true;
}
```

::: tip 提示
转换完成后建议用文本编辑器打开生成的 ASS 文件，检查过滤效果是否符合预期。
:::

### 自定义参数函数

通过此功能，你可以打造出更加通用的弹幕转换预设，如针对不同分辨率设置不同字体大小，改变礼物框尺寸

#### 函数签名

```typescript
function custom(file: string, opts: DanmakuConfig, logger: Console): boolean;
```

**参数:**

- `file`: 文件路径
- `DanmakuConfig`: 弹幕完整配置，完整参数见 [定义](https://github.com/renmu123/biliLive-tools/blob/master/packages/types/src/preset.ts)

**返回值:**

- `DanmakuConfig`: 完整配置

#### 使用示例

此函数调用优先于过滤函数

```js
function custom(file, opts) {
  // 礼物框的高等于分辨率的高，注意：如果开启了分辨率自适应，那么这里已经被替换为实际视频分辨率
  opts.msgboxsize[1] = opts.resolution[1];
  // 如果高小于1000，那么字体大小设置为32像素
  if (opts.resolution[1] < 1000) {
    opts.fontsize = 32;
  }
  return opts;
}
```

## 故障排除

### 弹幕转换失败

如果你是Windows新安装的系统，请尝试安装系统相关运行库，如果不是，也请安装试试。

### 转换失败

1. 检查XML文件是否完整
2. 检查文件编码是否为UTF-8
3. 尝试使用其他弹幕文件测试
4. 查看日志获取详细错误

### 字体无法显示

1. 确认系统已安装该字体
2. 尝试使用系统默认字体
3. Docker环境需要挂载字体目录
