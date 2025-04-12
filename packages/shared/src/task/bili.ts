import path from "node:path";
import fs from "fs-extra";
import axios from "axios";

import { Client, TvQrcodeLogin, WebVideoUploader, utils } from "@renmu/bili-api";
import { appConfig } from "../config.js";
import { container } from "../index.js";

import {
  BiliAddVideoTask,
  taskQueue,
  BiliDownloadVideoTask,
  BiliPartVideoTask,
  BiliEditVideoTask,
} from "./task.js";
import log from "../utils/log.js";
import BiliCheckQueue from "./BiliCheckQueue.js";
import { sleep, encrypt, decrypt, getTempPath, trashItem } from "../utils/index.js";
import { sendNotify } from "../notify.js";

import type {
  BiliupConfig,
  BiliUser,
  GlobalConfig,
  AppConfig as AppConfigType,
} from "@biliLive-tools/types";
import type { MediaOptions, DescV2 } from "@renmu/bili-api/dist/types/index.js";
import type { Item as MediaItem } from "./BiliCheckQueue.js";

type ClientInstance = InstanceType<typeof Client>;

/**
 * 生成client
 */
function createClient(uid?: number) {
  const client = new Client();

  const mid = uid || appConfig.get("uid");

  if (!mid) {
    return client;
  }
  const user = readUser(mid);
  if (user) {
    client.setAuth(user!.cookie, user!.mid, user!.accessToken);
    return client;
  } else {
    log.error("用户不存在", mid);
    return client;
  }
}

export async function getRoomInfo(room_id: number, uid?: number) {
  const client = createClient(uid);
  await client.live.getRoomInfo(room_id);
}

async function getArchives(
  params?: Parameters<ClientInstance["platform"]["getArchives"]>[0],
  uid?: number,
) {
  const client = createClient(uid);
  return client.platform.getArchives(params);
}

async function checkTag(tag: string, uid: number) {
  const client = createClient(uid);
  return client.platform.checkTag(tag);
}

async function searchTopic(keyword: string, uid: number) {
  const client = createClient(uid);
  return client.platform.searchTopic({
    page_size: 20,
    offset: 0,
    keywords: keyword,
  });
}

async function getUserInfo(uid: number) {
  const client = createClient(uid);
  return client.user.getUserInfo(uid);
}

async function getMyInfo(uid: number) {
  const client = createClient(uid);
  return client.user.getMyInfo();
}

function login() {
  const tv = new TvQrcodeLogin();
  return tv.login();
}

async function getArchiveDetail(bvid: string, uid?: number) {
  const client = createClient(uid);
  return client.video.detail({ bvid });
}

async function download(
  options: {
    bvid: string;
    cid: number;
    output: string;
    override?: boolean;
    onlyAudio?: boolean;
    danmu?: "none" | "xml";
  },
  uid?: number,
) {
  if ((await fs.pathExists(options.output)) && !options.override)
    throw new Error(`${options.output}已存在`);

  const client = createClient(uid);
  const ffmpegBinPath = appConfig.get("ffmpegPath");
  const tmpPath = getTempPath();
  const command = await client.video.dashDownload(
    { ...options, ffmpegBinPath, cachePath: tmpPath, disableVideo: options.onlyAudio },
    {},
    false,
  );

  const task = new BiliDownloadVideoTask(
    command,
    {
      name: `下载任务：${path.parse(options.output).name}`,
    },
    {
      onEnd: async () => {
        if (options.danmu !== "none") {
          const data = await client.video.getAllDm({ bvid: options.bvid, cid: options.cid });
          const xmlContent = await utils.protoBufToXml(data);
          fs.writeFile(
            path.join(path.dirname(options.output), `${path.parse(options.output).name}.xml`),
            xmlContent,
          );
        }
      },
    },
  );

  taskQueue.addTask(task, false);

  return {
    taskId: task.taskId,
  };
}

/**
 * 解析desc
 */
export function parseDesc(input: string): DescV2[] {
  const tokens: DescV2[] = [];

  const regex = /\[([^\]]*)\]<([^>]*)>/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(input)) !== null) {
    const precedingText = input.substring(lastIndex, match.index);
    if (precedingText) {
      tokens.push({ raw_text: precedingText, type: 1, biz_id: "" });
    }

    const innerText = match[1];
    const biz_id = match[2];
    tokens.push({ raw_text: innerText, type: 2, biz_id });

    lastIndex = regex.lastIndex;
  }

  const trailingText = input.substring(lastIndex);
  if (trailingText) {
    tokens.push({ raw_text: trailingText, type: 1, biz_id: "" });
  }

  return tokens;
}

