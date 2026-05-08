/**
 * XML流式写入控制器，用于实时写入弹幕、礼物等信息到XML文件
 * 相比原有的json方案，这个实现每隔10秒就会写入数据，减少内存占用和数据丢失风险
 */
import fs from "node:fs";
import { XMLBuilder } from "fast-xml-parser";
import { pick } from "lodash-es";

import { Message } from "./common.js";

const METADATA_PLACEHOLDER = "<!--METADATA_PLACEHOLDER-->";
const XML_FILE_HEADER = `<?xml version="1.0" encoding="utf-8"?>\n<?xml-stylesheet type="text/xsl" href="#s"?>\n<i>\n${METADATA_PLACEHOLDER}\n<RecorderXmlStyle><z:stylesheet version="1.0" id="s" xml:id="s" xmlns:z="http://www.w3.org/1999/XSL/Transform"><z:output method="html"/><z:template match="/"><html><meta name="viewport" content="width=device-width"/><title>弹幕文件 <z:value-of select="/i/metadata/user_name/text()"/></title><style>body{margin:0}h1,h2,p,table{margin-left:5px}table{border-spacing:0}td,th{border:1px solid grey;padding:1px 5px}th{position:sticky;top:0;background:#4098de}tr:hover{background:#d9f4ff}div{overflow:auto;max-height:80vh;max-width:100vw;width:fit-content}</style><h1>弹幕XML文件</h1><p>本文件不支持在 IE 浏览器里预览，请使用 Chrome Firefox Edge 等浏览器。</p><p>文件用法参考文档 <a href="https://rec.danmuji.org/user/danmaku/">https://rec.danmuji.org/user/danmaku/</a></p><table><tr><td>房间号</td><td><z:value-of select="/i/metadata/room_id/text()"/></td></tr><tr><td>主播名</td><td><z:value-of select="/i/metadata/user_name/text()"/></td></tr><tr><td><a href="#d">弹幕</a></td><td>共<z:value-of select="count(/i/d)"/>条记录</td></tr><tr><td><a href="#guard">上船</a></td><td>共<z:value-of select="count(/i/guard)"/>条记录</td></tr><tr><td><a href="#sc">SC</a></td><td>共<z:value-of select="count(/i/sc)"/>条记录</td></tr><tr><td><a href="#gift">礼物</a></td><td>共<z:value-of select="count(/i/gift)"/>条记录</td></tr></table><h2 id="d">弹幕</h2><div id="dm"><table><tr><th>用户名</th><th>出现时间</th><th>用户ID</th><th>弹幕</th><th>参数</th></tr><z:for-each select="/i/d"><tr><td><z:value-of select="@user"/></td><td></td><td></td><td><z:value-of select="."/></td><td><z:value-of select="@p"/></td></tr></z:for-each></table></div><script>Array.from(document.querySelectorAll('#dm tr')).slice(1).map(t=>t.querySelectorAll('td')).forEach(t=>{let p=t[4].textContent.split(','),a=p[0];t[1].textContent=\`\u0024{(Math.floor(a/60/60)+'').padStart(2,0)}:\u0024{(Math.floor(a/60%60)+'').padStart(2,0)}:\u0024{(a%60).toFixed(3).padStart(6,0)}\`;t[2].innerHTML=\`&lt;a target=_blank rel="nofollow noreferrer" "&gt;\u0024{p[6]}&lt;/a&gt;\`})</script><h2 id="guard">舰长购买</h2><div><table><tr><th>用户名</th><th>用户ID</th><th>舰长等级</th><th>购买数量</th><th>出现时间</th></tr><z:for-each select="/i/guard"><tr><td><z:value-of select="@user"/></td><td><a rel="nofollow noreferrer"><z:attribute name="href"><z:text></z:text><z:value-of select="@uid" /></z:attribute><z:value-of select="@uid"/></a></td><td><z:value-of select="@level"/></td><td><z:value-of select="@count"/></td><td><z:value-of select="@ts"/></td></tr></z:for-each></table></div><h2 id="sc">SuperChat 醒目留言</h2><div><table><tr><th>用户名</th><th>用户ID</th><th>内容</th><th>显示时长</th><th>价格</th><th>出现时间</th></tr><z:for-each select="/i/sc"><tr><td><z:value-of select="@user"/></td><td><a rel="nofollow noreferrer"><z:attribute name="href"><z:text></z:text><z:value-of select="@uid" /></z:attribute><z:value-of select="@uid"/></a></td><td><z:value-of select="."/></td><td><z:value-of select="@time"/></td><td><z:value-of select="@price"/></td><td><z:value-of select="@ts"/></td></tr></z:for-each></table></div><h2 id="gift">礼物</h2><div><table><tr><th>用户名</th><th>用户ID</th><th>礼物名</th><th>礼物数量</th><th>出现时间</th></tr><z:for-each select="/i/gift"><tr><td><z:value-of select="@user"/></td><td><span rel="nofollow noreferrer"><z:attribute name="href"></z:attribute><z:value-of select="@uid"/></span></td><td><z:value-of select="@giftname"/></td><td><z:value-of select="@giftcount"/></td><td><z:value-of select="@ts"/></td></tr></z:for-each></table></div></html></z:template></z:stylesheet></RecorderXmlStyle>\n`;

