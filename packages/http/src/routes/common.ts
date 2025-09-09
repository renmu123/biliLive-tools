import { exec } from "node:child_process";
import path from "node:path";
import fs from "fs-extra";
import multer from "../middleware/multer.js";

import Router from "koa-router";
import {
  formatTitle,
  getTempPath,
  uuid,
  formatPartTitle,
} from "@biliLive-tools/shared/utils/index.js";
import { readXmlTimestamp, parseMeta } from "@biliLive-tools/shared/task/video.js";
import { genTimeData } from "@biliLive-tools/shared/danmu/hotProgress.js";
import { parseDanmu } from "@biliLive-tools/shared/danmu/index.js";
import { StatisticsService } from "@biliLive-tools/shared/db/service/index.js";

import { config, handler, appConfig, fileCache } from "../index.js";
import { container } from "../index.js";
import { createRecorderManager } from "@biliLive-tools/shared";

const router = new Router({
  prefix: "/common",
});
const upload = multer({ dest: getTempPath() });

router.post("/formatTitle", async (ctx) => {
  const data = ctx.request.body as {
    template: string;
  };
  const template = (data.template || "") as string;

  const title = formatTitle(
    {
      title: "标题",
      username: "主播名",
      time: new Date().toISOString(),
      roomId: 123456,
      filename: "文件名",
    },
    template,
  );
  ctx.body = title;
});

router.post("/formatPartTitle", async (ctx) => {
  const data = ctx.request.body as {
    template: string;
  };
  const template = (data.template || "") as string;

  const title = formatPartTitle(
    {
      title: "标题",
      username: "主播名",
      time: new Date().toISOString(),
      roomId: 123456,
      filename: "文件名",
      index: 1,
    },
    template,
  );
  ctx.body = title;
});

router.get("/version", (ctx) => {
  ctx.body = config.version;
});

function getDriveLetters(): Promise<string[]> {
  return new Promise((resolve, reject) => {
    exec("wmic logicaldisk get name", (error, stdout, stderr) => {
      if (error) {
        reject(`Error: ${stderr}`);
        return;
      }

      // 解析输出，提取盘符
      const drives = stdout
        .split("\r\r\n")
        .filter((line) => line.trim() && line.includes(":"))
        .map((line) => line.trim());

      resolve(drives);
    });
  });
}

function isDriveLetter(letter: string): boolean {
  return /^[a-zA-Z]:\\$/.test(letter);
}

router.get("/files", async (ctx) => {
  const params = ctx.request.query;
  let root = params.path as string;
  const filterExts = ((params.exts as string) || "")
    .split("|")
    .filter((ext) => ext)
    .map((ext) => `.${ext}`);
  const type = params.type as string;
  const allFiles = filterExts.length === 0 || filterExts.includes(".*");

  if (root == "/" && process.platform === "win32") {
    const drives = await getDriveLetters();
    root = drives[0];
    ctx.body = {
      list: drives.map((drive) => ({ type: "directory", name: drive, path: `${drive}\\` })),
      parent: "",
    };
    return;
  }

  try {
    const paths = await fs.readdir(root);
    let parentDir = path.dirname(root);
    if (process.platform === "win32" && isDriveLetter(root)) {
      parentDir = "/";
    }

    const data: {
      type: "directory" | "file";
      name: string;
      path: string;
    }[] = [];
    for (const name of paths) {
      const filePath = path.join(root, name);
      try {
        const fileStat = await fs.stat(filePath);
        const type = fileStat.isDirectory() ? "directory" : "file";

        if (type === "file" && !allFiles && !filterExts.includes(path.extname(name))) {
          continue;
        }
        data.push({
          type: type,
          name: name,
          path: filePath,
        });
      } catch (error) {
        continue;
      }
    }
    let files = data;
    if (type === "directory") {
      files = data.filter((item) => item.type === "directory");
    }

    ctx.body = { list: files, parent: parentDir };
  } catch (e) {
    console.error(e);
    ctx.status = 400;
    ctx.body = "Unable to scan directory";
    return;
  }
});

router.post("/fileJoin", async (ctx) => {
  const { dir, name } = ctx.request.body as {
    dir: string;
    name: string;
  };
  if (!fs.existsSync(dir)) {
    ctx.status = 400;
    ctx.body = "文件夹不存在";
    return;
  }
  const filePath = path.join(dir, name);
  ctx.body = filePath;
});

router.post("/danma/timestamp", async (ctx) => {
  const { filepath } = ctx.request.body as {
    filepath: string;
  };

  ctx.body = await readXmlTimestamp(filepath);
});

