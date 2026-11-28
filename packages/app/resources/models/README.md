# 桌面端模型资源

将 `yamnet.onnx` 放在本目录，桌面应用打包时会随 `resources/**` 一起解包到
`app.asar.unpacked/resources/models`。开发环境直接读取本目录。

- 来源：https://huggingface.co/mydubber-org/yamnet-onnx/resolve/fc1697c/yamnet.onnx
- 大小：16,093,406 字节
- SHA-256：`844ee869ca5426d12c6aa1876280c40099487bda74827da1ccbeeaffbe7143dd`
- 模型许可：Apache-2.0，见本目录 `LICENSE`。

模型二进制已加入 Git 和 Docker 构建上下文的忽略规则。Docker 在构建阶段单独下载；
桌面应用与 Docker 容器运行时均不下载模型。
