import path from "node:path";
import fs from "fs-extra";

import { Client, TvQrcodeLogin, WebVideoUploader } from "@renmu/bili-api";
import { uniq } from "lodash-es";
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
import { sleep, encrypt, decrypt, getTempPath } from "../utils/index.js";
import { sendNotify } from "../notify.js";

import type { BiliupConfig, BiliUser, GlobalConfig } from "@biliLive-tools/types";
import type { MediaOptions, DescV2 } from "@renmu/bili-api/dist/types/index.js";
import type { getArchivesReturnType } from "@renmu/bili-api/dist/types/platform.js";
import type { AppConfig } from "../config.js";

type ClientInstance = InstanceType<typeof Client>;

/**
 * 生成client
 */
async function createClient(uid?: number) {
  const client = new Client();

  const mid = uid || appConfig.get("uid");

  if (!mid) throw new Error("请先登录");
  const user = await readUser(mid);
  client.setAuth(user!.cookie, user!.mid, user!.accessToken);
  return client;
}

export async function getRoomInfo(room_id: number, uid?: number) {
  const client = await createClient(uid);
  await client.live.getRoomInfo(room_id);
}

async function getArchives(
  params?: Parameters<ClientInstance["platform"]["getArchives"]>[0],
  uid?: number,
) {
  const client = await createClient(uid);
  return client.platform.getArchives(params);
}

async function checkTag(tag: string, uid: number) {
  const client = await createClient(uid);
  return client.platform.checkTag(tag);
}

async function searchTopic(keyword: string, uid: number) {
  const client = await createClient(uid);
  return client.platform.searchTopic({
    page_size: 20,
    offset: 0,
    keywords: keyword,
  });
}

async function getUserInfo(uid: number) {
  const client = await createClient(uid);
  return client.user.getUserInfo(uid);
}

async function getMyInfo(uid: number) {
  const client = await createClient(uid);
  return client.user.getMyInfo();
}

function login() {
  const tv = new TvQrcodeLogin();
  return tv.login();
}

async function getArchiveDetail(bvid: string, uid?: number) {
  const client = await createClient(uid);
  return client.video.detail({ bvid });
}

