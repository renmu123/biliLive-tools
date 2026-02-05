# Recorder API

录制任务相关接口文档。

::: tip
其中的id是内部id，并非直播间id，可从列表接口获取
:::

## 获取录制任务列表

获取所有录制任务的列表,支持筛选和分页。

**接口地址:** `GET /recorder/list`

**请求参数:**

| 参数名        | 类型    | 必填 | 说明                                                                               |
| ------------- | ------- | ---- | ---------------------------------------------------------------------------------- |
| platform      | string  | 否   | 直播平台,可选值: `DouYu`(斗鱼), `HuYa`(虎牙), `Bilibili`(哔哩哔哩), `DouYin`(抖音) |
| recordStatus  | string  | 否   | 录制状态, `recording`(录制中), `unrecorded`(未录制)                                |
| name          | string  | 否   | 备注名称或直播间号,模糊搜索                                                        |
| autoCheck     | boolean | 否   | 是否自动监控                                                                       |
| page          | number  | 否   | 页码                                                                               |
| pageSize      | number  | 否   | 每页数量                                                                           |
| sortField     | string  | 否   | 排序字段, `living`(直播状态), `state`(录制状态), `monitorStatus`(监控状态)         |
| sortDirection | string  | 否   | 排序方向, `asc`(升序), `desc`(降序)                                                |

## 添加录制任务

添加一个新的录制任务。

**接口地址:** `POST /recorder/add`

**参数太多了，自己去抓吧**

<!-- **请求参数:**

| 参数名                              | 类型    | 必填 | 说明                 |
| ----------------------------------- | ------- | ---- | -------------------- |
| providerId                          | string  | 是   | 平台ID               |
| channelId                           | string  | 是   | 直播间ID             |
| remarks                             | string  | 否   | 备注                 |
| disableAutoCheck                    | boolean | 否   | 禁用自动监控         |
| quality                             | string  | 否   | 画质                 |
| streamPriorities                    | array   | 否   | 流优先级             |
| sourcePriorities                    | array   | 否   | 源优先级             |
| extra                               | object  | 否   | 额外配置             |
| noGlobalFollowFields                | array   | 否   | 不跟随全局配置的字段 |
| line                                | string  | 否   | 线路                 |
| disableProvideCommentsWhenRecording | boolean | 否   | 录制时禁用弹幕       |
| saveGiftDanma                       | boolean | 否   | 保存礼物弹幕         |
| saveRawDanma                        | boolean | 否   | 保存弹幕原始数据     |
| saveSCDanma                         | boolean | 否   | 保存SC弹幕           |
| segment                             | object  | 否   | 分段配置             |
| sendToWebhook                       | boolean | 否   | 发送到Webhook        |
| uid                                 | string  | 否   | 用户ID               |
| saveCover                           | boolean | 否   | 保存封面             |
| qualityRetry                        | boolean | 否   | 画质重试             |
| formatName                          | string  | 否   | 文件名格式           |
| useM3U8Proxy                        | boolean | 否   | 使用M3U8代理         |
| codecName                           | string  | 否   | 编码器名称           |
| titleKeywords                       | array   | 否   | 标题关键词           |
| liveStartNotification               | boolean | 否   | 开播通知             |
| weight                              | number  | 否   | 权重                 |
| source                              | string  | 否   | 来源                 |
| videoFormat                         | string  | 否   | 视频格式             |
| recorderType                        | string  | 否   | 录制器类型           |
| cookie                              | string  | 否   | Cookie               |
| doubleScreen                        | boolean | 否   | 双屏                 |
| onlyAudio                           | boolean | 否   | 仅音频               |
| useServerTimestamp                  | boolean | 否   | 使用服务器时间戳     |
| handleTime                          | object  | 否   | 处理时间             |
| debugLevel                          | string  | 否   | 调试级别             | -->

## 获取录制任务详情

获取指定录制任务的配置信息。

**接口地址:** `GET /recorder/:id`

**路径参数:**

| 参数名 | 类型   | 必填 | 说明       |
| ------ | ------ | ---- | ---------- |
| id     | string | 是   | 录制任务ID |

## 更新录制任务

更新指定录制任务的配置。

**接口地址:** `PUT /recorder/:id`

**路径参数:**

| 参数名 | 类型   | 必填 | 说明       |
| ------ | ------ | ---- | ---------- |
| id     | string | 是   | 录制任务ID |

**请求参数:**

**参数太多了，自己去抓吧**

## 删除录制任务

删除指定的录制任务。

**接口地址:** `DELETE /recorder/:id`

**路径参数:**

| 参数名 | 类型   | 必填 | 说明       |
| ------ | ------ | ---- | ---------- |
| id     | string | 是   | 录制任务ID |

**查询参数:**

| 参数名        | 类型   | 必填 | 说明                                                   |
| ------------- | ------ | ---- | ------------------------------------------------------ |
| removeHistory | string | 否   | 是否删除录制历史,传入 `"true"` 表示删除,默认为 `false` |

## 开始录制

手动开始录制指定的直播间。

**接口地址:** `POST /recorder/:id/start_record`

**路径参数:**

| 参数名 | 类型   | 必填 | 说明       |
| ------ | ------ | ---- | ---------- |
| id     | string | 是   | 录制任务ID |

## 停止录制

手动停止录制指定的直播间，**手动停止后，本场直播自动监听不再生效**

**接口地址:** `POST /recorder/:id/stop_record`

**路径参数:**

| 参数名 | 类型   | 必填 | 说明       |
| ------ | ------ | ---- | ---------- |
| id     | string | 是   | 录制任务ID |

## 切断录制

切断当前录制,开始新的录制文件，**仅支持录播姬引擎**

**接口地址:** `POST /recorder/:id/cut`

**路径参数:**

| 参数名 | 类型   | 必填 | 说明       |
| ------ | ------ | ---- | ---------- |
| id     | string | 是   | 录制任务ID |

## 解析直播间地址

解析直播间URL,获取对应的直播间信息。

**接口地址:** `GET /recorder/manager/resolveChannel`

**查询参数:**

| 参数名 | 类型   | 必填 | 说明       |
| ------ | ------ | ---- | ---------- |
| url    | string | 是   | 直播间地址 |

具体支持的格式见 [支持的直播间链接](../features/live-record.md#直播间链接)

## 获取直播间源站信息

批量获取直播间的源站信息。

**接口地址:** `POST /recorder/manager/liveInfo`

**请求参数:**

| 参数名       | 类型    | 必填 | 说明                                          |
| ------------ | ------- | ---- | --------------------------------------------- |
| ids          | array   | 是   | 录制任务ID列表                                |
| forceRequest | boolean | 否   | 强制查询直播间信息,不受配置限制,默认为 `true` |
