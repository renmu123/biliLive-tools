---
name: bililive-tools
description: "处理 biliLive-tools 录制相关操作。Use when: 需要查询录制状态，添加直播间、查询任务、视频压制、字幕识别"
argument-hint: "提供需要进行的操作，如查询xx录制状态、添加直播间"
user-invocable: true
---

# bililive tools recorder

## 前置条件

- 检查`BILILIVE_TOOLS_AUTH`环境变量是否设置，通关`authorization`头进行传递，所有的接口均需要鉴权
- 检查`BILILIVE_TOOLS_API_URL`环境变量是否设置

如果两者有一个没有设置，提示用户进行设置

## 执行方式

优先直接用现有工具或终端发 HTTP 请求，不需要新建脚本。

- 设置`Content-Type: application/json; charset=utf-8`
- 对请求体使用 UTF-8 字节而不是依赖终端默认字符串编码

curl 示例：

```bash
curl -H "Authorization: your-pass-key" "http://127.0.0.1:18010/recorder/list?name=关键词&page=1&pageSize=100"
```

## 功能说明

### 录制相关

See [the reference guide](references/recorder.md) for details.

- 获取录制列表(`/recorder/list`)，支持根据名称关键词、平台等条件筛选
- 手动开始(`/recorder/:id/start`)或停止(`/recorder/:id/stop`)录制或切断录制(`/recorder/:id/cut`)
- 获取直播间的源站信息(`/recorder/manager/live-info`)，**除非用户要求查询直播间的直播状态，否则不要去主动查询**
- 添加直播间(`/recorder/add`)

### 任务相关

See [the reference guide](references/task.md) for details.

- 查询任务列表(`/task/list`)，支持根据名称关键词、状态等条件筛选
- 恢复(`/task/:id/resume`)、终止(`/task/:id/kill`)、中断(`/task/:id/interrupt`)、重启(`/task/:id/restart`)或启动(`/task/:id/start`)任务

### 预设相关

See [the reference guide](references/preset.md) for details.

一共存在三种预设，分别是ffmpeg预设、弹幕预设和视频发布预设，用户可以通过接口进行增删改查。

如果涉及删除操作，必须用户额外确认

### 视频相关

See [the reference guide](references/video.md) for details.

- 视频转码(`/task/transcode`)
- 视频切片(`/task/cut`)
- 字幕识别(`/task/subtitle`)

## 示例

### 开启录制

首先去查询源站信息，查看是否直播中，如果直播中则调用`/recorder/:id/start`接口开始录制，如果未直播则提示用户未直播。

### 添加直播间

用户首先需要传入直播间url，之后调用`/recorder/manager/resolve-channel`进行解析，然后将解析后的数据传入`/recorder/add`接口进行添加，添加时询问用户是否禁用自动监控。

### 更新直播间

首先`GET /recorder/:id`获取录制信息，然后`PUT /recorder/:id`更新录制信息，将获取到的信息全局透传到更新接口中，用户只需要修改需要修改的字段即可。

### 查询任务列表

`pageSize`参数默认值为15，用户可以选择修改这个值来获取更多或更少的结果。

### 查询某个上传任务的审核状态

仅支持`bili`类型的任务，调用 `/task/queryVideoStatus`
