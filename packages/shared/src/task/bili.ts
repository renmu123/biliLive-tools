import path from "node:path";

import { Client, TvQrcodeLogin } from "@renmu/bili-api";
import { appConfig } from "../index.js";

import { BiliVideoTask, taskQueue, BiliDownloadVideoTask } from "./task.js";
import log from "../utils/log.js";
import { sleep } from "../utils/index.js";

import type { BiliupConfig, BiliUser } from "@biliLive-tools/types";

type ClientInstance = InstanceType<typeof Client>;

export const client = new Client();

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

  return client.video.detail({ bvid });
}

async function download(options: { bvid: string; cid: number; output: string }, uid: number) {
  await loadCookie(uid);
  const ffmpegBinPath = appConfig.get("ffmpegPath");
  const command = await client.video.download({ ...options, ffmpegBinPath }, {});

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

  return task;
}

async function editMedia(
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
  await loadCookie(uid);
  const command = await client.platform.editMedia(aid, filePath, {}, "append", {
    submit: "client",
    uploader: "web",
  });

  const title = typeof filePath[0] === "string" ? path.parse(filePath[0]).name : filePath[0].title;
  const task = new BiliVideoTask(
    command,
    {
      name: `编辑稿件任务：${title}`,
    },
    {},
  );

  taskQueue.addTask(task, true);

  return task;
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

// 验证配置
export const validateBiliupConfig = async (config: BiliupConfig) => {
  let msg: string | undefined = undefined;
  if (!config.title) {
    msg = "标题不能为空";
  }
  if (config.title.length > 80) {
    msg = "标题不能超过80个字符";
  }
  // if (config.desc && config.desc.length > 250) {
  //   msg = "简介不能超过250个字符";
  // }
  if (config.copyright === 2) {
    if (!config.source) {
      msg = "转载来源不能为空";
    } else {
      if (config.source.length > 200) {
        msg = "转载来源不能超过200个字符";
      }
    }
  }
  if (config.tag.length === 0) {
    msg = "标签不能为空";
  }
  if (config.tag.length > 12) {
    msg = "标签不能超过12个";
  }

  if (msg) {
    throw new Error(msg);
  }
  return true;
};

// 删除bili登录的cookie
export const deleteUser = async (uid: number) => {
  const users = appConfig.get("biliUser") || {};
  delete users[uid];
  appConfig.set("biliUser", users);
  return true;
};

// 写入用户数据
export const writeUser = async (data: BiliUser) => {
  const users = appConfig.get("biliUser") || {};
  users[data.mid] = data;
  appConfig.set("biliUser", users);
};

// 读取用户数据
export const readUser = async (mid: number): Promise<BiliUser | undefined> => {
  const users = appConfig.get("biliUser") || {};
  return users[mid];
};

// 读取用户列表
export const readUserList = async (): Promise<BiliUser[]> => {
  const users = appConfig.get("biliUser") || {};
  return Object.values(users) as unknown as BiliUser[];
};

export const format = async (data: any) => {
  const cookieObj = {};
  (data?.cookie_info?.cookies || []).map((item: any) => (cookieObj[item.name] = item.value));

  const result: BiliUser = {
    mid: data.mid,
    rawAuth: JSON.stringify(data),
    cookie: cookieObj as any,
    expires: data.expires_in,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    platform: "TV",
  };

  try {
    const biliUser = await biliApi.getUserInfo(data.mid);
    result.name = biliUser.name;
    result.avatar = biliUser.face;
  } catch (e) {
    log.error(e);
  }

  return result;
};

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
  download,
  getSessionId,
  getPlatformArchiveDetail,
  validateBiliupConfig,
};