export interface XmlStreamStats {
  danmaNum: number;
  uniqMember: number;
  scNum: number;
  guardNum: number;
}

export interface XmlStreamData {
  header: string;
  meta: {
    title?: string;
    recordStartTimestamp: number;
    recordStopTimestamp?: number;
    liveStartTimestamp?: number;
    downloaderArgs?: string[];
    platform?: string;
    user_name?: string;
    room_id?: string;
  };
  /** 缓存的消息，待写入到文件 */
  pendingMessages: Message[];
}

export interface XmlStreamController {
  /** 设计上来说，外部程序不应该能直接修改 data 上的东西 */
  readonly data: XmlStreamData;
  addMessage: (message: Message) => void;
  setMeta: (meta: Partial<XmlStreamData["meta"]>) => Promise<void>;
  flush: () => Promise<void>;
  getStats: () => XmlStreamStats;
}

export function createRecordExtraDataController(savePath: string): XmlStreamController {
  const data: XmlStreamData = {
    header: XML_FILE_HEADER,
    meta: {
      recordStartTimestamp: Date.now(),
    },
    pendingMessages: [],
  };
  let hasCompleted = false;
  let hasPersistedHeader = false;
  let danmaNum = 0;
  let scNum = 0;
  let guardNum = 0;
  const interactedUsers = new Set<string>();

  const getStats = (): XmlStreamStats => ({
    danmaNum,
    uniqMember: interactedUsers.size,
    scNum,
    guardNum,
  });

  const trackInteractedUser = (message: Message) => {
    const userName = message.sender?.name?.trim();
    if (!userName) return;
    interactedUsers.add(userName);
  };

  const initializeFile = async (content: string) => {
    // 这里有个假设，那就是第一次保存必然存在metatdata信息
    const initialContent = data.header.replace(
      METADATA_PLACEHOLDER,
      generateMetadataXml(data.meta),
    );
    await fs.promises.writeFile(savePath, initialContent + content);
    hasPersistedHeader = true;
  };

  const writeToFile = async (force = false): Promise<void> => {
    if (!force && data.pendingMessages.length === 0) {
      return Promise.resolve();
    }

    const messagesToWrite = [...data.pendingMessages];
    data.pendingMessages = [];

    try {
      const xmlContent = generateXmlContent(data.meta, messagesToWrite);
      if (!hasPersistedHeader) {
        await initializeFile(xmlContent);
      } else if (xmlContent) {
        await appendToXmlFile(savePath, xmlContent);
      }
    } catch (error) {
      console.error("写入XML文件失败:", error);
      data.pendingMessages = [...messagesToWrite, ...data.pendingMessages];
    }
  };

  // 每10秒写入一次数据
  const writeTimer = setInterval(() => {
    writeToFile();
  }, 10e3);

  const addMessage: XmlStreamController["addMessage"] = (message) => {
    if (hasCompleted) return;
    if (message.type === "comment") {
      danmaNum += 1;
    } else if (message.type === "super_chat") {
      scNum += 1;
    } else if (message.type === "guard") {
      guardNum += 1;
    }
    trackInteractedUser(message);
    data.pendingMessages.push(message);
  };

  const setMeta: XmlStreamController["setMeta"] = async (meta) => {
    if (hasCompleted) return;
    data.meta = {
      ...data.meta,
      ...meta,
    };
  };

  const flush: XmlStreamController["flush"] = async () => {
    if (hasCompleted) return;
    hasCompleted = true;
    writeTimer && clearInterval(writeTimer);

    try {
      await writeToFile(true);
      await appendToXmlFile(savePath, "</i>");
    } catch (error) {
      console.error("完成XML文件写入失败:", error);
    } finally {
      // 清理内存
      data.pendingMessages = [];
      interactedUsers.clear();
    }
  };

  return {
    data,
    addMessage,
    setMeta,
    flush,
    getStats,
  };
}

