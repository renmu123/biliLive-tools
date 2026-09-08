# B 站 API

本页接口用于 B 站账号登录、投稿、稿件信息查询以及投稿配置的辅助校验。涉及已登录 B 站账号的接口需要提供该账号的 `uid`；通用鉴权方式见 [基础 API](./base.md)。

::: warning
上传和编辑投稿会在服务器上读取 `videos` 指定的本地文件路径。请只向你信任的服务端开放这些接口。
:::

## 投稿配置

[数据结构](./preset.md#创建视频上传预设)

### 校验投稿配置

**接口地址：** `POST /bili/validUploadParams`

请求体为完整的 `config` 对象。校验通过返回字符串 `success`；失败返回 HTTP 400 和错误信息。

## 账号登录

### 创建二维码登录

创建一个 B 站 TV 端二维码登录会话。

**接口地址：** `POST /bili/login`

**响应示例：**

```json
{
  "url": "https://passport.bilibili.com/h5-app/passport/sso?...",
  "id": "b1f0c4c1-..."
}
```

将 `url` 生成二维码并由 B 站 App 扫码。之后使用 `id` 轮询登录结果；成功后账号会自动保存，可通过 [用户 API](./user.md) 查询。

### 轮询登录状态

**接口地址：** `GET /bili/login/poll?id=:id`

| 参数 | 类型   | 必填 | 说明                          |
| ---- | ------ | ---- | ----------------------------- |
| id   | string | 是   | 创建二维码登录时返回的会话 ID |

**响应示例：**

```json
{
  "res": "{...}",
  "status": "scan",
  "failReason": ""
}
```

`status` 的值为 `scan`（等待扫描或确认）、`completed`（登录成功）或 `error`（登录失败）。失败时查看 `failReason`。

### 取消二维码登录

**接口地址：** `POST /bili/login/cancel`

**请求示例：**

```json
{
  "id": "b1f0c4c1-..."
}
```

成功返回 `success`；未传或找不到 `id` 时返回 HTTP 400。

## 投稿

### 创建投稿任务或追加分 P

创建新的 B 站投稿任务；传入 `vid` 时，向已有稿件追加分 P。接口异步执行，返回的 `taskId` 可通过 [任务 API](./task.md) 查询状态和进度。

**接口地址：** `POST /bili/upload`

| 参数                                 | 类型                 | 必填     | 说明                                                 |
| ------------------------------------ | -------------------- | -------- | ---------------------------------------------------- |
| uid                                  | number               | 是       | 已登录 B 站账号的 UID                                |
| vid                                  | number               | 否       | 已有稿件的 AID；传入时为追加分 P，不会修改原稿件信息 |
| videos                               | string[] \| object[] | 是       | 要上传的视频文件；至少一个                           |
| videos[].path                        | string               | 条件必填 | 对象形式下的视频绝对路径                             |
| videos[].title                       | string               | 否       | 对象形式下的分 P 标题；未传时使用文件名              |
| config                               | object               | 是       | [投稿配置](#投稿配置)                                |
| options.removeOriginAfterUploadCheck | boolean              | 否       | 审核通过后是否删除源文件，默认 `false`               |

**请求示例：**

```json
{
  "uid": 123456789,
  "videos": [
    {
      "path": "D:/records/part-1.mp4",
      "title": "第一部分"
    }
  ],
  "config": {
    "title": "直播回放",
    "copyright": 1,
    "tag": ["直播回放"],
    "tid": 174,
    "dolby": 0,
    "hires": 0
  },
  "options": {
    "removeOriginAfterUploadCheck": false
  }
}
```

**响应示例：**

```json
{
  "taskId": "task_123"
}
```

缺少 `uid`、`videos` 或 `config` 时，接口返回 HTTP 400。

## 稿件与投稿中心

以下接口的响应为 B 站接口数据，字段会随 B 站调整而变化。

### 获取投稿中心稿件列表

**接口地址：** `GET /bili/archives?uid=:uid&pn=:pn&ps=:ps`

| 参数 | 类型   | 必填 | 说明           |
| ---- | ------ | ---- | -------------- |
| uid  | number | 是   | 已登录账号 UID |
| pn   | number | 否   | 页码           |
| ps   | number | 否   | 每页数量       |

### 获取公开稿件详情

**接口地址：** `GET /bili/user/archive/:bvid?uid=:uid`

| 参数 | 类型   | 必填 | 说明                                       |
| ---- | ------ | ---- | ------------------------------------------ |
| bvid | string | 是   | BVID，例如 `BV1xx411c7mD`                  |
| uid  | number | 否   | 使用指定账号请求；可提高需登录内容的可用性 |

### 获取创作中心稿件详情

**接口地址：** `GET /bili/platformArchiveDetail?aid=:aid&uid=:uid`

| 参数 | 类型   | 必填 | 说明           |
| ---- | ------ | ---- | -------------- |
| aid  | number | 是   | 稿件 AID       |
| uid  | number | 是   | 已登录账号 UID |

### 校验标签

**接口地址：** `POST /bili/checkTag`

**请求示例：**

```json
{
  "tag": "直播回放",
  "uid": 123456789
}
```

返回 B 站的标签校验结果。

### 搜索话题

**接口地址：** `GET /bili/searchTopic?keyword=:keyword&uid=:uid`

| 参数    | 类型   | 必填 | 说明           |
| ------- | ------ | ---- | -------------- |
| keyword | string | 是   | 话题关键词     |
| uid     | number | 是   | 已登录账号 UID |

接口固定返回最多 20 条、从第一条开始的话题搜索结果。

### 获取合集列表

**接口地址：** `GET /bili/seasons?uid=:uid`

| 参数 | 类型   | 必填 | 说明           |
| ---- | ------ | ---- | -------------- |
| uid  | number | 是   | 已登录账号 UID |

接口固定请求第一页，最多返回 100 个合集。

### 根据稿件获取所属合集

**接口地址：** `GET /bili/season/:aid?uid=:uid`

| 参数 | 类型   | 必填 | 说明           |
| ---- | ------ | ---- | -------------- |
| aid  | number | 是   | 稿件 AID       |
| uid  | number | 是   | 已登录账号 UID |

## 模板预览

模板预览接口不会创建投稿，可用于在保存配置前检查标题、分 P 标题和简介的渲染结果。三个接口均直接返回渲染后的字符串。

### 预览视频标题

**接口地址：** `POST /bili/formatTitle`

### 预览视频简介

**接口地址：** `POST /bili/formatDesc`

两个接口的请求体字段相同；`/bili/formatTitle` 必须传入 `options`，`/bili/formatDesc` 未传 `options` 时会使用示例数据。

| 参数             | 类型             | 必填                   | 说明                    |
| ---------------- | ---------------- | ---------------------- | ----------------------- |
| template         | string           | 是                     | 标题或简介模板          |
| options          | object           | 标题预览是；简介预览否 | 模板上下文              |
| options.title    | string           | 条件必填               | 直播标题                |
| options.username | string           | 条件必填               | 主播名                  |
| options.time     | string           | 条件必填               | ISO 8601 格式的直播时间 |
| options.roomId   | string \| number | 条件必填               | 房间号                  |
| options.filename | string           | 条件必填               | 不含扩展名的文件名      |

**请求示例：**

```json
{
  "template": "{{user}}｜{{yyyy}}-{{MM}}-{{dd}}｜{{title}}",
  "options": {
    "title": "周末杂谈",
    "username": "主播名",
    "time": "2026-07-20T12:00:00.000Z",
    "roomId": 123456,
    "filename": "record-001"
  }
}
```

### 预览分 P 标题

**接口地址：** `POST /bili/formatPartTitle`

请求体与标题预览相同，`options` 还必须包含 `index`（从 1 开始的分 P 序号）。

**请求示例：**

```json
{
  "template": "P{{index}} {{hasDanmaStr}} - {{title}}",
  "options": {
    "title": "周末杂谈",
    "username": "主播名",
    "time": "2026-07-20T12:00:00.000Z",
    "roomId": 123456,
    "filename": "record-001-弹幕版",
    "index": 1
  }
}
```

## 常见错误

| HTTP 状态 | 可能原因                                                                                    |
| --------- | ------------------------------------------------------------------------------------------- |
| 400       | 上传时缺少 `uid`、`videos` 或 `config`；登录轮询或取消时缺少或不存在 `id`；投稿配置校验失败 |
| 401 / 403 | 未提供或提供了错误的接口 PassKey，或 B 站账号授权失效                                       |
| 5xx       | B 站接口、文件读取或上传任务初始化失败；查看服务端日志获取具体原因                          |
