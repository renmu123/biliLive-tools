# YAMNet 演唱检测

由用户提供的 `yamnet-cpu-demo` 项目移植（原项目 commit `94b73bb`）。
`segments.ts`、`context-segments.ts`、`bridge-segments.ts`、`extend-segments.ts`
保留原算法，添加 TypeScript 类型；原有 25 项测试随代码迁入。

默认使用 CPU 和最多 6 个推理线程。Node 内运行 ONNX Runtime 1.21.0，
FFmpeg 解码为 16 kHz 单声道 float32 PCM；每批 64 帧，步长 7680 样本，
单帧实际输入支持 15600 样本。丢弃导出模型额外生成的批次尾帧，文件尾补零。
音频按批读取，临时 PCM、张量和推理会话在成功或失败后均释放。

## 模型

使用 [mydubber-org/yamnet-onnx](https://huggingface.co/mydubber-org/yamnet-onnx/tree/fc1697c)
的固定 `fc1697c` 版本，模型大小 16,093,406 字节。
这是 Google YAMNet v1 的第三方 ONNX 转换，模型版权归 Google LLC，采用 Apache-2.0；
完整许可见 `MODEL-LICENSE`。AudioSet 标签名称采用 CC BY 4.0，
来源：[Google AudioSet ontology](https://research.google.com/audioset/ontology/index.html)。

客户端模型放在 `packages/app/resources/models/yamnet.onnx`，随桌面应用一起打包。
开发环境从应用的 `resources/models` 读取；安装包从 `app.asar.unpacked/resources/models` 读取。
Docker 在 `models` 构建阶段下载固定版本并校验哈希，后端和全栈镜像均复制到
`/app/models/yamnet.onnx`，纯前端镜像不包含模型。
CLI 使用配置项 `yamnetModelPath`（默认 `models/yamnet.onnx`，相对工作目录），
也可以设置 `BILILIVE_YAMNET_MODEL` 覆盖本地路径。
载入前校验 SHA-256：

```text
844ee869ca5426d12c6aa1876280c40099487bda74827da1ccbeeaffbe7143dd
```

运行时只读取并校验本地模型，不下载模型，缺失或损坏时直接报错。
模型文件不纳入 Git 或 Docker 构建上下文；客户端打包前须将模型放入上述资源目录。
Electron 对资源目录和原生运行库解包，CLI 将运行库与 common 依赖一起复制。

## 默认检测规则

- 长窗口 21 帧、判断步长 0.96 秒，演唱分数 ≥0.015 且讲话分数 ≤0.15 连续至少 4.8 秒。
- 短窗口 5 帧、维持阈值 0.01，证据间隔最多 12 秒，片段至少 20 秒。
- 两个合格唱段相隔不超过 30 秒，至少 90% 间隔满足 Music≥0.6、Speech≤0.2，连续中断不超过 3 秒才合并。
- 向两端最多各补齐 30 秒，音乐和讲话阈值同上，支持比例至少 90%，连续中断最多 1.44 秒。
  文件边界和相邻片段间隔的中点限制扩边，片段不会重叠。

共享默认参数位于 `packages/types/src/musicDetection.ts`，前端和后端共同使用。
分数缓存 `yamnet_v1_<文件哈希>.json` 校验结构和模型哈希，调整阈值可直接复用。
它与旧版能量特征缓存隔离；“不保留缓存”会绕过并清理当前视频的分数缓存，保留模型。
接口返回原有 `{ startTime, endTime }[]`，单位秒。

这些参数来自少量录播调优。播放原唱也可能被识别为演唱；连续音乐不能证明是同一首歌。