router.post("/parseMeta", async (ctx) => {
  const files = ctx.request.body as {
    videoFilePath?: string;
    danmaFilePath?: string;
  };

  ctx.body = await parseMeta(files);
});

/**
 * @api {get} /common/fonts 获取系统字体列表
 */
router.get("/fonts", async (ctx) => {
  const { getFontsList } = await import("@biliLive-tools/shared/utils/fonts.js");
  ctx.body = await getFontsList();
});

router.post("/cover/upload", upload.single("file"), async (ctx) => {
  const file = ctx.request?.file?.path as string;
  if (!file) {
    ctx.status = 400;
    ctx.body = "No file selected";
    return;
  }
  const originalname = ctx.request?.file?.originalname as string;
  const ext = path.extname(originalname);

  const coverPath = path.join(config.userDataPath, "cover");
  const outputName = `${uuid()}${ext}`;
  // 将图片复制到指定目录
  await fs.ensureDir(coverPath);
  await fs.copyFile(file, path.join(coverPath, outputName));
  await fs.remove(file).catch(() => {});
  ctx.body = {
    name: outputName,
    path: `/assets/cover/${outputName}`,
  };
});

router.get("/appStartTime", async (ctx) => {
  const data = StatisticsService.query("start_time");
  ctx.body = data?.value;
});

router.get("/exportLogs", async (ctx) => {
  const logFilePath = config.logPath;
  ctx.body = fs.createReadStream(logFilePath);
});

router.get("/getLogContent", async (ctx) => {
  const logFilePath = config.logPath;
  const content = await fs.readFile(logFilePath, "utf-8");
  ctx.body = content;
});

router.post("/readAss", async (ctx) => {
  const { filepath } = ctx.request.body as {
    filepath: string;
  };
  if (!filepath.endsWith(".ass")) {
    ctx.status = 400;
    ctx.body = "文件不是ass格式";
    return;
  }
  if (!(await fs.pathExists(filepath))) {
    ctx.status = 400;
    ctx.body = "文件不存在";
    return;
  }
  const content = await fs.readFile(filepath, "utf-8");
  ctx.body = content;
});

router.post("/genTimeData", async (ctx) => {
  const { filepath } = ctx.request.body as {
    filepath: string;
  };
  const data = await genTimeData(filepath);
  ctx.body = data;
});

// 申请视频ID接口
router.post("/apply-video-id", async (ctx) => {
  const { videoPath } = ctx.request.body as { videoPath: string };

  if (!(await fs.pathExists(videoPath))) {
    ctx.status = 404;
    ctx.body = { error: "视频文件不存在" };
    return;
  }

  // 获取文件扩展名并检查是否为视频格式
  const extname = path.extname(videoPath).toLowerCase();
  const allowedExtensions = [".mp4", ".flv", ".m4s", ".ts", ".mkv", ".webm", ".avi", ".mov"];

  if (!allowedExtensions.includes(extname)) {
    ctx.status = 403;
    ctx.body = { error: "只能访问视频文件" };
    return;
  }

  // 检查文件的MIME类型
  try {
    const stat = await fs.stat(videoPath);

    // 检查是否是文件而非目录
    if (!stat.isFile()) {
      ctx.status = 403;
      ctx.body = { error: "请求的路径不是文件" };
      return;
    }

    // 检查文件大小，确保是有效文件
    if (stat.size === 0) {
      ctx.status = 403;
      ctx.body = { error: "文件大小为0，无效视频" };
      return;
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: "文件检查失败" };
    return;
  }

  // 生成唯一ID
  const videoId = uuid();

  // 24小时过期
  const expireAt = Date.now() + 24 * 60 * 60 * 1000;

  // 存储ID和视频路径的映射关系
  fileCache.set(videoId, { path: videoPath, expireAt });

  let type = "";
  switch (extname) {
    case ".flv":
      type = "flv";
      break;
    case ".ts":
      type = "ts";
      break;
  }

  ctx.body = {
    videoId,
    expireAt,
    type,
  };
});

