import { videoSubModel } from "../db/index.js";
import axios from "axios";
import { live } from "douyu-api";

import type { BaseVideoSub } from "../db/model/videoSub.js";

interface Options extends Omit<BaseVideoSub, "options"> {
  options: {
    danma: boolean;
    sendWebhook: boolean;
    quality: string;
  };
}

/**
 * 获取订阅列表
 */
function list() {
  return videoSubModel.list();
}

/**
 * 保存订阅
 */
export function add(data: Options) {
  const item = videoSubModel.query({
    platform: data.platform,
    subId: data.subId,
  });
  if (!item) {
    const options = JSON.stringify(data.options);

    return videoSubModel.add({
      name: data.name,
      platform: data.platform,
      subId: data.subId,
      options,
    });
  } else {
    throw new Error("已经存在");
  }
}

/**
 * 删除订阅
 */
export function remove(id: number) {
  return videoSubModel.delete(id);
}

/**
 * 更新订阅
 */
export function update(data: Options & { id: number }) {
  const options = JSON.stringify(data.options);
  return videoSubModel.update({
    id: data.id,
    name: data.name,
    platform: data.platform,
    subId: data.subId,
    options,
  });
}

/**
 * 解析url，查看是否支持
 * @param url
 */
export async function parse(url: string): Promise<Options> {
  const douyuMathReg = /https?:\/\/(?:.*?\.)?douyu.com\//;
  const huyaMathReg = /https?:\/\/(?:.*?\.)?huya.com\//;
  if (douyuMathReg.test(url)) {
    const res = await axios.get(url);
    const html = res.data;
    const matched = html.match(/\$ROOM\.room_id.?=(.*?);/);
    if (!matched) {
      throw new Error("解析失败，请检查练级");
    }
    const room_id = matched[1].trim();
    const roomInfo = await live.getRoomInfo(Number(room_id));
    return {
      name: roomInfo.room.nickname,
      subId: roomInfo.room.up_id,
      platform: "douyu",
      options: {
        danma: true,
        sendWebhook: false,
        quality: "highest",
      },
    };
  } else if (huyaMathReg.test(url)) {
    throw new Error("不支持的平台");

    // return "huya";
  } else {
    throw new Error("不支持的平台");
  }
}

export function check() {
  // 根据间隔时间检查，下载完成后将数据存到数据库
  // console.log("check");
  // const list = videoSubModel.list();
  // for (const item of list) {
  //   console.log(item);
  // }
}

export default {
  list,
  add,
  remove,
  update,
  parse,
  check,
};
