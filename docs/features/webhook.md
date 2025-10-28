# Webhook

Webhook 功能可以让录播软件与 biliLive-tools 自动配合，实现录制完成后自动处理、上传等功能。

## 支持的其他录播软件

- [B站录播姬](https://github.com/BililiveRecorder)
- [blrec](https://github.com/acgnhiki/blrec)
- [DDTV](https://github.com/CHKZL/DDTV)
- [oneliverec](https://www.oneliverec.cc)
- 自定义Webhook
- 虚拟录制
- 下载订阅

## B站录播姬

1. **在 biliLive-tools 中配置**

   - 设置"录播姬工作目录"为录播姬的工作目录

2. **在录播姬中配置**
   - 打开录播姬设置
   - 找到 WebhookV2 设置
   - 填入地址：`http://127.0.0.1:18010/webhook/bililiverecorder`

## blrec

- 打开 blrec 设置
- 找到 Webhook 设置
- 填入地址：`http://127.0.0.1:18010/webhook/blrec`
- **必须勾选"视频文件创建"和"视频文件完成"两个事件**，建议直接勾选全部事件

::: warning 注意
blrec 的 Webhook 依赖于"视频文件创建"和"视频文件完成"两个事件，缺一不可。
:::

### 特别说明

如果开启了 blrec 的"转换为MP4"功能，请关闭该功能，使用 biliLive-tools 的"转封装为MP4"功能。

## Oneliverec

### 配置步骤

- 打开 oneliverec 设置
- 找到 Webhook 设置
- 填入地址：`http://127.0.0.1:18010/webhook/oneliverec`
- **必须启用"格式转换"**
- **必须选中"视频转换完成"事件**，建议直接勾选全部事件

::: warning 注意

1. 必须启用"格式转换"
2. Webhook事件必须选中"视频转换完成"事件
   :::

## DDTV

### 配置步骤

- 打开"设置" -> "文件与路径设置"
- 将"录制文件保存路径"设置为**绝对路径**
- 启用"弹幕录制"
- 填入地址：`http://127.0.0.1:18010/webhook/ddtv`

::: warning 注意
由于 DDTV 的 Webhook 参数比较特殊，无法保证任意配置下的可用性。
:::

## 自定义 Webhook

如果你使用的录播软件不在支持列表中，可以自行构造参数调用接口。

### 接口信息

- **地址**：`http://127.0.0.1:18010/webhook/custom`
- **方法**：`POST`
- **Content-Type**：`application/json`

### 参数说明

| 参数              | 类型   | 必填 | 说明                                                  |
| ----------------- | ------ | ---- | ----------------------------------------------------- |
| `event`           | string | 是   | 事件类型：`FileClosed`、`FileOpening`、`FileError`    |
| `filePath`        | string | 是   | 视频文件的绝对路径                                    |
| `coverPath`       | string | 否   | 视频封面的绝对路径，为空时会读取同名jpg文件           |
| `danmuPath`       | string | 否   | 视频弹幕xml文件，为空时会读取同名xml文件              |
| `roomId`          | number | 是   | 房间号，用于断播续传                                  |
| `time`            | string | 是   | 用于标题格式化的时间，示例："2021-05-14T17:52:54.946" |
| `title`           | string | 是   | 标题，用于格式化视频标题                              |
| `username`        | string | 是   | 主播名称，用于格式化视频标题                          |
| `platform`        | string | 否   | 平台，用于弹幕分析（如：`bilibili`、`douyu`）         |
| `live_start_time` | string | 否   | 直播开始时间，用于弹幕分析                            |
| `live_title`      | string | 否   | 直播标题，用于弹幕分析                                |

### 事件类型

- **FileOpening**：文件开始录制
- **FileClosed**：文件录制完成
- **FileError**：文件错误，将该视频标注为错误，避免阻塞流程

::: tip 断播续传
如果想使用断播续传功能，需要在上一个 `FileClosed` 事件后，在设置的时间间隔内发送 `FileOpening` 事件。
:::

### 示例

```bash
curl --location 'http://127.0.0.1:18010/webhook/custom' \
--header 'Content-Type: application/json' \
--data '{
    "event":"FileClosed",
    "filePath":"D:\\aa.mp4",
    "coverPath":"D:\\aa.jpg",
    "danmuPath":"D:\\aa.xml",
    "roomId":93589,
    "time":"2021-05-14T17:52:54.946",
    "title":"我是猪",
    "username":"djw",
    "platform":"bilibili",
    "live_start_time":"2021-05-14T17:52:54.946",
    "live_title":"直播标题"
}'
```

## Webhook 配置

### 全局配置

在"设置" -> "Webhook"中配置全局默认行为：

#### 基础配置

- **Webhook开关**：启用/禁用 Webhook 功能
- **录播姬工作目录**：录播姬的工作目录（仅录播姬需要）

#### 自动化处理

- **转封装为MP4**：自动将FLV转换为MP4
- **压制弹幕**：自动将弹幕压制到视频中
- **高能进度条**：自动生成高能进度条
- **自动上传**：自动上传到B站
- **自动同步**：自动同步到云存储

#### 上传配置

- **账号**：选择上传使用的B站账号
- **标题格式**：标题模板

#### 其他

- 是否启用
- 转封装设置
- 压制设置
- 上传设置
- 同步设置
- 等等...

### 直播间配置

为每个直播间单独配置 Webhook 行为：

1. 打开"Webhook配置"
2. 点击"添加配置"
3. 选择房间号
4. 配置该房间的处理规则

::: tip 提示
直播间配置优先级高于全局配置。
:::

## 标题模板引擎

Webhook 标题支持 [ejs模板引擎](https://github.com/mde/ejs)，可以实现复杂的标题格式化。

### 占位符

同时也支持 `{{}}` 占位符：

- <code v-pre>{{title}}</code> - 直播标题
- <code v-pre>{{user}}</code> - 主播名
- <code v-pre>{{roomId}}</code> - 房间号
- <code v-pre>{{filename}}</code> - 视频文件名
- <code v-pre>{{now}}</code> - 视频录制时间（示例：2024.01.24）
- <code v-pre>{{yyyy}}</code> - 年
- <code v-pre>{{MM}}</code> - 月（补零）
- <code v-pre>{{dd}}</code> - 日（补零）
- <code v-pre>{{HH}}</code> - 时（补零）
- <code v-pre>{{mm}}</code> - 分（补零）
- <code v-pre>{{ss}}</code> - 秒（补零）

### ejs

#### 可用变量

```typescript
{
  title: string; // 直播间标题
  user: string; // 主播名称
  time: Date; // 直播开始时间
  roomId: number | string; // 房间号
}
```

### 示例

**示例1：使用 ejs**

```
<%= user %>-<%= time.getFullYear() %><%= String(time.getMonth() + 1).padStart(2, "0") %>直播录像
```

渲染结果：`djw-202408直播录像`

**示例2：使用占位符**

```
{{user}}的直播录像-{{title}}
```

渲染结果：`djw的直播录像-今天打游戏`

**示例3：混合使用**

```
<% if (roomId == 123456) { %>特殊房间<% } else { %>{{user}}的直播<% } %>
```

::: warning 注意
如果标题超过80字，会被自动截断。
:::

## 常见问题

### Webhook 没有触发

1. 检查 Webhook 开关是否启用
2. 检查录播软件的 Webhook 地址是否正确
3. 检查端口是否被占用
4. 查看日志文件排查问题

### 文件路径找不到

1. Docker 环境下检查卷映射是否一致
2. 检查路径是否为绝对路径
3. 检查文件是否真实存在

### 弹幕文件找不到

Webhook 会自动查找同名的 XML 文件，确保：

1. 弹幕文件与视频文件在同一目录
2. 弹幕文件名与视频文件名一致（除扩展名外）
3. 弹幕文件扩展名为 `.xml`

### 上传失败

1. 检查 B站账号是否登录
2. 检查网络连接
3. 增加重试次数
4. 查看详细错误信息
