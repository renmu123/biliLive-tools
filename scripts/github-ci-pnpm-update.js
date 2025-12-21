import fs from "fs";
import { exec } from "child_process";

async function getPnpmVersion() {
  return new Promise((resolve, reject) => {
    exec("pnpm --version", { windowsHide: true }, (error, stdout, stderr) => {
      if (error) {
        console.error(`执行错误: ${error}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.error(`标准错误: ${stderr}`);
        reject(stderr);
        return;
      }
      const pnpmVersion = stdout.trim();
      console.log(`当前 pnpm 版本: ${pnpmVersion}`);
      resolve(pnpmVersion);
    });
  });
}

// https://github.com/pnpm/pnpm/issues/5638
async function updatePnpm() {
  if (process.platform !== "win32") return;

  const version = await getPnpmVersion();
  // C:\Users\runneradmin\setup-pnpm\node_modules\.pnpm\pnpm@9.6.0\node_modules\pnpm\bin\pnpm.cjs
  // github的runner环境中，pnpm安装在C:\Users\runneradmin\setup-pnpm\node_modules\.pnpm
  const filePath = `C:\\Users\\runneradmin\\setup-pnpm\\node_modules\\.pnpm\\pnpm@${version}\\node_modules\\pnpm\\bin\\pnpm.cjs`;
  // 修改第一行为 #!node
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error(err);
      throw err;
    }
    const result = data.replace(/^#!.*\n/, "#!node\n");
    fs.writeFile(filePath, result, "utf8", (err) => {
      if (err) {
        console.error(err);
        return;
      }
      console.log("修改 pnpm.cjs 成功", result);
    });
  });
}

updatePnpm();
