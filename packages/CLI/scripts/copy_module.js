import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// TODO:显然其他类型打包还有问题
const cli_node_modules = path.resolve(__dirname, "../lib/node_modules");
const pnpm_node_modules = path.resolve(__dirname, "../../../node_modules");
const cli_own_node_modules = path.resolve(__dirname, "../node_modules");

const require = createRequire(import.meta.url);

/**
 * 在 pnpm 严格模式下，包可能不在根 node_modules 下，
 * 需要从多个候选路径中查找实际存在的路径
 */
function resolvePackagePath(packageName) {
  // 优先使用 require.resolve 定位包的实际入口，再推导包的根目录
  try {
    const resolved = require.resolve(packageName, { paths: [__dirname + "/.."] });
    // 从解析到的文件路径向上查找包的根目录（包含 package.json 的目录）
    let dir = path.dirname(resolved);
    while (dir !== path.dirname(dir)) {
      if (fs.existsSync(path.join(dir, "package.json"))) {
        return dir;
      }
      dir = path.dirname(dir);
    }
  } catch {
    // require.resolve 失败，回退到候选路径
  }

  // 回退：依次检查候选路径
  const candidates = [pnpm_node_modules, cli_own_node_modules];
  for (const base of candidates) {
    const candidate = path.join(base, packageName);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

function safeCpSync(packageName) {
  const src = resolvePackagePath(packageName);
  if (!src) {
    console.warn(`跳过复制 ${packageName}：未找到该包`);
    return;
  }
  const dest = path.join(cli_node_modules, packageName);
  fs.cpSync(src, dest, { recursive: true });
}

function main() {
  // 找到@napi-rs相关包，复制到cli_node_modules,这个路径可能不存在，不存在则创建
  if (!fs.existsSync(cli_node_modules)) {
    fs.mkdirSync(cli_node_modules);
  }
  // 复制canvas相关文件
  safeCpSync("@napi-rs/canvas");
  // 复制ntsuspend相关文件，
  safeCpSync("ntsuspend");
  // 复制font-list相关文件，
  safeCpSync("font-ls");
  // 复制better-sqlite3相关文件，
  safeCpSync("better-sqlite3");
  // 复制music-segment-detector相关文件，
  safeCpSync("music-segment-detector");
  // 复制meyda相关文件，
  safeCpSync("meyda");
  // 复制shazamio-core相关文件，
  safeCpSync("shazamio-core");
  safeCpSync("file-uri-to-path");
  safeCpSync("bindings");
}

main();
