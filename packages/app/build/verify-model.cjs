const path = require("node:path");

// 在生成安装包/压缩包之前检查实际打包结果，两套打包配置共用。
module.exports = async (context) => {
  const { verifyModel } = await import("../../../scripts/install-models.js");
  const resources =
    context.electronPlatformName === "darwin"
      ? path.join(
          context.appOutDir,
          `${context.packager.appInfo.productFilename}.app`,
          "Contents",
          "Resources",
        )
      : path.join(context.appOutDir, "resources");
  const model = path.join(resources, "app.asar.unpacked", "resources", "models", "yamnet.onnx");
  try {
    await verifyModel(model);
  } catch (error) {
    throw new Error(
      `打包产物中的 YAMNet 模型缺失或损坏。请先运行 pnpm run install:models。路径：${model}`,
      { cause: error },
    );
  }
};
