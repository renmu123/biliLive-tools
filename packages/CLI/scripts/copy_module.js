import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// TODO:显然其他类型打包还有问题
const cli_node_modules = path.resolve(__dirname, "../lib/node_modules");
const pnpm_node_modules = path.resolve(__dirname, "../../../node_modules");

// console.log("__dirname", __dirname, pnpm_node_modules);

function main() {
  // 找到@napi-rs相关包，复制到cli_node_modules,这个路径可能不存在，不存在则创建
  if (!fs.existsSync(cli_node_modules)) {
    fs.mkdirSync(cli_node_modules);
  }
  // 复制canvas相关文件
  fs.cpSync(path.join(pnpm_node_modules, "@napi-rs"), path.join(cli_node_modules, "@napi-rs"), {
    recursive: true,
  });
  // 复制ntsuspend相关文件，
  fs.cpSync(path.join(pnpm_node_modules, "ntsuspend"), path.join(cli_node_modules, "ntsuspend"), {
    recursive: true,
  });
}

main();
