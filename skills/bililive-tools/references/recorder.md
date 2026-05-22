# Recorder API

录制任务相关接口文档。

::: tip
其中的id是内部录制id，并非直播间id，可从列表接口获取
:::

## 获取录制列表

获取所有录制任务的列表,支持筛选和分页。

**接口地址:** `GET /recorder/list`

**请求参数:**

| 参数名        | 类型    | 必填 | 说明                                                                                                |
| ------------- | ------- | ---- | --------------------------------------------------------------------------------------------------- |
| platform      | string  | 否   | 直播平台,可选值: `DouYu`(斗鱼), `HuYa`(虎牙), `Bilibili`(哔哩哔哩), `DouYin`(抖音)、`XHS`(小红书)   |
| status        | string  | 否   | 录制状态, `recording`(录制中), `idle`(空闲中), `check-error`(检查错误), `title-blocked`(标题被屏蔽) |
| name          | string  | 否   | 备注名称或直播间号,模糊搜索                                                                         |
| autoCheck     | boolean | 否   | 是否自动监控                                                                                        |
| page          | number  | 否   | 页码                                                                                                |
| pageSize      | number  | 否   | 每页数量                                                                                            |
| sortField     | string  | 否   | 排序字段, `living`(直播状态), `state`(录制状态), `monitorStatus`(监控状态)                          |
| sortDirection | string  | 否   | 排序方向, `asc`(升序), `desc`(降序)                                                                 |

**返回数据:**

```json
{
  "payload": [
    {
      "id": "fd5f94e4-4f78-4623-b705-5a7095676f96", // 内部录制id，用于开始录制、删除等操作
      "providerId": "DouYu", // 平台
      "channelId": "2140934", // 直播间号
      "remarks": "老皮12.27历险记", // 备注
      "disableAutoCheck": true, // 是否禁用自动录制
      "channelURL": "https://www.douyu.com/2140934", // 原站链接
      // 仅当录制中状态存在
      "recordHandle": {
        "id": "b59f832a-82b0-4948-af88-5715b9aa4794",
        "stream": "原画2K60", // 画质
        "source": "hs", // 使用的路线
        "recorderType": "ffmpeg", // 使用的录制器，ffmpeg：ffmpeg、 mesio：mesio、bililive：录播姬
        "url": "https://huos1a.douyucdn2.cn/live/2140934rMNEDcr4D.flv?wsAuth=874e3bf44e9d4456de93434ac4ef8032&token=web-h5-0-2140934-c5beacba295c6775a5ed35207379674e5b17beacf5dc2fc2&logo=0&expire=0&did=0cd6b908331044a28188f47e64126ac8&pt=2&st=0&sid=431568548&mcid2=0&origin=dy&fcdn=hs&fo=0&mix=0&isp=", // 当前录制的链接
        "savePath": "C:\\Users\\renmu\\Downloads\\录制\\斗鱼\\老皮历险记\\老皮12.27历险记-单机王中王 2026-05-21 22-01-PART%03d.mp4", //保存路径
        "progress": { "time": "00:09:55" } // 录制时长，不一定存在
      },
      // 仅当监听中状态存在
      "liveInfo": {
        "living": true, // 是否正在直播
        "owner": "老皮历险记", // 主播名称
        "title": "单机王中王", // 直播标题
        "avatar": "https://apic.douyucdn.cn/upload/avanew/face/201707/31/08/10261cc4580588526811b7a4da775de8_big.jpg", // 主播头像
        "cover": "https://rpic.douyucdn.cn/asrpic/260521/2140934_src_2158.avif/dy4", // 直播封面
        "liveStartTime": "2026-05-21T09:19:16.000Z", // 直播开始时间
        "liveId": "b392a59f3b574a4fde630422549db852",
        "recordStartTime": "2026-05-21T14:01:08.652Z", // 录制开始时间，如果正在录制的话
        "area": "主机其他游戏" // 分区
      },
      "state": "recording", // 当前状态，recording：录制中、idle：空闲中、check-error：检查错误、title-blocked：标题被屏蔽
      "usedSource": "hs", // 使用的路线
      "usedStream": "原画2K60", // 画质
      "tempStopIntervalCheck": false, // 是否被临时暂停了
      "onlyAudio": false, // 是否使用了仅音频
      "extra": {
        "createTimestamp": 1760791981452, // 录制创建时间
        "avatar": "https://apic.douyucdn.cn/upload/avanew/face/201707/31/08/10261cc4580588526811b7a4da775de8_big.jpg",
        "lastRecordTime": 1779372068796 // 最后的录制时间
      }
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "pageSize": 100
  }
}
```

## 添加录制

添加一个新的录制。

**接口地址:** `POST /recorder/add`

**参数太多了，自己去抓吧，以下不完全是最新**

**请求参数:**