export function formatOptions(options: BiliupConfig, coverDir: string | undefined = undefined) {
  const descV2 = parseDesc(options.desc || "");
  const hasAt = descV2.some((item) => item.type === 2);
  const desc = descV2
    .map((item) => {
      if (item.type === 1) {
        return item.raw_text;
      } else if (item.type === 2) {
        return `@${item.raw_text} `;
      } else {
        throw new Error(`不存在该type:${item.type}`);
      }
    })
    .join("");
  const tags = (options.tag ?? []).map((item) => item.trim());
  if (options.topic_name) {
    tags.unshift(options.topic_name);
  }

  let cover: string | undefined;
  if (options.cover) {
    if (path.isAbsolute(options.cover)) {
      cover = options.cover;
    } else {
      if (coverDir) cover = path.join(coverDir, options.cover);
    }
  } else {
    cover = undefined;
  }

  if (cover && !fs.pathExistsSync(cover)) {
    console.warn("封面不存在", cover);
    cover = undefined;
  }

  const data: MediaOptions = {
    cover: cover,
    title: options.title,
    tid: options.tid,
    tag: tags.slice(0, 10).join(","),
    copyright: options.copyright,
    source: options.source,
    dolby: options.dolby,
    lossless_music: options.hires,
    no_reprint: options.noReprint,
    up_close_danmu: options.closeDanmu ? true : false,
    up_close_reply: options.closeReply ? true : false,
    up_selection_reply: options.selectiionReply ? true : false,
    open_elec: options.openElec,
    desc_v2: hasAt ? descV2 : undefined,
    desc: desc,
    recreate: options.recreate || -1,
    no_disturbance: options.no_disturbance || 0,
    topic_id: options.topic_id,
    mission_id: options.mission_id,
    is_only_self: options.is_only_self || 0,
  };
  return data;
}

/**
 * 合集列表
 */
async function getSeasonList(uid: number) {
  const client = createClient(uid);
  return client.platform.getSeasonList();
}

/**
 * 上传视频接口
 */
export async function addMediaApi(
  uid: number,
  video: { cid: number; filename: string; title: string; desc?: string }[],
  options: BiliupConfig,
) {
  const globalConfig = container.resolve<GlobalConfig>("globalConfig");
  const mediaOptions = formatOptions(options, path.join(globalConfig.userDataPath, "cover"));
  const client = createClient(uid);
  return client.platform.addMediaClientApi(video, mediaOptions);
}

/**
 * 编辑视频接口
 */
export async function editMediaApi(
  uid: number,
  aid: number,
  video: { cid: number; filename: string; title: string; desc?: string }[],
  options: BiliupConfig,
) {
  const mediaOptions = {};
  console.log("编辑视频", options);

  // const globalConfig = container.resolve<GlobalConfig>("globalConfig");
  // const mediaOptions = formatOptions(options, path.join(globalConfig.userDataPath, "cover"));
  const client = createClient(uid);
  return client.platform.editMediaClientApi(video, { aid, ...mediaOptions }, "append");
}

/**
 * 格式化上传稿件参数，并非上传接口
 */
function formatMediaOptions(options: AppConfigType["biliUpload"]) {
  let line = options.line ?? "auto";
  const splitedLine = line.split("-");
  let zone = "";

  if (splitedLine.length === 2) {
    [zone, line] = splitedLine;
  }

  return {
    ...options,
    line: line,
    zone: zone,
    limitRate: Math.floor((options.limitRate || 0) / (options.concurrency || 1)),
  };
}

/**
 * 审核后的相关操作
 */
async function biliMediaAction(
  status: "completed" | "error",
  options: {
    comment?: string;
    top?: boolean;
    notification?: boolean;
    uid?: number;
    aid?: number;
    removeOriginAfterUploadCheck?: boolean;
    files: string[];
  },
  media: MediaItem,
) {
  if (status === "completed") {
    // 通知
    if (options.notification) {
      const notification = appConfig.get("notification")?.task?.mediaStatusCheck;
      if (notification?.includes("success")) {
        try {
          sendNotify(
            `${media.title}稿件审核通过`,
            `请前往B站创作中心查看详情\n稿件名：${media.title}`,
          );
        } catch (error) {
          log.error("发送通知失败", error);
        }
      }
    }
    // 评论
    if (options.comment) {
      try {
        const client = createClient(options.uid);
        const res = await client.reply.add({
          oid: options.aid,
          type: 1,
          message: options.comment,
          plat: 1,
        });
        await sleep(5000);
        await client.reply.top({ oid: options.aid, type: 1, action: 1, rpid: res.rpid });
      } catch (error) {
        log.error("评论失败", error);
      }
    }
    // 删除源文件
    if (options.removeOriginAfterUploadCheck) {
      for (const file of options.files) {
        try {
          await trashItem(file);
        } catch (error) {
          log.error("删除源文件失败", error);
        }
      }
    }
  } else {
    // 通知
    if (options.notification) {
      const notification = appConfig.get("notification")?.task?.mediaStatusCheck;
      if (notification?.includes("failure")) {
        try {
          sendNotify(
            `${media.title}稿件审核未通过`,
            `请前往B站创作中心查看详情\n稿件名：${media.title}\n状态：${media.state_desc}`,
          );
        } catch (error) {
          log.error("发送通知失败", error);
        }
      }
    }
  }
}

