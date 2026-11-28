# 桌面端模型资源

将 `yamnet.onnx` 放在本目录，桌面应用打包时会随 `resources/**` 一起解包到
`app.asar.unpacked/resources/models`。开发环境直接读取本目录。

- 来源：https://huggingface.co/mydubber-org/yamnet-onnx/resolve/fc1697c/yamnet.onnx
- 大小：16,093,406 字节
- SHA-256：`844ee869ca5426d12c6aa1876280c40099487bda74827da1ccbeeaffbe7143dd`
- 模型许可：Apache-2.0，见本目录 `LICENSE`。

模型二进制已加入 Git 和 Docker 构建上下文的忽略规则。Docker 在构建阶段单独下载；
桌面应用与 Docker 容器运行时均不下载模型。

GitHub 桌面发布工作流会在打包前运行 `pnpm run install:models` 下载并校验模型。
本地首次打包也可运行此命令准备资源，已有正确的模型时直接复用。
两套 Electron 打包配置均会在生成安装包前校验实际产物中的模型；缺失或损坏会使构建失败。