| 参数名                              | 类型    | 必填 | 说明                                                                                                               |
| ----------------------------------- | ------- | ---- | ------------------------------------------------------------------------------------------------------------------ |
| providerId                          | string  | 是   | 平台ID                                                                                                             |
| channelId                           | string  | 是   | 直播间ID                                                                                                           |
| remarks                             | string  | 否   | 备注                                                                                                               |
| disableAutoCheck                    | boolean | 否   | 禁用自动监控                                                                                                       |
| quality                             | string  | 否   | 画质                                                                                                               |
| extra                               | object  | 否   | 额外配置                                                                                                           |
| noGlobalFollowFields                | array   | 否   | 不跟随全局配置的字段                                                                                               |
| disableProvideCommentsWhenRecording | boolean | 否   | 禁用弹幕                                                                                                           |
| saveGiftDanma                       | boolean | 否   | 保存礼物弹幕                                                                                                       |
| saveSCDanma                         | boolean | 否   | 保存SC弹幕                                                                                                         |
| segment                             | object  | 否   | 0为不分段，默认为时间分段，单位分钟。<br/>如果以B,KB,MB,GB结尾，会尝试使用文件大小分段，ffmpeg引擎中使用会强制中断 |
| sendToWebhook                       | boolean | 否   | 发送到Webhook                                                                                                      |
| uid                                 | string  | 否   | 用户ID                                                                                                             |
| saveCover                           | boolean | 否   | 保存封面                                                                                                           |
| qualityRetry                        | number  | 否   | 流重试次数                                                                                                         |
| formatName                          | string  | 否   | 文件名格式                                                                                                         |
| useM3U8Proxy                        | boolean | 否   | 使用M3U8代理，仅B站                                                                                                |
| codecName                           | string  | 否   | 编码器名称                                                                                                         |
| titleKeywords                       | array   | 否   | 禁止标题关键词                                                                                                     |
| liveStartNotification               | boolean | 否   | 录制开始通知                                                                                                       |
| liveEndNotification                 | boolean | 否   | 录制结束通知                                                                                                       |
| weight                              | number  | 否   | 展示权重                                                                                                           |
| source                              | string  | 否   | 来源                                                                                                               |
| videoFormat                         | string  | 否   | 视频格式                                                                                                           |
| recorderType                        | string  | 否   | 录制器类型：`auto`:自动、`ffmpeg`：ffmpeg、`mesio`：mesio、`bililive`：录播姬引擎                                  |
| cookie                              | string  | 否   | Cookie                                                                                                             |
| doubleScreen                        | boolean | 否   | 抖音双屏                                                                                                           |
| onlyAudio                           | boolean | 否   | 仅音频                                                                                                             |
| useServerTimestamp                  | boolean | 否   | 使用服务器时间戳                                                                                                   |
| handleTime                          | object  | 否   | 监听时间                                                                                                           |
| debugLevel                          | string  | 否   | 调试级别                                                                                                           |

## 更新录制

具体参数参考添加录制

## 获取录制详情

获取指定录制任务的配置信息。

**接口地址:** `GET /recorder/:id`

**路径参数:**

| 参数名 | 类型   | 必填 | 说明       |
| ------ | ------ | ---- | ---------- |
| id     | string | 是   | 录制任务ID |

## 更新录制

更新指定录制任务的配置。

**接口地址:** `PUT /recorder/:id`

**路径参数:**

| 参数名 | 类型   | 必填 | 说明       |
| ------ | ------ | ---- | ---------- |
| id     | string | 是   | 录制任务ID |

**请求参数:**

**参数太多了，自己去抓吧**

## 删除录制

删除指定的录制任务。

**接口地址:** `DELETE /recorder/:id`

**路径参数:**

| 参数名 | 类型   | 必填 | 说明   |
| ------ | ------ | ---- | ------ |
| id     | string | 是   | 录制ID |

**查询参数:**

| 参数名        | 类型   | 必填 | 说明                                                 |
| ------------- | ------ | ---- | ---------------------------------------------------- |
| removeHistory | string | 否   | 是否删除录制历史,传入 `true` 表示删除,默认为 `false` |

## 开始录制

手动开始录制指定的直播间。

**接口地址:** `POST /recorder/:id/start`

**路径参数:**

| 参数名 | 类型   | 必填 | 说明   |
| ------ | ------ | ---- | ------ |
| id     | string | 是   | 录制ID |

## 停止录制

手动停止录制指定的直播间，**手动停止后，本场直播自动监听不再生效**

**接口地址:** `POST /recorder/:id/stop`

**路径参数:**

| 参数名 | 类型   | 必填 | 说明   |
| ------ | ------ | ---- | ------ |
| id     | string | 是   | 录制ID |

## 切断录制

切断当前录制,开始新的录制文件，**仅支持录播姬引擎**

**接口地址:** `POST /recorder/:id/cut`

**路径参数:**

| 参数名 | 类型   | 必填 | 说明   |
| ------ | ------ | ---- | ------ |
| id     | string | 是   | 录制ID |

## 解析直播间地址

解析直播间URL,获取对应的直播间信息。

**接口地址:** `GET /recorder/manager/resolve`

**查询参数:**

| 参数名 | 类型   | 必填 | 说明       |
| ------ | ------ | ---- | ---------- |
| url    | string | 是   | 直播间地址 |

具体支持的格式见 [支持的直播间链接](../features/live-record.md#直播间链接)

## 获取直播间源站信息

批量获取直播间的源站信息。

**接口地址:** `POST /recorder/manager/live-info`

**请求参数:**

| 参数名       | 类型    | 必填 | 说明                                          |
| ------------ | ------- | ---- | --------------------------------------------- |
| ids          | array   | 是   | 录制ID列表                                    |
| forceRequest | boolean | 否   | 强制查询直播间信息,不受配置限制,默认为 `true` |
