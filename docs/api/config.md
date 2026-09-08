# 设置

## 配置项内容

```js
{
  // ===== 基本设置 =====
  logLevel: "debug", // 日志等级: debug|info|warn|error
  autoUpdate: true, // 是否自动检查更新
  autoLaunch: false, // 是否开机启动 (仅桌面版)
  trash: false, // 删除文件时是否移到回收站
  saveConfig: false, // 是否自动保存配置
  minimizeToTray: false, // 最小化按钮是否最小化到托盘 (仅桌面版)
  closeToTray: true, // 关闭按钮是否最小化到托盘而不是退出 (仅桌面版)
  theme: "system", // 主题: light|dark|system
  menuBarVisible: true, // 菜单栏是否显示 (仅桌面版)
  port: 18010, // HTTP 服务端口
  host: "127.0.0.1", // HTTP 服务监听地址
  passKey: "", // API 请求鉴权密钥 (必填)

  // ===== Webhook 配置 (直播录制) =====
  webhook: {
    open: false, // 是否启用 Webhook 功能
    recoderFolder: "", // 本地录播姬配置文件夹路径
    minSize: 20, // 文件最小大小限制 (MB)
    title: "【{{user}}】{{title}}-{{now}}", // 直播间标题模板
    uploadPresetId: undefined, // 默认上传预设 ID
    blacklist: "", // 黑名单直播间 ID (逗号分隔)
    danmu: false, // 是否默认保存弹幕
    rooms: {  // 单个房间的webhook配置
      [roomId]:{ // 房间号
        id: [roomId],
        open: boolean, // 是否开启
        remark: "", // 备注
        noGlobal: [] // 非全局参数，全局参数的key值
      }
    }, // 直播间配置对象 {roomId: {uid, open, ...}}
    ffmpegPreset: undefined, // 默认转码预设
    danmuPreset: undefined, // 默认弹幕预设
    afterConvertAction: [], // 转码后执行的操作，removeXml|removeVideo|removeSmallFile|removeAfterConvert2Mp4
    hotProgress: false, // 是否生成高能进度条
    useLiveCover: false, // 是否使用直播封面
    partTitleTemplate: "{{filename}}", // 分片文件标题模板
    hotProgressSample: 30, // 热度条采样间隔 (秒)
    hotProgressHeight: 60, // 热度条高度 (像素)
    hotProgressColor: "#f9f5f3", // 热度条背景色
    hotProgressFillColor: "#333333", // 热度条填充色
    convert2Mp4: false, // 是否自动转换为 MP4
    flvRepair: false, // 是否修复 FLV 文件
    syncId: undefined, // 文件同步配置 ID
    uploadHandleTime: ["00:00:00", "23:59:59"], // 上传时间范围
    limitUploadTime: false, // 是否限制上传时间
    uploadNoDanmu: false, // 是否上传无弹幕版本
    uploadToSameMedia: false, // 是否上传到同一稿件
    noDanmuVideoPreset: undefined, // 无弹幕视频转码预设
    limitVideoConvertTime: false, // 是否限制转码时间
    videoHandleTime: ["00:00:00", "23:59:59"], // 转码时间范围
    afterUploadDeletAction: "none", // 上传后删除操作
  },

  // ===== 可执行文件路径 =====
  ffmpegPath: "", // FFmpeg 可执行文件路径
  ffprobePath: "", // FFprobe 可执行文件路径
  danmuFactoryPath: "", // 弹幕工厂可执行文件路径
  losslessCutPath: "", // lossless-cut 可执行文件路径
  mesioPath: "", // mesio 可执行文件路径
  bililiveRecorderPath: "", // 录播姬可执行文件路径
  audiowaveformPath: "", // audiowaveform 可执行文件路径
  cacheFolder: "", // 缓存文件夹路径 (空为使用系统临时文件夹)
  customExecPath: false, // 是否启用自定义可执行文件路径
  requestInfoForRecord: true, // 录制时是否请求用户信息
  biliUploadFileNameType: "ask", // B 站上传文件名处理: ask|preset|origin
  cutPageInNewWindow: false, // 切片页面是否在新窗口打开
  bilibiliUser: {}, // B 站用户信息

  // ===== 工具预设配置 =====
  tool: {
    home: {
      uploadPresetId: "default", // 首页上传预设
      danmuPresetId: "default", // 首页弹幕预设
      ffmpegPresetId: "b_libx264", // 首页转码预设
      removeOrigin: false, // 是否删除原文件
      autoUpload: false, // 是否自动上传
      removeOriginAfterUploadCheck: false, // 上传检查后删除原文件
      hotProgress: false, // 是否生成热度条
      hotProgressSample: 30,
      hotProgressHeight: 60,
      hotProgressColor: "#f9f5f3",
      hotProgressFillColor: "#333333",
    },
    upload: {
      uploadPresetId: "default", // 上传工具默认预设
      removeOriginAfterUploadCheck: false,
    },
    fileSync: {
      removeOrigin: false,
      syncType: undefined, // 同步类型
      aliyunpanDriveType: "backup", // 阿里云盘类型
      targetPath: "/", // 同步目标路径
    },
    danmu: {
      danmuPresetId: "default", // 弹幕转换默认预设
      saveRadio: 1, // 保存方式
      savePath: "", // 保存路径
      removeOrigin: false,
      override: true, // 是否覆盖
    },
    video2mp4: {
      saveRadio: 1,
      savePath: "",
      saveOriginPath: false, // 是否保存到原路径
      override: false,
      removeOrigin: false,
      ffmpegPresetId: "b_copy",
      danmuPresetId: "default",
      hotProgress: false,
    },
    videoMerge: {
      saveOriginPath: false,
      removeOrigin: false,
      keepFirstVideoMeta: false, // 是否保留第一个视频的元数据
      mergeXml: false, // 是否合并 XML 弹幕
    },
    flvRepair: {
      type: "bililive", // 修复源: bililive|huya
      saveRadio: 1,
      savePath: "",
    },
    download: {
      savePath: "",
      danmu: "none", // 是否下载弹幕: none|xml|ass
      douyuResolution: "highest", // 抖音下载清晰度
      override: false,
      onlyAudio: false, // 仅下载音频
      onlyDanmu: false, // 仅下载弹幕
    },
    translate: {
      presetId: undefined, // 视频转录预设
    },
    videoCut: {
      saveRadio: 1,
      savePath: ".\\导出文件夹",
      override: false,
      ffmpegPresetId: "b_libx264", // 切片转码预设
      title: "{{filename}}-{{label}}-{{num}}", // 切片标题模板
      danmuPresetId: "default",
      ignoreDanmu: false, // 是否忽略弹幕
      exportSubtitle: true, // 是否导出字幕
      ignoreSubtitle: false, // 是否忽略字幕
    },
  },

  // ===== 任务队列配置 =====
  task: {
    ffmpegMaxNum: 3, // FFmpeg 最大并发数
    douyuDownloadMaxNum: 2, // 抖音下载最大并发数
    biliUploadMaxNum: 2, // B 站上传最大并发数
    biliDownloadMaxNum: 2, // B 站下载最大并发数
    syncMaxNum: 3, // 文件同步最大并发数
  },

  // ===== 视频切片编辑器配置 =====
  videoCut: {
    autoSave: true, // 是否自动保存
    cacheWaveform: true, // 是否缓存波形图
  },

  // ===== 通知配置 =====
  notification: {
    task: {
      ffmpeg: [], // FFmpeg 任务完成通知
      danmu: [], // 弹幕转换完成通知
      upload: [], // 上传完成通知
      download: [], // 下载完成通知
      douyuDownload: [], // 抖音下载完成通知
      mediaStatusCheck: [], // 媒体状态检查通知
      diskSpaceCheck: { // 磁盘空间检查通知
        values: [],
        threshold: 10, // 磁盘剩余空间阈值 (GB)
      },
      sync: [], // 文件同步完成通知
    },
    setting: {
      type: undefined, // 通知类型: server|mail|tg|ntfy|allInOne|customHttp
      server: {
        key: "", // 服务器通知密钥
      },
      mail: {
        host: "", // 邮件服务器地址
        port: "465",
        user: "", // 邮件用户名
        pass: "", // 邮件密码
        to: "", // 收件人地址
        secure: true, // 是否使用 SSL
      },
      tg: {
        key: "", // Telegram Bot Token
        chat_id: "", // Telegram Chat ID
        proxyUrl: "", // 代理 URL
      },
      ntfy: {
        url: "", // ntfy.sh 服务地址
        topic: "", // 主题
      },
      allInOne: {
        server: "", // AllInOne 服务地址
        key: "", // API 密钥
      },
      customHttp: {
        url: "", // 自定义 HTTP 端点
        method: "GET",
        body: "", // 请求体模板
        headers: "", // 请求头 (JSON)
      },
    },
    taskNotificationType: {
      liveStart: "system", // 直播开始通知方式: system|server|...
    },
  },

  // ===== 文件同步配置 =====
  sync: {
    baiduPCS: {
      execPath: "", // BaiduPCS-Go 可执行文件路径
    },
    aliyunpan: {
      execPath: "", // 阿里云盘 CLI 可执行文件路径
    },
    alist: {
      apiUrl: "", // AList API 地址
      username: "", // AList 用户名
      hashPassword: "", // AList 密码哈希值
      limitRate: 0, // 上传限速 (KB/s)
      retry: 0, // 重试次数
    },
    pan123: {
      clientId: "", // 123 云盘 Client ID
      clientSecret: "", // 123 云盘 Client Secret
      limitRate: 0, // 上传限速 (KB/s)
    },
    syncConfigs: [], // 同步任务配置列表
  },

  // ===== LLM 预设 =====
  llmPresets: [],

  // ===== AI 配置 =====
  ai: {
    vendors: [ // AI 模型供应商列表
      {
        id: "3d09badd-5402-4b80-9113-48c0739d51b9",
        name: "阿里云",
        provider: "aliyun",
        apiKey: "", // API 密钥
      },
    ],
    models: [ // AI 模型配置列表
      {
        vendorId: "3d09badd-5402-4b80-9113-48c0739d51b9",
        modelId: "116497be-e650-4b21-8769-536859cb16dc",
        modelName: "fun-asr",
        remark: "语音识别",
        tags: ["asr"],
        config: {},
      },
    ],
    songRecognizeAsr: {
      modelId: "bcut", // 歌曲识别 ASR 模型
    },
    songRecognizeLlm: {
      modelId: "", // 歌曲识别 LLM 模型
      prompt: ``, // 提示词
      enableSearch: true, // 是否启用网络搜索
      maxInputLength: 300, // 最大输入长度
      enableStructuredOutput: true, // 是否启用结构化输出
      lyricOptimize: true, // 是否优化歌词
    },
    songLyricOptimize: {
      modelId: "", // 歌词优化模型
      prompt: ``,
      enableStructuredOutput: true,
    },
    subtitleRecognize: {
      modelId: "bcut", // 字幕识别 ASR 模型
    },
  },

  // ===== B 站上传配置 =====
  biliUpload: {
    line: "auto", // 上传线路: auto|kodo|bda2|upos|cos
    concurrency: 3, // 并发上传数
    limitRate: 0, // 上传限速 (KB/s, 0=不限制)
    retryTimes: 10, // 重试次数
    retryDelay: 7000, // 重试延迟 (毫秒)
    checkInterval: 600, // 检查间隔 (秒)
    minUploadInterval: 0, // 最小上传间隔 (秒)
    accountAutoCheck: true, // 是否自动检查账号
    useBCutAPI: false, // 是否使用 B 站 API
    useUploadPartPersistence: true, // 是否上传持久化
  },

  // ===== 直播录制配置 =====
  recorder: {
    savePath: "", // 录制文件保存路径
    nameRule: "{platform}/{owner}/{year}-{month}-{date} {hour}-{min}-{sec}-{ms} {title}", // 文件命名规则
    autoRecord: true, // 是否自动录制
    quality: "highest", // 录制清晰度
    line: undefined, // 录制线路
    checkInterval: 60, // 检查间隔 (秒)
    maxThreadCount: 3, // 最大线程数
    waitTime: 500, // 等待时间 (毫秒)
    disableProvideCommentsWhenRecording: false, // 录制时是否禁用弹幕
    segment: "90", // 分段时长 (分钟)
    saveGiftDanma: false, // 是否保存礼物弹幕
    saveSCDanma: true, // 是否保存 SuperChat 弹幕
    saveCover: false, // 是否保存直播封面
    uid: undefined, // 默认用户 UID
    debugMode: false, // 是否启用调试模式
    debugLevel: "none", // 调试级别
    qualityRetry: 0, // 画质降级重试次数
    videoFormat: "auto", // 视频格式: auto|flv|ts|mp4
    recorderType: "bililive", // 录制器类型
    useServerTimestamp: false, // 是否使用服务器时间戳
    recordRetryImmediately: true, // 是否立即重试录制
    bilibili: { // B 站特定配置
      uid: undefined,
      quality: 10000, // 画质等级
      useBatchQuery: false,
      useM3U8Proxy: true, // 是否使用 M3U8 代理
      formatName: "auto",
      codecName: "auto",
      customHost: undefined,
      checkInterval: undefined,
      maxThreadCount: undefined,
      waitTime: undefined,
    },
    douyu: { // 抖音特定配置
      quality: 0,
      source: "auto",
      checkInterval: undefined,
      maxThreadCount: undefined,
      waitTime: undefined,
      codecName: "auto",
      api: "auto",
    },
    huya: { // 虎牙特定配置
      quality: 0,
      formatName: "auto",
      source: "auto",
      api: "auto",
      checkInterval: undefined,
      maxThreadCount: undefined,
      waitTime: undefined,
    },
    douyin: { // 抖音特定配置
      quality: "origin",
      formatName: "auto",
      cookie: "", // 抖音 Cookie
      doubleScreen: true, // 是否双屏录制
      api: "web",
      checkInterval: undefined,
      maxThreadCount: undefined,
      waitTime: undefined,
    },
    xhs: { // 小红书特定配置
      cookie: "", // 小红书 Cookie
      checkInterval: undefined,
      maxThreadCount: undefined,
      waitTime: undefined,
    },
    saveDanma2DB: false, // 是否保存弹幕到数据库
  },

  // ===== 视频订阅配置 =====
  video: {
    subCheckInterval: 60, // 订阅检查间隔 (秒)
    subSavePath: "", // 订阅文件保存路径
  },

  // ===== 其他配置 =====
  recorders: [], // 录制器列表
  virtualRecord: { // 虚拟录制配置
    config: [], // 虚拟录制规则列表
    startTime: Date.now(), // 虚拟录制开始时间戳
  },
};
```

