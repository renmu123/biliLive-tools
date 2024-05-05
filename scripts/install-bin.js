// import { fileURLToPath } from "node:url";
import fs from "fs-extra";
import path from "node:path";
import download from "download";
import { SingleBar } from "cli-progress";
import JSZip from "jszip";

async function unzip(zipFile, destination) {
  const zip = new JSZip();
  const data = await zip.loadAsync(fs.readFileSync(zipFile));
  await Promise.all(
    Object.keys(data.files).map(async (filename) => {
      const file = data.files[filename];
      if (!file.dir) {
        const content = await file.async("nodebuffer");
        const filePath = path.join(destination, filename);
        fs.ensureDirSync(path.dirname(filePath));
        fs.writeFileSync(filePath, content);
        fs.chmodSync(filePath, 0o755);
      }
    }),
  );
  console.log("解压成功");
}

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
  const filename = `${process.platform}-${process.arch}.zip`;
  const downloadUrl = `https://github.com/renmu123/biliLive-tools/releases/download/0.2.1/${filename}`;
  // const downloadUrl = `https://dldir1.qq.com/qqfile/qq/QQNT/Windows/QQ_9.9.9_240428_x64_01.exe`;

  // const __dirname = path.dirname(fileURLToPath(import.meta.url));

  // console.log(__dirname);

  await downloadFile(downloadUrl, ".");
  await unzip(filename, "packages/app/resources");

  // .then((buffer) => {
  //   fs.writeFileSync("../bin.zip", buffer);
  //   console.log("下载成功");
  // })
  // .catch((err) => {
  //   console.error(err);
  // });
}

downloadBin();
