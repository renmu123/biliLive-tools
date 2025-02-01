import { TypedEmitter } from "tiny-typed-emitter";
import biliApi from "./bili.js";
import log from "../utils/log.js";

import type { AppConfig } from "../config.js";

type Item = Awaited<ReturnType<typeof biliApi.getArchives>>["arc_audits"][0];

interface Events {
  update: (aid: number, status: "completed" | "error", data: Item) => void;
}
export default class BiliCheckQueue extends TypedEmitter<Events> {
  list: {
    uid: number;
    aid: number;
    startTime: number;
    status: "pending" | "completed" | "error";
    data?: Item;
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

    const uids = this.list.map((item) => item.uid);
    for (const uid of uids) {
      const res = await biliApi.getArchives({ pn: 1, ps: 20 }, uid);
      for (const media of res.arc_audits) {
        if (media.stat.aid) {
          const item = this.list.find((data) => data.aid == media.Archive.aid);
          if (!item) continue;
          item.data = media;
          console.log("media2", media);

          if (media.Archive.state === 0) {
            item.status = "completed";
            this.emit("update", media.Archive.aid, "completed", media);
          } else if (media.Archive.state < 0) {
            if (media.Archive.state === -30 || media.Archive.state === -6) {
              // 审核中， 不要干啥操作
              continue;
            } else if (media.Archive.state === -50) {
              // 仅自己可见
              item.status = "completed";
              this.emit("update", media.Archive.aid, "completed", media);
            } else {
              item.status = "error";
              this.emit("update", media.Archive.aid, "error", media);
            }
          } else {
            log.warn("稿件状态未检测成功", media);
          }
        }
      }
    }
    console.log("this.list", this.list);
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
