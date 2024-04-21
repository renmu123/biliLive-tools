import path from "node:path";

import { Client, TvQrcodeLogin } from "@renmu/bili-api";
import { appConfig } from "@biliLive-tools/shared";

import { format, writeUser, readUser } from "./biliup";
import { BiliVideoTask, taskQueue, BiliDownloadVideoTask } from "./task";
import log from "./utils/log";
import { sleep } from "../utils/index";

import type { IpcMainInvokeEvent, WebContents } from "electron";
import type { BiliupConfig } from "../types/index";

type ClientInstance = InstanceType<typeof Client>;

const client = new Client();

/**
 * 加载cookie
 * @param uid 用户id
 */
async function loadCookie(uid?: number) {
  const mid = uid || appConfig.get("uid");

  if (!mid) throw new Error("请先登录");
  const user = await readUser(mid);
  return client.setAuth(user!.cookie, user!.mid, user!.accessToken);
}

async function getArchives(
  params?: Parameters<ClientInstance["platform"]["getArchives"]>[0],
  uid?: number,
): ReturnType<ClientInstance["platform"]["getArchives"]> {
  await loadCookie(uid);
  return client.platform.getArchives(params);
}

async function checkTag(
  tag: string,
  uid: number,
): ReturnType<ClientInstance["platform"]["checkTag"]> {
  await loadCookie(uid);
  return client.platform.checkTag(tag);
}

async function getUserInfo(uid: number): ReturnType<ClientInstance["user"]["getUserInfo"]> {
  return client.user.getUserInfo(uid);
}

async function getMyInfo(uid: number) {
  await loadCookie(uid);
  return client.user.getMyInfo();
}

function login() {
  const tv = new TvQrcodeLogin();
  return tv.login();
}

async function getArchiveDetail(
  bvid: string,
  uid?: number,
): ReturnType<ClientInstance["video"]["detail"]> {
  if (uid) await loadCookie(uid);
  console.log(bvid, uid);

  return client.video.detail({ bvid });
}