async function download(
  options: { bvid: string; cid: number; output: string; override: boolean },
  uid: number,
) {
  if ((await fs.pathExists(options.output)) && !options.override)
    throw new Error(`${options.output}已存在`);

  const client = await createClient(uid);
  const ffmpegBinPath = appConfig.get("ffmpegPath");
  const tmpPath = getTempPath();
  const command = await client.video.download(
    { ...options, ffmpegBinPath, cachePath: tmpPath },
    {},
  );

  const task = new BiliDownloadVideoTask(
    command,
    {
      name: `下载任务：${path.parse(options.output).name}`,
    },
    {},
  );

  taskQueue.addTask(task, true);

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
  const client = await createClient(uid);
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
  const client = await createClient(uid);
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
  const client = await createClient(uid);
  return client.platform.editMediaClientApi(video, { aid, ...mediaOptions }, "append");
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
) {
  const client = await createClient(uid);

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
        // 自动评论
        if (options.autoComment && options.comment) {
          const commentQueue = container.resolve<BiliCommentQueue>("commentQueue");
          commentQueue.addCommentTask({
            aid: data.aid,
            content: options.comment || "",
            uid: uid,
            top: options.commentTop || false,
          });
        }
        // 审核检查
        if (appConfig.get("notification")?.task?.mediaStatusCheck?.length) {
          const commentQueue = container.resolve<BiliCommentQueue>("commentQueue");
          commentQueue.addCheckTask({ aid: data.aid, uid });
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
    const uploader = new WebVideoUploader(part, client.auth, uploadOptions);

    const task = new BiliPartVideoTask(
      uploader,
      {
        name: `上传视频：${part.title}`,
        pid: pTask.taskId,
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
) {
  if (filePath.length === 0) {
    throw new Error("请至少上传一个视频");
  }
  const client = await createClient(uid);
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
        if (appConfig.get("notification")?.task?.mediaStatusCheck?.length) {
          const commentQueue = container.resolve<BiliCommentQueue>("commentQueue");
          commentQueue.addCheckTask({ aid: aid, uid });
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
    const uploader = new WebVideoUploader(part, client.auth, uploadOptions);

    const task = new BiliPartVideoTask(
      uploader,
      {
        name: `上传视频：${part.title}`,
        pid: pTask.taskId,
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
  const client = await createClient(uid);
  return client.platform.getSessionId(aid);
}

/**
 * 获取创作中心的稿件详情
 */
async function getPlatformArchiveDetail(aid: number, uid: number) {
  const client = await createClient(uid);
  return client.platform.getArchive({ aid });
}

/**
 * 获取投稿分区
 */
async function getPlatformPre(uid: number) {
  const client = await createClient(uid);
  return client.platform.getArchivePre();
}

/**
 * 获取分区简介信息
 */
async function getTypeDesc(tid: number, uid: number) {
  const client = await createClient(uid);
  return client.platform.getTypeDesc(tid);
}

// b站审核队列
export class BiliCommentQueue {
  list: {
    type: "comment" | "checkStatus";
    uid: number;
    aid: number;
    status: "pending" | "completed" | "error";
    content: string;
    startTime: number;
    updateTime: number;
    top: boolean;
  }[] = [];
  mediaList: getArchivesReturnType["arc_audits"] = [];
  appConfig: AppConfig;
  constructor({ appConfig }: { appConfig: AppConfig }) {
    this.list = [];
    this.appConfig = appConfig;
  }

  /**
   * 添加检查审核状态任务
   */
  addCheckTask(data: { uid: number; aid: number }) {
    const index = this.list
      .filter((item) => item.type === "checkStatus")
      .findIndex((item) => item.aid === data.aid);
    if (index !== -1) {
      // 如果已经存在，重置状态
      this.list[index].status = "pending";
    } else {
      this.list.push({
        type: "checkStatus",
        uid: data.uid,
        aid: data.aid,
        status: "pending",
        content: "",
        startTime: Date.now(),
        updateTime: Date.now(),
        top: false,
      });
    }

    // console.log("addCheckTask", this.list);
  }
  /**
   * 添加评论任务
   */
  addCommentTask(data: { aid: number; content: string; uid: number; top: boolean }) {
    if (this.list.filter((item) => item.type === "comment").some((item) => item.aid === data.aid))
      return;
    this.list.push({
      type: "comment",
      uid: data.uid,
      aid: data.aid,
      content: data.content,
      top: data.top,
      status: "pending",
      startTime: Date.now(),
      updateTime: Date.now(),
    });
  }
  async check() {
    // console.log("list", this.list);
    if (this.list.filter((item) => item.status === "pending").length === 0) return;
    await this.getArchiveList();
    this.handlingList();
    // console.log("handling", this.list);
    await this.commentCheck();
    await this.statusCheck();
  }
  async sendNotify(title: string, desp: string) {
    sendNotify(title, desp);
  }
  /**
   * 审核状态通知任务检查
   */
  async statusCheck() {
    const list = this.filter("checkStatus");
    // console.log("checkStatus", list);
    const notification = this.appConfig.get("notification")?.task?.mediaStatusCheck;
    for (const item of list) {
      const media = this.mediaList.find((media) => media.Archive.aid === item.aid);
      if (!media) {
        item.status = "error";
        continue;
      }
      // 根据选项发送通知
      if (media.Archive.state === 0) {
        if (notification?.includes("success")) {
          log.info("稿件审核通过", media.Archive.title);
          this.sendNotify(
            `${media.Archive.title}稿件审核通过`,
            `请前往B站创作中心查看详情\n稿件名：${media.Archive.title}`,
          );
          item.status = "completed";
        } else {
          item.status = "error";
        }
      } else if (media.Archive.state < 0) {
        if (media.Archive.state === -30 || media.Archive.state === -6) {
          continue;
        }
        if (notification?.includes("failure")) {
          log.error("稿件审核未通过", media.Archive.title, media);
          this.sendNotify(
            `${media.Archive.title}稿件审核未通过`,
            `请前往B站创作中心查看详情\n稿件名：${media.Archive.title}\n状态：${media.Archive.state_desc}`,
          );
          item.status = "completed";
        } else {
          item.status = "error";
        }
      } else {
        log.warn("稿件状态未检测成功", media);
      }
    }
  }
  /**
   * 评论任务检查
   */
  async commentCheck() {
    const allowCommentList: number[] = this.mediaList
      .filter((item) => item.stat.aid)
      .map((item) => item.Archive.aid);

    const list = this.filter("comment").filter((item) => {
      return allowCommentList.some((aid) => aid === item.aid);
    });
    // log.debug("评论队列", list);

    for (const item of list) {
      try {
        const res = await this.addCommentApi(item);
        console.log("评论成功", res);
        await sleep(3000);
        await this.commentTopApi(res.rpid, item);
        item.status = "completed";
      } catch (error) {
        item.status = "error";
        log.error("评论失败", error);
      }
    }
  }
  /**
   * 查询稿件列表
   */
  async getArchiveList(): Promise<getArchivesReturnType["arc_audits"]> {
    const list: any[] = [];
    const uids = uniq(
      this.list.filter((item) => item.status === "pending").map((item) => item.uid),
    );
    for (const uid of uids) {
      const res = await biliApi.getArchives({ pn: 1, ps: 20 }, uid);
      list.push(...res.arc_audits);
    }
    this.mediaList = list;
    return list;
  }
  /**
   * 筛选数据
   */
  filter(type: "comment" | "checkStatus") {
    return this.list
      .filter((item) => item.status === "pending")
      .filter((item) => item.type === type);
  }
  /**
   * 对列表数据进行处理
   */
  async handlingList() {
    this.list.map((item) => {
      if (item.status !== "pending") return;
      // 更新操作时间，如果超过24小时，状态设置为error
      item.updateTime = Date.now();
      if (item.updateTime - item.startTime > 1000 * 60 * 60 * 24) {
        item.status = "error";
        log.error("B站稿件任务超时", item);
      }
      // 如果list中存在，但是稿件列表不存在，状态设置为error
      if (!this.mediaList.some((media) => media.Archive.aid == item.aid)) {
        item.status = "error";
        log.error("B站稿件不存在", item);
      }
    });
  }
  async addCommentApi(item: { aid: number; content: string; uid: number }): Promise<{
    rpid: number;
  }> {
    const client = await createClient(item.uid);
    // @ts-ignore
    return client.reply.add({
      oid: item.aid,
      type: 1,
      message: item.content,
      plat: 1,
    });
  }
  async commentTopApi(rpid: number, item: { aid: number; uid: number }) {
    const client = await createClient(item.uid);

    return client.reply.top({ oid: item.aid, type: 1, action: 1, rpid });
  }

  checkLoop = async () => {
    const interval = this.appConfig.get("biliUpload")?.checkInterval ?? 600;
    try {
      await this.check();
    } finally {
      setTimeout(this.checkLoop, interval * 1000);
    }
  };
}

// 验证配置
export const validateBiliupConfig = async (config: BiliupConfig) => {
  let msg: string | undefined = undefined;
  if (!config.title) {
    msg = "标题不能为空";
  }
  if (config.title.length > 80) {
    msg = "标题不能超过80个字符";
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

// 读取用户数据
export const readUser = async (mid: number): Promise<BiliUser | undefined> => {
  const users = appConfig.getAll().bilibiliUser || {};
  const passKey = getPassKey();
  return users[mid] ? JSON.parse(decrypt(users[mid], passKey)) : undefined;
};

// 读取用户列表
export const readUserList = (): BiliUser[] => {
  const users = appConfig.getAll().bilibiliUser || {};
  const passKey = getPassKey();
  return Object.values(users).map((item: string) => JSON.parse(decrypt(item, passKey)));
};

const updateUserInfo = async (uid: number) => {
  const user = await readUser(uid);
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
};

export default biliApi;
