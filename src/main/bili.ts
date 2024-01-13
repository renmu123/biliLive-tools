import path from "node:path";

import { Client, TvQrcodeLogin } from "@renmu/bili-api";
import { format, writeUser, readUser } from "./biliup";
import { appConfig } from "./config";
import { BiliVideoTask, taskQueue } from "./task";

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
  return client.setAuth(user!.cookie, user!.accessToken);
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

async function getMyInfo(uid: number): ReturnType<ClientInstance["user"]["getMyInfo"]> {
  await loadCookie(uid);
  return client.user.getMyInfo();
}

function login() {
  const tv = new TvQrcodeLogin();
  return tv.login();
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

export function convertDescV2ToDesc(descV2: DescV2[]): string {
  return descV2
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
  };
  console.log("formatOptions", data);
  return data;
}

async function addMedia(
  webContents: WebContents,
  filePath: string[],
  options: BiliupConfig,
  uid: number,
) {
  await loadCookie(uid);
  const command = await client.platform.addMedia(filePath, formatOptions(options));

  const task = new BiliVideoTask(
    command,
    webContents,
    {
      name: `上传任务：${path.parse(filePath[0]).name}`,
    },
    {},
  );

  taskQueue.addTask(task, true);

  return {
    taskId: task.taskId,
  };
}

async function editMedia(
  webContents: WebContents,
  aid: number,
  filePath: string[],
  options: any,
  uid: number,
) {
  console.log(options);
  await loadCookie(uid);
  const command = await client.platform.editMedia(aid, filePath, {}, "append", {
    submit: "client",
    uploader: "web",
  });

  const task = new BiliVideoTask(
    command,
    webContents,
    {
      name: `编辑稿件任务：${path.parse(filePath[0]).name}`,
    },
    {},
  );

  taskQueue.addTask(task, true);

  return {
    taskId: task.taskId,
  };
}

export const biliApi = {
  getArchives,
  checkTag,
  login,
  getUserInfo,
  getMyInfo,
  addMedia,
  editMedia,
};

export const invokeWrap = <T extends (...args: any[]) => any>(fn: T) => {
  return (_event: IpcMainInvokeEvent, ...args: Parameters<T>): ReturnType<T> => {
    return fn(...args);
  };
};

let tv: TvQrcodeLogin;

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
      console.log(res);
    });
    tv.on("completed", async (res) => {
      const data = res.data;
      const user = await format(data);
      await writeUser(user);
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
    // @ts-ignore
    user.name = userInfo.data.profile.name;
    // @ts-ignore
    user.avatar = userInfo.data.profile.face;
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
};

export default {
  client,
};