async function addMedia(
  filePath:
    | string[]
    | {
        path: string;
        title?: string;
      }[],
  options: BiliupConfig,
  uid: number,
  extraOptions?: {
    limitedUploadTime?: [] | [string, string];
    removeOriginAfterUploadCheck?: boolean;
  },
) {
  if (options.title.length > 80) {
    throw new Error("标题不能超过80个字符");
  }
  const client = createClient(uid);

  const pTask = new BiliAddVideoTask(
    {
      name: `创建稿件：${options.title}`,
      uid,
      mediaOptions: options,
    },
    {
      onEnd: async (data: { aid: number; bvid: string }) => {
        try {
          // 合集相关功能
          if (options.seasonId) {
            const archive = await client.platform.getArchive({ aid: data.aid });
            log.debug("合集稿件", archive);
            const cid = archive.videos[0].cid;
            let sectionId = options.sectionId;
            if (!options.sectionId) {
              sectionId = (await client.platform.getSeasonDetail(options.seasonId)).sections
                .sections[0].id;
            }
            client.platform.addMedia2Season({
              sectionId: sectionId!,
              episodes: [
                {
                  aid: data.aid,
                  cid: cid,
                  title: options.title,
                },
              ],
            });
          }
        } catch (error) {
          log.error("加入合集失败", error);
        }
        // 稿件检查
        if (
          (options.autoComment && options.comment) ||
          appConfig.get("notification")?.task?.mediaStatusCheck?.length ||
          extraOptions?.removeOriginAfterUploadCheck
        ) {
          const commentQueue = container.resolve<BiliCheckQueue>("commentQueue");
          commentQueue.add({
            aid: data.aid,
            uid: uid,
          });

          commentQueue.once("update", (_, status, media) => {
            console.log("审核结果", status, media);

            biliMediaAction(
              status,
              {
                comment: options.comment,
                top: options.commentTop || false,
                notification: !!appConfig.get("notification")?.task?.mediaStatusCheck?.length,
                removeOriginAfterUploadCheck: extraOptions?.removeOriginAfterUploadCheck,
                files: filePath.map((item) => (typeof item === "string" ? item : item.path)),
              },
              media,
            );
          });
        }
      },
    },
  );

  const config = appConfig.getAll();
  const uploadOptions = config.biliUpload;
  for (const item of filePath) {
    const part = {
      path: typeof item === "string" ? item : item.path,
      title: typeof item === "string" ? path.parse(item).name : item.title,
    };
    const uploader = new WebVideoUploader(part, client.auth, formatMediaOptions(uploadOptions));

    const task = new BiliPartVideoTask(
      uploader,
      {
        name: `上传视频：${part.title}(${path.parse(part.path).base})`,
        pid: pTask.taskId,
        limitTime: extraOptions?.limitedUploadTime ?? [],
      },
      {},
    );

    taskQueue.addTask(task, false);
    pTask.addTask(task);
  }
  taskQueue.addTask(pTask, true);

  return pTask;
}