router.get("/video/:videoId", async (ctx) => {
  const videoId = ctx.params.videoId;

  // 从映射表中获取视频路径
  const videoInfo = fileCache.get(videoId);

  if (!videoInfo) {
    ctx.status = 404;
    ctx.body = "视频ID无效或已过期";
    return;
  }

  const videoPath = videoInfo.path;

  if (!(await fs.pathExists(videoPath))) {
    ctx.status = 404;
    ctx.body = "视频文件不存在";
    return;
  }

  // 获取文件扩展名并确定正确的Content-Type
  const extname = path.extname(videoPath).toLowerCase();
  let contentType = "video/mp4"; // 默认类型

  // 设置不同格式的Content-Type
  switch (extname) {
    case ".mp4":
      contentType = "video/mp4";
      break;
    case ".flv":
      contentType = "video/x-flv";
      break;
    case ".m4s":
      contentType = "video/iso.segment";
      break;
    case ".ts":
      contentType = "video/mp2t";
      break;
    case ".mkv":
      contentType = "video/x-matroska";
      break;
    case ".webm":
      contentType = "video/webm";
      break;
    default:
      contentType = "application/octet-stream"; // 未知类型默认为二进制流
      break;
  }

  const stat = await fs.stat(videoPath);
  const fileSize = stat.size;
  const range = ctx.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(videoPath, { start, end });
    const head = {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Content-Type": contentType,
    };
    ctx.res.writeHead(206, head);
    ctx.body = file;
  } else {
    const head = {
      "Content-Length": fileSize,
      "Content-Type": contentType,
    };
    ctx.res.writeHead(200, head);
    ctx.body = fs.createReadStream(videoPath);
  }
});

router.post("/parseDanmu", async (ctx) => {
  const { filepath } = ctx.request.body as {
    filepath: string;
  };
  const data = await parseDanmu(filepath);
  ctx.body = data;
});

router.post("/testWebhook", async (ctx) => {
  const list: { id: string; file: string }[] = [];
  // 检查所有live数据，如果存在同一个live中，前一个part还在录制中，但是后面的part已经是其他状态，则返回相关id以及文件
  const liveList = handler.liveData;
  for (const live of liveList) {
    const partList = live.parts;
    console.log(partList);
    if (partList.length < 2) continue;
    for (let i = 0; i < partList.length - 1; i++) {
      const part1 = partList[i];
      const part2 = partList[i + 1];
      if (part1.recordStatus === "recording" && part2) {
        list.push({
          id: part1.partId,
          file: part1.filePath,
        });
      }
    }
  }
  ctx.body = list;
});

router.post("/handleWebhook", async (ctx) => {
  const { data } = ctx.request.body as {
    data: { id: string }[];
  };
  const liveList = handler.liveData;
  for (const live of liveList) {
    const partList = live.parts;
    for (const part of partList) {
      const item = data.find((item) => item.id === part.partId);
      if (item) {
        part.recordStatus = "handled";
        part.uploadStatus = "error";
        part.rawUploadStatus = "error";
      }
    }
  }
  ctx.body = "success";
});

/**
 * 检测为何无法上传
 * 检查是否为内部录制，如果是，检查是否开启webhook，接下来走下面的流程
 * 如果不是，检查全局webhook配置，判断是否开启全局开关，判断是否在黑名单，判断配置是否配置了上传预设，上传账号
 * 返回{hasError:boolean,errorInfo:string}
 */
