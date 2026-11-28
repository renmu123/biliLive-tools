import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const builderRequire = createRequire(require.resolve("electron-builder"));
const libRequire = createRequire(builderRequire.resolve("app-builder-lib"));
const { load } = libRequire("js-yaml");
const { doMergeConfigs } = libRequire("./util/config/config.js");
const { getMainFileMatchers, getNodeModuleFileMatcher } = libRequire("./fileMatcher.js");
const { AppFileWalker } = libRequire("./util/AppFileWalker.js");
const { expandMacro } = libRequire("./util/macroExpander.js");
const appDir = fileURLToPath(new URL("../", import.meta.url)).replace(/[\\/]$/, "");

const cases = ["electron-builder.yml", "electron-builder-no-ffmpeg.yml"].flatMap((file) =>
  Object.entries({ win: "win32", mac: "darwin", linux: "linux" }).flatMap(([target, platform]) =>
    ["x64", "arm64"].map((arch) => ({ file, target, platform, arch })),
  ),
);

it.each(cases)("packages only runtime files for $file $platform/$arch", (testCase) => {
  const { file, target, platform, arch } = testCase;
  // 必须经过真实配置归一化；直接测试 YAML 会漏掉全局和平台 files 生成多个匹配器的问题。
  const config = doMergeConfigs([load(readFileSync(path.join(appDir, file), "utf8"))]);
  const info = {
    config,
    projectDir: appDir,
    buildResourcesDir: "build",
    debugLogger: { isEnabled: false },
  };
  const expand = (pattern) => expandMacro(pattern, arch, {}, { os: target });
  const destination = path.join(appDir, "dist", "app");
  const matchers = getMainFileMatchers(
    appDir,
    destination,
    expand,
    config[target],
    { info },
    path.join(appDir, "dist"),
    false,
  );
  expect(matchers).toHaveLength(1);
  const filters = matchers.map((matcher) => new AppFileWalker(matcher, info).filter);
  const includes = (name) =>
    filters.some((filter) => filter(path.join(appDir, name), { isDirectory: () => false }));
  for (const name of [
    "package.json",
    "LICENSE",
    "out/main/index.js",
    "out/preload/index.js",
    "out/renderer/index.html",
    "resources/models/yamnet.onnx",
    "resources/bin/mesio.exe",
  ]) {
    expect(includes(name), name).toBe(true);
  }
  for (const name of [
    "dist/win-unpacked/electron.exe",
    "dist/previous-release.zip",
    "dist-packaging-check/win-unpacked/electron.exe",
    "build/icon.icns",
    "src/renderer/src/App.vue",
    "test/packaging.test.js",
    "resources/bin/debug.pdb",
  ]) {
    expect(includes(name), name).toBe(false);
  }
  for (const name of ["ffmpeg.exe", "ffprobe.exe"]) {
    expect(includes(`resources/bin/${name}`)).toBe(!file.includes("no-ffmpeg"));
  }

  const filter = getNodeModuleFileMatcher(
    appDir,
    destination,
    expand,
    config[target],
    info,
  ).createFilter();
  for (const nativePlatform of ["win32", "darwin", "linux"]) {
    for (const nativeArch of ["x64", "arm64"]) {
      for (const suffix of ["", "/onnxruntime_binding.node", "/runtime.dll"]) {
        const name = `node_modules/onnxruntime-node/bin/napi-v3/${nativePlatform}/${nativeArch}${suffix}`;
        const stat = { isDirectory: () => suffix === "", moduleFullFilePath: name };
        expect(filter(path.join(appDir, name), stat), name).toBe(
          nativePlatform === platform && nativeArch === arch,
        );
      }
    }
  }
  const binding = "node_modules/onnxruntime-node/dist/binding.js";
  expect(
    filter(path.join(appDir, binding), { isDirectory: () => false, moduleFullFilePath: binding }),
  ).toBe(true);
});
