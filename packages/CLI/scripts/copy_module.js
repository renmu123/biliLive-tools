import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// TODO:显然其他类型打包还有问题
const cli_node_modules = path.resolve(__dirname, "../lib/node_modules");
const pnpm_node_modules = path.resolve(__dirname, "../../../node_modules");
const cli_lib = path.resolve(__dirname, "../lib");

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
  // 复制font-list相关文件，
  fs.cpSync(path.join(pnpm_node_modules, "font-ls"), path.join(cli_node_modules, "font-ls"), {
    recursive: true,
  });
  // 复制better-sqlite3相关文件，
  fs.cpSync(
    path.join(pnpm_node_modules, "better-sqlite3"),
    path.join(cli_node_modules, "better-sqlite3"),
    {
      recursive: true,
    },
  );
  fs.cpSync(
    path.join(pnpm_node_modules, "file-uri-to-path"),
    path.join(cli_node_modules, "file-uri-to-path"),
    {
      recursive: true,
    },
  );
  fs.cpSync(path.join(pnpm_node_modules, "bindings"), path.join(cli_node_modules, "bindings"), {
    recursive: true,
  });

  // 复制 appConfig.json 到 CLI 的 lib 目录中，供打包/上传使用
  try {
    const appConfigSrc = path.resolve(__dirname, "../../../appConfig.json");
    const appConfigDest = path.join(cli_lib, "appConfig.json");
    // 确保 lib 目录存在（即使尚未被构建步骤创建）
    fs.mkdirSync(cli_lib, { recursive: true });
    if (fs.existsSync(appConfigSrc)) {
      fs.copyFileSync(appConfigSrc, appConfigDest);
      console.log(`[copy_module] copied appConfig.json -> ${appConfigDest}`);
    } else {
      console.warn(`[copy_module] appConfig.json not found at ${appConfigSrc}`);
    }
  } catch (e) {
    console.warn("[copy_module] failed to copy appConfig.json:", e);
  }

}

main();
