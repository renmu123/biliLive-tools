## 根据弹幕ID获取弹幕内容

根据弹幕文件ID返回弹幕类型和适配播放器后的内容。

**接口地址:** `GET /danma/content/:id`

**路径参数:**

| 参数名 | 类型   | 必填 | 说明       |
| ------ | ------ | ---- | ---------- |
| id     | string | 是   | 弹幕文件ID |

**返回数据（ASS）:**

```json
{
  "danmaType": "ass",
  "content": "[Script Info]..."
}
```

**返回数据（XML）:**

```json
{
  "danmaType": "xml",
  "content": [
    {
      "text": "test",
      "time": 1.5,
      "mode": 0,
      "color": "#ffffff",
      "border": false,
      "style": {}
    }
  ]
}
```

**返回参数说明:**

| 参数名    | 类型               | 说明                                         |
| --------- | ------------------ | -------------------------------------------- |
| danmaType | string             | 弹幕类型，当前支持 `ass`、`xml`              |
| content   | string \| object[] | `ass` 时为原始文本，`xml` 时为播放器弹幕数组 |

## 根据视频路径获取弹幕文件信息

根据视频文件路径获取关联弹幕文件信息。

**接口地址:** `POST /record-history/danma-file`

**请求参数:**

```json
{
  "videoFilePath": "/video.mp4"
}
```

**请求参数说明:**

| 参数名        | 类型   | 必填 | 说明         |
| ------------- | ------ | ---- | ------------ |
| videoFilePath | string | 是   | 视频文件路径 |

**返回数据:**

```json
{
  "danmaFilePath": "/video.xml",
  "danmaFileId": "waa",
  "danmaFileExt": "xml"
}
```

**返回参数说明:**

| 参数名        | 类型           | 说明                                         |
| ------------- | -------------- | -------------------------------------------- |
| danmaFilePath | string \| null | 弹幕文件实际路径，优先查找 `ass`，其次 `xml` |
| danmaFileId   | string \| null | 弹幕文件ID                                   |
| danmaFileExt  | string \| null | 弹幕文件类型，`xml`、`ass`                   |