export async function editMedia(
  aid: number,
  filePath:
    | string[]
    | {
        path: string;
        title?: string;
      }[],
  options: BiliupConfig | any,
  uid: number,
  extraOptions?: {
    limitedUploadTime?: [] | [string, string];
    removeOriginAfterUploadCheck?: boolean;
  },
) {
  if (filePath.length === 0) {
    throw new Error("请至少上传一个视频");
  }
  const client = createClient(uid);
  const title = typeof filePath[0] === "string" ? filePath[0] : filePath[0].title;

  const pTask = new BiliEditVideoTask(
    {
      name: `编辑稿件：${title}`,
      uid,
      mediaOptions: options,
      aid,
    },
    {
      onEnd: async () => {
        // 审核检查
        if (
          appConfig.get("notification")?.task?.mediaStatusCheck?.length ||
          extraOptions?.removeOriginAfterUploadCheck
        ) {
          const commentQueue = container.resolve<BiliCheckQueue>("commentQueue");
          commentQueue.add({ aid: aid, uid });
          commentQueue.once("update", (_, status, media) => {
            console.log("审核结果", status, media);
            biliMediaAction(
              status,
              {
                comment: "",
                top: false,
                notification: !!appConfig.get("notification")?.task?.mediaStatusCheck?.length,
                removeOriginAfterUploadCheck: extraOptions?.removeOriginAfterUploadCheck,
                files: filePath.map((item) => (typeof item === "string" ? item : item.path)),
              },
              media,
            );
          });
        }
      },
    },
  );

  const config = appConfig.getAll();
  const uploadOptions = config.biliUpload;
  for (const item of filePath) {
    const part = {
      path: typeof item === "string" ? item : item.path,
      title: typeof item === "string" ? path.parse(item).name : item.title,
    };
    const uploader = new WebVideoUploader(part, client.auth, formatMediaOptions(uploadOptions));

    const task = new BiliPartVideoTask(
      uploader,
      {
        name: `上传视频：${part.title}(${path.parse(part.path).base})`,
        pid: pTask.taskId,
        limitTime: extraOptions?.limitedUploadTime ?? [],
      },
      {},
    );

    taskQueue.addTask(task, false);
    pTask.addTask(task);
  }
  taskQueue.addTask(pTask, true);

  return pTask;
}

async function getSessionId(
  aid: number,
  uid: number,
): Promise<{
  /** 合集id */
  id: number;
  title: string;
  desc: string;
  cover: string;
  isEnd: number;
  mid: number;
  isAct: number;
  is_pay: number;
  state: number;
  partState: number;
  signState: number;
  rejectReason: string;
  ctime: number;
  mtime: number;
  no_section: number;
  forbid: number;
  protocol_id: string;
  ep_num: number;
  season_price: number;
  is_opened: number;
}> {
  const client = createClient(uid);
  return client.platform.getSessionId(aid);
}

/**
 * 获取创作中心的稿件详情
 */
async function getPlatformArchiveDetail(aid: number, uid: number) {
  const client = createClient(uid);
  return client.platform.getArchive({ aid });
}

/**
 * 获取投稿分区
 */
async function getPlatformPre(uid: number) {
  const client = createClient(uid);
  return client.platform.getArchivePre();
}

/**
 * 获取分区简介信息
 */
async function getTypeDesc(tid: number, uid: number) {
  const client = createClient(uid);
  return client.platform.getTypeDesc(tid);
}

// 验证配置
export const validateBiliupConfig = (config: BiliupConfig): [boolean, string | null] => {
  let msg: string | undefined = undefined;
  if (!config.title) {
    msg = "标题不能为空";
  }
  if (config.copyright === 2) {
    if (!config.source) {
      msg = "转载来源不能为空";
    } else {
      if (config.source.length > 200) {
        msg = "转载来源不能超过200个字符";
      }
    }
    if (config.topic_name) {
      msg = "转载类型稿件不支持活动参加哦~";
    }
  }
  if (config.tag.length === 0) {
    msg = "标签不能为空";
  }
  if (config.tag.length > 10) {
    msg = "标签不能超过10个";
  }

  if (msg) {
    return [false, msg];
  }
  return [true, null];
};

function getPassKey() {
  if (process.env.BILILIVE_TOOLS_BILIKEY) {
    return process.env.BILILIVE_TOOLS_BILIKEY;
  }
  return "7d628cb145deba521d5b0195924c466cae6559289cf5a335624ad8e6d7ef0085";
}

// 迁移B站登录信息
export const migrateBiliUser = async () => {
  const users = appConfig.getAll()?.biliUser || {};
  for (const key in users) {
    const user = users[key];
    await writeUser(user);
  }
  if (Object.keys(users).length > 0) {
    appConfig.set("biliUser", {});
  }
};

// 删除bili登录的cookie
export const deleteUser = async (uid: number) => {
  const users = appConfig.getAll().bilibiliUser || {};
  delete users[uid];
  appConfig.set("bilibiliUser", users);
  return true;
};

// 写入用户数据
export const writeUser = async (data: BiliUser) => {
  const users = appConfig.getAll().bilibiliUser || {};
  const passKey = getPassKey();
  users[data.mid] = encrypt(JSON.stringify(data), passKey);
  appConfig.set("bilibiliUser", users);
};

