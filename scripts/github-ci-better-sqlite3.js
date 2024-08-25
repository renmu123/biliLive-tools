import fs from "fs";
import path from "path";
import tar from "tar";
import download from "download";
import { SingleBar } from "cli-progress";

// 由于未知的原因，better-sqlite3的二进制包在github的release中下载的是错误的版本，所以需要手动下载

async function downloadFile(url, desc) {
  const downloader = download(url, desc);
  const progressBar = new SingleBar({
    format: "下载进度 |{bar}| {percentage}% | ETA: {eta}s",
    barCompleteChar: "\u2588",
    barIncompleteChar: "\u2591",
    hideCursor: true,
  });
  progressBar.start(100, 0);

  downloader.on("downloadProgress", (progress) => {
    progressBar.update(progress.percent * 100);
  });
  downloader.on("error", (err) => {
    console.error(err);
  });
  downloader.on("end", () => {
    console.log("\n下载成功");
  });
  await downloader;
  progressBar.stop();
}

async function downloadBin() {
  const betterSqlie3Version = "v11.2.1";
  // better-sqlite3-v11.1.2-electron-v125-win32-x64.tar.gz
  const filename = `better-sqlite3-${betterSqlie3Version}-electron-v125-${process.platform}-${process.arch}.tar.gz`;
  const downloadUrl = `https://github.com/WiseLibs/better-sqlite3/releases/download/${betterSqlie3Version}/${filename}`;
  console.log("下载地址:", downloadUrl);

  await downloadFile(downloadUrl, ".");

  const extractToPath = path.resolve("./node_modules/better-sqlite3");

  tar
    .x({
      file: filename,
      C: extractToPath,
    })
    .then(() => {
      console.log("解压完成");
      fs.unlink(filename, (err) => {
        if (err) {
          console.error("删除压缩包失败:", err);
        } else {
          console.log("删除压缩包成功");
        }
      });
    })
    .catch((err) => {
      console.error("解压失败:", err);
      fs.unlink(filename, (err) => {
        if (err) {
          console.error("删除压缩包失败:", err);
        } else {
          console.log("删除压缩包成功");
        }
      });
    });
  // 解压.tar.gz到 node_modules/better-sqlite3
}

downloadBin();