/**
 * 生成XML内容片段
 */
function generateXmlContent(metadata: XmlStreamData["meta"], messages: Message[]): string {
  const builder = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: "@@",
    format: true,
  });

  const comments = messages
    .filter((item) => item.type === "comment")
    .map((ele) => {
      const progress = Math.max((ele.timestamp - metadata.recordStartTimestamp) / 1000, 0);
      const attrs = {
        "@@p": "",
        "@@progress": progress,
        "@@mode": String(ele.mode ?? 1),
        "@@fontsize": String(25),
        "@@color": String(parseInt((ele.color || "#ffffff").replace("#", ""), 16)),
        "@@midHash": String(ele?.sender?.uid),
        "#text": String(ele?.text || ""),
        "@@ctime": String(ele.timestamp),
        "@@pool": String(0),
        "@@weight": String(0),
        "@@user": String(ele.sender?.name),
        "@@uid": String(ele?.sender?.uid),
        "@@timestamp": String(ele.timestamp),
      };
      attrs["@@p"] = [
        attrs["@@progress"],
        attrs["@@mode"],
        attrs["@@fontsize"],
        attrs["@@color"],
        attrs["@@ctime"],
        attrs["@@pool"],
        attrs["@@midHash"],
        attrs["@@uid"],
        attrs["@@weight"],
      ].join(",");
      return pick(attrs, ["@@p", "#text", "@@user", "@@uid", "@@timestamp"]);
    });

  const gifts = messages
    .filter((item) => item.type === "give_gift")
    .map((ele) => {
      const progress = Math.max((ele.timestamp - metadata.recordStartTimestamp) / 1000, 0);
      return {
        "@@ts": progress,
        "@@giftname": String(ele.name),
        "@@giftcount": String(ele.count),
        "@@price": String(ele.price * 1000),
        "@@user": String(ele.sender?.name),
        "@@uid": String(ele?.sender?.uid),
        "@@timestamp": String(ele.timestamp),
      };
    });

  const superChats = messages
    .filter((item) => item.type === "super_chat")
    .map((ele) => {
      const progress = Math.max((ele.timestamp - metadata.recordStartTimestamp) / 1000, 0);
      return {
        "@@ts": progress,
        "@@price": String(ele.price * 1000),
        "#text": String(ele.text),
        "@@user": String(ele.sender?.name),
        "@@uid": String(ele?.sender?.uid),
        "@@timestamp": String(ele.timestamp),
      };
    });

  const guardGift = messages
    .filter((item) => item.type === "guard")
    .map((ele) => {
      const progress = Math.max((ele.timestamp - metadata.recordStartTimestamp) / 1000, 0);
      return {
        "@@ts": progress,
        "@@price": String(ele.price * 1000),
        "@@giftname": String(ele.name),
        "@@giftcount": String(ele.count),
        "@@level": String(ele.level),
        "@@user": String(ele.sender?.name),
        "@@uid": String(ele?.sender?.uid),
        "@@timestamp": String(ele.timestamp),
      };
    });

  // 构建这一批消息的XML片段
  const fragment = {
    d: comments,
    gift: gifts,
    sc: superChats,
    guard: guardGift,
  };

  return builder.build(fragment);
}

/**
 * 追加内容到XML文件
 */
async function appendToXmlFile(filePath: string, content: string): Promise<void> {
  try {
    // 直接追加内容
    await fs.promises.appendFile(filePath, content);
  } catch (error) {
    console.error(`写入XML文件失败: ${filePath}`, error);
    throw error;
  }
}

function generateMetadataXml(metadata: XmlStreamData["meta"]): string {
  const builder = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: "@@",
    format: true,
  });

  return builder.build({
    metadata: {
      platform: metadata.platform,
      video_start_time: metadata.recordStartTimestamp,
      live_start_time: metadata.liveStartTimestamp,
      room_title: metadata.title,
      user_name: metadata.user_name,
      room_id: metadata.room_id,
    },
  });
}