## 获取配置

获取当前应用配置。

**接口地址:** `GET /config/get`

**请求参数:**

| 参数名 | 类型   | 必填 | 说明                  |
| ------ | ------ | ---- | --------------------- |
| key    | string | 是   | 配置路径，支持dot访问 |

**响应示例:**

```json
{
  "logLevel": "debug",
  "autoUpdate": true,
  "port": 18010,
  "host": "127.0.0.1",
  "passKey": "abcdefghijklmnop"
}
```

### 保存配置

保存应用配置

**接口地址:** `POST /config/set`

**请求参数:**

| 参数名 | 类型   | 必填 | 说明         |
| ------ | ------ | ---- | ------------ |
| 请求体 | object | 是   | 完整配置对象 |

**请求示例:**

```json
{
  "key": "logLevel",
  "vlaue": "debug"
}
```

**响应示例:**

```json
{
  "success": true
}
```

### 重置二进制文件路径

重置指定类型的二进制文件为默认路径。

**接口地址:** `POST /config/reset-bin`

**请求参数:**

| 参数名 | 类型                                      | 必填 | 说明           |
| ------ | ----------------------------------------- | ---- | -------------- |
| type   | "ffmpeg" \| "ffprobe" \| "danmakuFactory" | 是   | 二进制文件类型 |

**请求示例:**

```json
{
  "type": "ffmpeg"
}
```

**响应示例:**

```json
{
  "path": "C:/Program Files/ffmpeg/bin/ffmpeg.exe"
}
```

### 导出配置

导出应用配置为 ZIP 压缩包。

**接口地址:** `POST /config/export`

**请求参数:** 无

**响应:** 返回二进制 ZIP 文件

**使用示例:**

```javascript
const blob = await configApi.exportConfig();
const url = URL.createObjectURL(blob);
const link = document.createElement("a");
link.href = url;
link.download = "config-backup.zip";
link.click();
```

### 导入配置

从 ZIP 压缩包导入配置，覆盖现有配置。

**接口地址:** `POST /config/import`

**请求参数:**

| 参数名 | 类型 | 必填 | 说明          |
| ------ | ---- | ---- | ------------- |
| file   | file | 是   | 配置 ZIP 文件 |

**请求示例:**

使用 FormData 上传：

```javascript
const formData = new FormData();
formData.append("file", file);
await configApi.importConfig(file);
```

**响应示例:**

```json
{
  "success": true
}
```

**错误响应示例:**

```json
{
  "error": "配置文件格式不正确"
}
```