// 解码用户数据并增加expires参数
const decodeUser = (data: string) => {
  const passKey = getPassKey();
  const user = JSON.parse(decrypt(data, passKey));
  let expires = 0;
  try {
    expires = JSON.parse(user.rawAuth ?? "{}")?.cookie_info?.cookies?.find(
      (item) => item.name === "SESSDATA",
    )?.expires;
  } catch (e) {
    console.log("解析用户expires失败", e);
  }

  return {
    ...user,
    expires: expires * 1000,
  };
};

// 读取用户数据
export const readUser = (mid: number): BiliUser | undefined => {
  const users = appConfig.getAll().bilibiliUser || {};
  return users[mid] ? decodeUser(users[mid]) : undefined;
};

// 读取用户列表
export const readUserList = (): BiliUser[] => {
  const users = appConfig.getAll().bilibiliUser || {};
  return Object.values(users).map((item: string) => decodeUser(item));
};

const updateUserInfo = async (uid: number) => {
  const user = readUser(uid);
  if (!user) throw new Error("用户不存在");
  const userInfo = await biliApi.getMyInfo(uid);
  user.name = userInfo.profile.name;
  user.avatar = userInfo.profile.face;
  await writeUser(user);
};

// 添加用户
export const addUser = async (data: any) => {
  const cookieObj = {};
  (data?.cookie_info?.cookies || []).map((item: any) => (cookieObj[item.name] = item.value));

  const user: BiliUser = {
    mid: data.mid,
    rawAuth: JSON.stringify(data),
    cookie: cookieObj as any,
    expires: data.expires_in,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    platform: "TV",
  };

  await writeUser(user);
  await updateUserInfo(user.mid);
};

/**
 * 更新授权
 */
const updateAuth = async (uid: number) => {
  const user = readUser(uid);
  if (!user) throw new Error("用户不存在");
  const client = new TvQrcodeLogin();
  let data: any = await client.refresh(user.accessToken, user.refreshToken);

  data = {
    ...data,
    ...data?.token_info,
  };
  const cookieObj = {};
  (data?.cookie_info?.cookies || []).map((item: any) => (cookieObj[item.name] = item.value));

  const newUser: BiliUser = {
    ...user,
    rawAuth: JSON.stringify(data),
    cookie: cookieObj as any,
    expires: data.expires_in,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    platform: "TV",
  };
  await writeUser(newUser);
};

// 获取cookie
export const getCookie = (uid: number) => {
  const user = readUser(uid);
  if (!user) throw new Error("用户不存在");
  return user.cookie;
};

// 检查b站账号有效期
export const checkAccountLoop = () => {
  const canAutoCheck = appConfig.get("biliUpload")?.accountAutoCheck ?? false;
  let interval = 24 * 60 * 60 * 1000;
  try {
    if (!canAutoCheck) return;
    const userList = readUserList();
    // 如果有效期小于10天更新授权
    userList.forEach((user) => {
      if (!user.expires) return;
      if (user.expires - Date.now() < 10 * 24 * 60 * 60 * 1000) {
        const tasks = taskQueue.list();
        const runningBiliTask = tasks
          .filter((item) => ["bili", "biliUpload"].includes(item.type))
          .filter((item) => item.status === "running");
        if (runningBiliTask.length) {
          log.warn("正在上传视频，无法更新授权，请稍后再试");
          interval = 60 * 60 * 1000; // 1小时后再检查
          return;
        }
        updateAuth(user.mid);
      }
    });
  } finally {
    // 24小时检查一次
    setTimeout(checkAccountLoop, interval);
  }
};

export async function getBuvidConf(): Promise<{
  code: number;
  message: string;
  data: {
    b_3: string;
    b_4: string;
  };
}> {
  const res = await axios.get("https://api.bilibili.com/x/frontend/finger/spi", {
    headers: {
      user_agent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:107.0) Gecko/20100101 Firefox/107.0",
      Referer: "https://www.bilibili.com/",
    },
  });
  return res.data;
}

export const biliApi = {
  getArchives,
  checkTag,
  searchTopic,
  login,
  getUserInfo,
  getMyInfo,
  addMedia,
  editMedia,
  getSeasonList,
  getArchiveDetail,
  getPlatformPre,
  getTypeDesc,
  download,
  getSessionId,
  getPlatformArchiveDetail,
  validateBiliupConfig,
  deleteUser,
  updateUserInfo,
  readUserList,
  migrateBiliUser,
  addUser,
  updateAuth,
  getCookie,
  getBuvidConf,
};

export default biliApi;