async function download(
  webContents: WebContents,
  options: { bvid: string; cid: number; output: string },
  uid: number,
) {
  await loadCookie(uid);
  const ffmpegBinPath = appConfig.get("ffmpegPath");
  console.log(options, ffmpegBinPath);
  const command = await client.video.download({ ...options, ffmpegBinPath }, {});

  const task = new BiliDownloadVideoTask(
    command,
    webContents,
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

interface MediaOptions {
  /** 封面，如果不是http:，会尝试上传 */
  cover?: string;
  /** 标题 */
  title: string;
  /** 1: 自制，2: 转载，转载必须有source字段，且不能超过200字 */
  copyright?: 1 | 2;
  /** copyright=2之后必填的字段 */
  source?: string;
  /** 分区id */
  tid: number;
  /** 标签，用逗号分隔，最多12个 */
  tag: string;
  /** 简介 */
  desc?: string;
  /** 简介中的特殊效果 */
  desc_v2?: any[];
  /** 动态 */
  dynamic?: string;
  /** 杜比音效 */
  dolby?: 0 | 1;
  /** hires音效 */
  lossless_music?: 0 | 1;
  desc_format_id?: number;
  /** 话题id */
  mission_id?: number;
  /** 自制声明 0: 允许转载，1：禁止转载 */
  no_reprint?: 0 | 1;
  /** 是否全景 */
  is_360?: -1 | 1;
  /** 关闭弹幕，编辑应该不生效 */
  up_close_danmu?: boolean;
  /** 关闭评论，编辑应该不生效 */
  up_close_reply?: boolean;
  /** 精选评论，编辑应该不生效 */
  up_selection_reply?: boolean;
  /** 充电面板 0: 关闭，1: 开启，编辑应该不生效 */
  open_elec?: 0 | 1;
  /** 是否允许二创：1：允许，-1：不允许 */
  recreate?: 1 | -1;
  /** 是否推送到动态：0：不推送，1：推送 */
  no_disturbance?: 0 | 1;
}

interface DescV2 {
  raw_text: string;
  type: 1 | 2; // 1 for regular text, 2 for content inside square brackets
  biz_id: string;
}
/**
 * 解析desc
 */
function parseDesc(input: string): DescV2[] {
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

function formatOptions(options: BiliupConfig) {
  const descV2 = parseDesc(options.desc || "");
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
  const data: MediaOptions = {
    cover: options.cover,
    title: options.title,
    tid: options.tid,
    tag: options.tag.join(","),
    copyright: options.copyright,
    source: options.source,
    dolby: options.dolby,
    lossless_music: options.hires,
    no_reprint: options.noReprint,
    up_close_danmu: options.closeDanmu ? true : false,
    up_close_reply: options.closeReply ? true : false,
    up_selection_reply: options.selectiionReply ? true : false,
    open_elec: options.openElec,
    desc_v2: descV2,
    desc: desc,
    recreate: options.recreate || -1,
    no_disturbance: options.no_disturbance || 0,
  };
  // console.log("formatOptions", data);
  return data;
}

/**
 * 合集列表
 */
async function getSeasonList(uid: number): ReturnType<ClientInstance["platform"]["getSeasonList"]> {
  await loadCookie(uid);
  return client.platform.getSeasonList();
}

async function addMedia(
  webContents: WebContents,
  filePath:
    | string[]
    | {
        path: string;
        title?: string;
      }[],
  options: BiliupConfig,
  uid: number,
) {
  await loadCookie(uid);
  const command = await client.platform.addMedia(filePath, formatOptions(options));

  const task = new BiliVideoTask(
    command,
    webContents,
    {
      name: `上传任务：${options.title}`,
    },
    {
      onEnd: async (data: { aid: number; bvid: string }) => {
        try {
          // 合集相关功能
          if (options.seasonId) {
            await loadCookie(uid);
            const archive = await client.platform.getArchive({ aid: data.aid });
            log.debug("合集稿件", archive);

            if (archive.videos.length > 1) {
              log.warn("该稿件的分p大于1，无法加入分p", archive.archive.title);
              return;
            }
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
          commentQueue.add({
            aid: data.aid,
            content: options.comment || "",
            uid: uid,
            top: options.commentTop || false,
          });
        }
      },
    },
  );

  taskQueue.addTask(task, true);

  return {
    taskId: task.taskId,
  };
}

async function editMedia(
  webContents: WebContents,
  aid: number,
  filePath:
    | string[]
    | {
        path: string;
        title?: string;
      }[],
  options: any,
  uid: number,
) {
  console.log(options);
  await loadCookie(uid);
  const command = await client.platform.editMedia(aid, filePath, {}, "append", {
    submit: "client",
    uploader: "web",
  });

  const title = typeof filePath[0] === "string" ? path.parse(filePath[0]).name : filePath[0].title;
  const task = new BiliVideoTask(
    command,
    webContents,
    {
      name: `编辑稿件任务：${title}`,
    },
    {},
  );

  taskQueue.addTask(task, true);

  return {
    taskId: task.taskId,
  };
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
  await loadCookie(uid);
  return client.platform.getSessionId(aid);
}

/**
 * 获取创作中心的稿件详情
 */
async function getPlatformArchiveDetail(
  aid: number,
  uid: number,
): ReturnType<ClientInstance["platform"]["getArchive"]> {
  await loadCookie(uid);
  return client.platform.getArchive({ aid });
}

/**
 * 获取投稿分区
 */
async function getPlatformPre(
  uid: number,
): ReturnType<ClientInstance["platform"]["getArchivePre"]> {
  await loadCookie(uid);
  return client.platform.getArchivePre();
}

/**
 * 获取分区简介信息
 */
async function getTypeDesc(
  tid: number,
  uid: number,
): ReturnType<ClientInstance["platform"]["getTypeDesc"]> {
  await loadCookie(uid);
  return client.platform.getTypeDesc(tid);
}

export const biliApi = {
  getArchives,
  checkTag,
  login,
  getUserInfo,
  getMyInfo,
  addMedia,
  editMedia,
  getSeasonList,
  getArchiveDetail,
  getPlatformPre,
  getTypeDesc,
};

export const invokeWrap = <T extends (...args: any[]) => any>(fn: T) => {
  return (_event: IpcMainInvokeEvent, ...args: Parameters<T>): ReturnType<T> => {
    return fn(...args);
  };
};

let tv: TvQrcodeLogin;

// b站评论队列
class BiliCommentQueue {
  list: {
    uid: number;
    aid: number;
    status: "pending" | "completed" | "error";
    content: string;
    startTime: number;
    updateTime: number;
    top: boolean;
  }[] = [];
  constructor() {
    this.list = [];
  }
  add(data: { aid: number; content: string; uid: number; top: boolean }) {
    // bvid是唯一的
    if (this.list.some((item) => item.aid === data.aid)) return;
    this.list.push({
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
    const list = await this.filterList();
    for (const item of list) {
      try {
        const res = await this.addComment(item);
        console.log("评论成功", res);
        await sleep(3000);
        await this.top(res.rpid, item);
        item.status = "completed";
      } catch (error) {
        item.status = "error";
        log.error("评论失败", error);
      }
    }
  }
  /**
   * 过滤出通过审核的稿件
   */
  async filterList() {
    const allowCommentList: number[] = [];
    const uids = this.list.map((item) => item.uid);
    for (const uid of uids) {
      const res = await biliApi.getArchives({ pn: 1, ps: 20 }, uid);
      allowCommentList.push(
        ...res.arc_audits.filter((item) => item.stat.aid).map((item) => item.Archive.aid),
      );
    }
    log.debug("评论队列", this.list);

    this.list.map((item) => {
      // 更新操作时间，如果超过24小时，状态设置为error
      item.updateTime = Date.now();
      if (item.updateTime - item.startTime > 1000 * 60 * 60 * 24) {
        item.status = "error";
      }
    });
    return this.list.filter((item) => {
      return allowCommentList.some((aid) => aid === item.aid) && item.status === "pending";
    });
  }
  async addComment(item: { aid: number; content: string; uid: number }): Promise<{
    rpid: number;
  }> {
    await loadCookie(item.uid);
    // @ts-ignore
    return client.reply.add({
      oid: item.aid,
      type: 1,
      message: item.content,
      plat: 1,
    });
  }
  async top(rpid: number, item: { aid: number; uid: number }) {
    await loadCookie(item.uid);
    return client.reply.top({ oid: item.aid, type: 1, action: 1, rpid });
  }
  run(interval: number) {
    setInterval(() => {
      this.check();
    }, interval);
  }
}

export const commentQueue = new BiliCommentQueue();

export const handlers = {
  "biliApi:getArchives": (
    _event: IpcMainInvokeEvent,
    params: Parameters<typeof biliApi.getArchives>[0],
    uid: number,
  ): ReturnType<typeof biliApi.getArchives> => {
    return biliApi.getArchives(params, uid);
  },
  "biliApi:checkTag": (
    _event: IpcMainInvokeEvent,
    tag: Parameters<typeof biliApi.checkTag>[0],
    uid: number,
  ): ReturnType<typeof biliApi.checkTag> => {
    return biliApi.checkTag(tag, uid);
  },
  "biliApi:login": (event: IpcMainInvokeEvent) => {
    tv = new TvQrcodeLogin();
    tv.on("error", (res) => {
      event.sender.send("biliApi:login-error", res);
    });
    tv.on("scan", (res) => {
      console.log("scan", res);
    });
    tv.on("completed", async (res) => {
      const data = res.data;
      const user = await format(data);
      await writeUser(user);
      console.log("login-completed", res);
      event.sender.send("biliApi:login-completed", res);
    });
    return tv.login();
  },
  "biliApi:login:cancel": () => {
    tv.interrupt();
  },
  "bili:updateUserInfo": async (_event: IpcMainInvokeEvent, uid: number) => {
    const user = await readUser(uid);
    if (!user) throw new Error("用户不存在");
    const userInfo = await getMyInfo(uid);
    user.name = userInfo.profile.name;
    user.avatar = userInfo.profile.face;
    await writeUser(user);
  },
  "bili:addMedia": (
    event: IpcMainInvokeEvent,
    uid: number,
    pathArray: string[],
    options: BiliupConfig,
  ) => {
    return addMedia(event.sender, pathArray, options, uid);
  },
  "biliApi:getSeasonList": (
    _event: IpcMainInvokeEvent,
    uid: number,
  ): ReturnType<typeof biliApi.getSeasonList> => {
    return getSeasonList(uid);
  },
  "biliApi:getArchiveDetail": (
    _event: IpcMainInvokeEvent,
    bvid: string,
    uid?: number,
  ): ReturnType<typeof biliApi.getArchiveDetail> => {
    return getArchiveDetail(bvid, uid);
  },
  "biliApi:download": (
    event: IpcMainInvokeEvent,
    options: { bvid: string; cid: number; output: string },
    uid: number,
  ) => {
    return download(event.sender, options, uid);
  },
  "biliApi:getSessionId": (_event: IpcMainInvokeEvent, aid: number, uid: number) => {
    return getSessionId(aid, uid);
  },
  "biliApi:getPlatformArchiveDetail": (
    _event: IpcMainInvokeEvent,
    aid: number,
    uid: number,
  ): ReturnType<ClientInstance["platform"]["getArchive"]> => {
    return getPlatformArchiveDetail(aid, uid);
  },
  "biliApi:getPlatformPre": (
    _event: IpcMainInvokeEvent,
    uid: number,
  ): ReturnType<ClientInstance["platform"]["getArchivePre"]> => {
    return getPlatformPre(uid);
  },
  "biliApi:getTypeDesc": (
    _event: IpcMainInvokeEvent,
    tid: number,
    uid: number,
  ): ReturnType<ClientInstance["platform"]["getTypeDesc"]> => {
    return getTypeDesc(tid, uid);
  },
};

export default {
  client,
};