router.get("/whyUploadFailed", async (ctx) => {
  const { roomId } = ctx.request.query as { roomId: string };

  if (!roomId) {
    ctx.status = 400;
    ctx.body = { hasError: true, errorInfo: "缺少roomId参数" };
    return;
  }

  const roomIdNum = Number(roomId);
  const errorInfoList: string[] = [];
  let hasError = false;

  try {
    // 检查是否为内部录制
    type RecorderManagerType = Awaited<ReturnType<typeof createRecorderManager>>;
    const recorderManager = container.resolve<RecorderManagerType>("recorderManager");
    const internalRecorder = recorderManager.manager.recorders.find(
      (recorder) => recorder.channelId == roomId,
    );

    if (internalRecorder) {
      // 是内部录制，检查录制器配置
      const recorderConfig = recorderManager.config.get(internalRecorder.id);
      if (!recorderConfig?.sendToWebhook) {
        errorInfoList.push(`内部录制设置未开启webhook`);
        hasError = true;
      }
    }

    // 检查全局webhook配置
    const webhook = appConfig.get("webhook");
    if (!webhook.open) {
      errorInfoList.push("全局webhook未开启");
      hasError = true;
    }

    // 检查单独webhook配置
    const webhookConfig = handler.getConfig(roomIdNum);

    if (!webhookConfig.open) {
      errorInfoList.push("处于黑名单或单独关闭开关");

      // // 检查具体原因
      // const appConfigData = handler.appConfig.getAll();
      // const roomSetting = appConfigData.webhook?.rooms?.[roomIdNum];

      // if (roomSetting && !roomSetting.open) {
      //   errorInfoList.push("房间配置中webhook已关闭");
      // } else {
      //   // 检查黑名单
      //   const blacklist = (appConfigData?.webhook?.blacklist || "").split(",");
      //   if (blacklist.includes("*")) {
      //     errorInfoList.push("全局黑名单设置为 * (禁用所有房间)");
      //   } else if (blacklist.includes(roomId)) {
      //     errorInfoList.push("房间在webhook黑名单中");
      //   } else {
      //     errorInfoList.push("webhook未开启");
      //   }
      // }
      hasError = true;
    }

    // 检查上传账号
    if (!webhookConfig.uid) {
      errorInfoList.push("未配置上传账号(uid)");
      hasError = true;
    }

    // 检查上传预设
    if (webhookConfig.uploadPresetId) {
      try {
        const preset = await handler.videoPreset.get(webhookConfig.uploadPresetId);
        if (!preset) {
          errorInfoList.push(`上传预设 '${webhookConfig.uploadPresetId}' 不存在`);
          hasError = true;
        }
      } catch (error) {
        errorInfoList.push(`获取上传预设失败: ${error}`);
        hasError = true;
      }
    } else {
      errorInfoList.push("未配置上传预设");
      hasError = true;
    }

    // // 检查弹幕预设（如果启用了弹幕）
    // if (webhookConfig.danmu && webhookConfig.danmuPresetId) {
    //   try {
    //     const danmuPreset = await handler.danmuPreset.get(webhookConfig.danmuPresetId);
    //     if (!danmuPreset) {
    //       errorInfoList.push(`弹幕预设 '${webhookConfig.danmuPresetId}' 不存在`);
    //       hasError = true;
    //     }
    //   } catch (error) {
    //     errorInfoList.push(`获取弹幕预设失败: ${error}`);
    //     hasError = true;
    //   }
    // }

    // // 检查视频处理预设（如果配置了）
    // if (webhookConfig.videoPresetId) {
    //   try {
    //     const videoPreset = await handler.ffmpegPreset.get(webhookConfig.videoPresetId);
    //     if (!videoPreset) {
    //       errorInfoList.push(`视频处理预设 '${webhookConfig.videoPresetId}' 不存在`);
    //       hasError = true;
    //     }
    //   } catch (error) {
    //     errorInfoList.push(`获取视频处理预设失败: ${error}`);
    //     hasError = true;
    //   }
    // }

    // // 检查文件大小限制
    // if (webhookConfig.minSize && webhookConfig.minSize > 0) {
    //   // 这个只是提示信息，不算错误
    //   if (webhookConfig.minSize > 100) {
    //     errorInfoList.push(
    //       `最小文件大小设置较大 (${webhookConfig.minSize}MB)，可能导致小文件被跳过`,
    //     );
    //   }
    // }

    // // 检查直播数据
    // const live = handler.liveData.find((item) => item.roomId === roomIdNum);
    // let liveStatus = "无直播数据";
    // if (live) {
    //   const pendingParts = live.parts.filter((part) => part.uploadStatus === "pending");
    //   const errorParts = live.parts.filter((part) => part.uploadStatus === "error");
    //   const uploadingParts = live.parts.filter((part) => part.uploadStatus === "uploading");
    //   const uploadedParts = live.parts.filter((part) => part.uploadStatus === "uploaded");

    //   liveStatus = `直播数据: ${live.parts.length}个分段, 待上传:${pendingParts.length}, 上传中:${uploadingParts.length}, 已上传:${uploadedParts.length}, 错误:${errorParts.length}`;

    //   if (errorParts.length > 0) {
    //     errorInfoList.push(`有${errorParts.length}个分段上传失败`);
    //   }
    // }

    const result = {
      hasError,
      errorInfo: hasError ? errorInfoList.join("; ") : "配置正常",
      // details: {
      // isInternalRecording: internalRecorders.length > 0,
      // internalRecorders: internalRecorders.map((r) => ({
      //   id: r.id,
      //   remarks: r.remarks,
      //   sendToWebhook: recorderManager.config.getRaw(r.id)?.sendToWebhook,
      // })),
      // webhookOpen: webhookConfig.open,
      // hasUID: !!webhookConfig.uid,
      // uploadPresetId: webhookConfig.uploadPresetId,
      // danmuEnabled: webhookConfig.danmu,
      // danmuPresetId: webhookConfig.danmuPresetId,
      // videoPresetId: webhookConfig.videoPresetId,
      // minSize: webhookConfig.minSize,
      // },
    };

    ctx.body = result;
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      hasError: true,
      errorInfo: `检查过程中发生错误: ${error}`,
      details: {},
    };
  }
});

export default router;
