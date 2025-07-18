import { TypedEmitter } from "tiny-typed-emitter";
import biliApi from "./bili.js";
import log from "../utils/log.js";
import { retryWithAxiosError } from "../utils/index.js";

import type { AppConfig } from "../config.js";

export type Item = {
  aid: number;
  state: number;
  title: string;
  state_desc: string;
};

interface Events {
  update: (aid: number, status: "completed" | "error", data: Item) => void;
}
export default class BiliCheckQueue extends TypedEmitter<Events> {
  list: {
    uid: number;
    aid: number;
    startTime: number;
    status: "pending" | "completed" | "error";
  }[] = [];
  appConfig: AppConfig;
  constructor({ appConfig }: { appConfig: AppConfig }) {
    super();
    this.list = [];
    this.appConfig = appConfig;
  }
  add(data: { aid: number; uid: number }) {
    if (this.list.some((item) => item.aid === data.aid)) return;
    this.list.push({
      uid: data.uid,
      aid: data.aid,
      startTime: Date.now(),
      status: "pending",
    });
  }
  /**
   * 过滤出通过审核的稿件
   */
  async check() {
    this.list = this.list.filter((item) => {
      const now = Date.now();
      return now - item.startTime < 1000 * 60 * 60 * 24;
    });

    const uids = new Set(this.list.map((item) => item.uid));
    const mediaList: Item[] = [];
    // 先找一下第一页内容，绝大部分情况下都是在第一页
    for (const uid of uids) {
      try {
        const res = await retryWithAxiosError(() => biliApi.getArchives({ pn: 1, ps: 20 }, uid));
        for (const media of res.arc_audits) {
          if (media.Archive.aid) {
            mediaList.push({
              aid: media.Archive.aid,
              state: media.Archive.state,
              title: media.Archive.title,
              state_desc: media.Archive.state_desc ?? "",
            });
          }
        }
      } catch (error) {
        log.error("查询稿件列表失败", error);
      }
    }
    // 如果没有找到，那就根据详情页查询
    for (const item of this.list) {
      if (mediaList.some((media) => media.aid === item.aid)) continue;
      try {
        const media = await retryWithAxiosError(() =>
          biliApi.getPlatformArchiveDetail(item.aid, item.uid),
        );
        mediaList.push({
          aid: item.aid,
          state: media.archive.state,
          title: media.archive.title,
          state_desc: media.archive.state_desc,
        });
      } catch (e) {
        log.error("查询稿件详情失败", e);
      }
    }

    for (const item of this.list) {
      const media = mediaList.find((media) => media.aid === item.aid);
      if (!media) {
        // 经过两次查询还未找到，那大概是稿件不存在，为用户主动删除，不要触发状态变更并进行通知
        log.error("未找到稿件", item);
        item.status = "error";
        continue;
      }

      if (media.state === 0) {
        // 通过审核
        item.status = "completed";
        this.emit("update", media.aid, "completed", media);
      } else if (media.state < 0) {
        if (media.state === -30 || media.state === -6) {
          // 审核中，不要干啥操作
          continue;
        } else if (media.state === -50) {
          // 仅自己可见，不需要触发错误
          item.status = "completed";
          this.emit("update", media.aid, "completed", media);
        } else {
          item.status = "error";
          this.emit("update", media.aid, "error", media);
        }
      } else {
        this.emit("update", media.aid, "error", media);
        log.warn("稿件状态未检测成功", media);
      }
    }

    this.list = this.list.filter((item) => item.status === "pending");
  }

  checkLoop = async () => {
    try {
      await this.check();
    } finally {
      const interval = this.appConfig?.data?.biliUpload?.checkInterval ?? 600;
      setTimeout(this.checkLoop, interval * 1000);
    }
  };
}
