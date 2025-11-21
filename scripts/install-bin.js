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

async function downloadMesio() {
  // https://github.com/hua0512/rust-srec/releases/tag/v0.3.3
  const platforms = {
    win32: "windows",
    darwin: "macos",
  };
  const archs = {
    x64: "amd64",
  };
  const platform = platforms[process.platform] ?? process.platform;
  const arch = archs[process.arch] ?? process.arch;
  let mesioUrl = `https://github.com/hua0512/rust-srec/releases/download/v0.3.3/mesio-${platform}-${arch}`;
  if (platform === "windows") {
    mesioUrl += ".exe";
  }
  await downloadFile(mesioUrl, "packages/app/resources/bin", {
    filename: platform === "windows" ? "mesio.exe" : "mesio",
  });
  // 添加执行权限
  if (process.platform === "linux") {
    fs.chmodSync("packages/app/resources/bin/mesio", 0o755);
  }
}

async function downloadBililiveRecorder() {
  // https://github.com/renmu123/BililiveRecorder/releases
  const platforms = {
    win32: "win",
    darwin: "osx",
  };
  const platform = platforms[process.platform] ?? process.platform;
  const arch = process.arch;
  const filename = `BililiveRecorder-CLI-${platform}-${arch}.zip`;
  let url = `https://github.com/renmu123/BililiveRecorder/releases/download/v3.2.1/${filename}`;

  await downloadFile(url, ".");
  await unzip(filename, "packages/app/resources/bin");

  // 添加执行权限
  if (process.platform === "linux") {
    fs.chmodSync("packages/app/resources/bin/BililiveRecorder.Cli", 0o755);
  }
}

async function downloadBaseBinary() {
  const filename = `${process.platform}-${process.arch}-2.5.0.zip`;
  const downloadUrl = `https://github.com/renmu123/biliLive-tools/releases/download/0.2.1/${filename}`;
  console.log(`下载 ${downloadUrl}`);

  await downloadFile(downloadUrl, ".");
  await unzip(filename, "packages/app/resources");
}

async function downloadBin() {
  await downloadBaseBinary();
  await downloadMesio();
  await downloadBililiveRecorder();
}

downloadBin();
