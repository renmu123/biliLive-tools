# Record History API

录制历史相关接口文档。

## 查询直播记录

查询指定房间的直播记录列表，支持分页和时间范围筛选。

**接口地址:** `GET /record-history/list`

**请求参数:**

| 参数名    | 类型   | 必填 | 说明                     |
| --------- | ------ | ---- | ------------------------ |
| room_id   | string | 是   | 房间号                   |
| platform  | string | 是   | 平台名称                 |
| page      | number | 否   | 页码，默认为 1           |
| pageSize  | number | 否   | 每页条数，默认为 100     |
| startTime | number | 否   | 开始时间(时间戳,单位:秒) |
| endTime   | number | 否   | 结束时间(时间戳,单位:秒) |

**返回数据:**

```json
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "created_at": 1730275200,
      "streamer_id": 1,
      "live_id": "live_123456",
      "live_start_time": 1730275200,
      "record_start_time": 1730275210,
      "record_end_time": 1730280000,
      "title": "直播标题",
      "video_file": "/path/to/video.flv",
      "video_duration": 4790.5,
      "danma_num": 1250,
      "interact_num": 320,
      "danma_density": 0.26
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "pageSize": 100
  }
}
```

**返回参数说明:**

| 参数名                   | 类型   | 说明                                   |
| ------------------------ | ------ | -------------------------------------- |
| code                     | number | 状态码,200表示成功                     |
| data                     | array  | 记录列表                               |
| data[].id                | number | 记录ID                                 |
| data[].streamer_id       | number | 主播ID                                 |
| data[].live_id           | string | 直播ID                                 |
| data[].live_start_time   | number | 直播开始时间(时间戳,单位:秒)           |
| data[].record_start_time | number | 视频录制开始时间(时间戳,单位:秒)       |
| data[].record_end_time   | number | 视频录制结束时间(时间戳,单位:秒)       |
| data[].title             | string | 直播标题                               |
| data[].video_file        | string | 视频文件路径                           |
| data[].video_duration    | number | 视频持续时长(单位:秒,浮点数)           |
| data[].danma_num         | number | 弹幕数量                               |
| data[].interact_num      | number | 互动人数                               |
| data[].danma_density     | number | 弹幕密度(弹幕数/视频时长,保留两位小数) |
| data[].created_at        | number | 创建时间(时间戳,单位:秒)               |
| pagination               | object | 分页信息                               |
| pagination.total         | number | 总记录数                               |
| pagination.page          | number | 当前页码                               |
| pagination.pageSize      | number | 每页条数                               |

## 删除直播记录

删除指定的直播记录。

**接口地址:** `DELETE /record-history/:id`

**路径参数:**

| 参数名 | 类型   | 必填 | 说明   |
| ------ | ------ | ---- | ------ |
| id     | number | 是   | 记录ID |

**返回数据:**

```json
{
  "code": 200,
  "message": "删除成功"
}
```

**返回参数说明:**

| 参数名  | 类型   | 说明               |
| ------- | ------ | ------------------ |
| code    | number | 状态码,200表示成功 |
| message | string | 操作结果信息       |

::: warning
该操作仅删除数据库记录,不会删除实际的视频文件。
:::

## 获取文件信息

获取相关的文件信息

**接口地址:** `GET /record-history/file/:id`

**路径参数:**

| 参数名 | 类型   | 必填 | 说明   |
| ------ | ------ | ---- | ------ |
| id     | number | 是   | 记录ID |

**返回数据:**

```json
{
  "videoFileId": "abc123def456",
  "videoFileExt": "flv",
  "videoFilePath": "/video.mp4",
  "danmaFilePath": "/video.xml",
  "danmaFileId": "waa",
  "danmaFileExt": "xml"
}
```

**返回参数说明:**

| 参数名        | 类型           | 说明                                                          |
| ------------- | -------------- | ------------------------------------------------------------- |
| videoFilePath | string         | 视频文件实际路径，优先查找记录的文件，其次查找 `mp4` 文件     |
| videoFileId   | string         | 文件ID,用于后续的文件下载操作                                 |
| videoFileExt  | string         | 视频文件类型,可能的值: `flv`(FLV格式)、`ts`(TS格式)或空字符串 |
| danmaFilePath | string \| null | 弹幕文件实际路径，优先查找记录的文件，其次查找 `ass` 文件     |
| danmaFileId   | string \| null | 弹幕ID                                                        |
| danmaFileExt  | string \| null | 弹幕类型，`xml`、`ass`                                        |
