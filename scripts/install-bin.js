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
        if (process.platform === "linux") {
          fs.chmodSync(filePath, 0o755);
        }
      }
    }),
  );
  console.log("解压成功");
}

async function downloadFile(url, desc, options = {}) {
  const downloader = download(url, desc, options);
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
  const filename = `${process.platform}-${process.arch}-2.5.0.zip`;
  const downloadUrl = `https://github.com/renmu123/biliLive-tools/releases/download/0.2.1/${filename}`;
  console.log(`下载 ${downloadUrl}`);

  await downloadFile(downloadUrl, ".");
  await unzip(filename, "packages/app/resources");

  // download mesio
  // https://github.com/hua0512/rust-srec/releases/tag/v0.3.2
  const platforms = {
    win32: "windows",
    darwin: "macos",
  };
  const archs = {
    x64: "amd64",
  };
  const platform = platforms[process.platform] ?? process.platform;
  const arch = archs[process.arch] ?? process.arch;
  let mesioUrl = `https://github.com/hua0512/rust-srec/releases/download/v0.3.2/mesio-${platform}-${arch}`;
  if (platform === "windows") {
    mesioUrl += ".exe";
  }
  await downloadFile(mesioUrl, "packages/app/resources/bin", {
    filename: platform === "windows" ? "mesio.exe" : "mesio",
  });
}

downloadBin();
