/**
 * XML流式写入控制器，用于实时写入弹幕、礼物等信息到XML文件
 * 相比原有的json方案，这个实现每隔5秒就会写入数据，减少内存占用和数据丢失风险
 */
import fs from "node:fs";
import { XMLBuilder } from "fast-xml-parser";
import { pick } from "lodash-es";

import { Message } from "./common.js";
import { asyncThrottle } from "./utils.js";

export interface XmlStreamData {
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
}

export function createRecordExtraDataController(savePath: string): XmlStreamController {
  const data: XmlStreamData = {
    meta: {
      recordStartTimestamp: Date.now(),
    },
    pendingMessages: [],
  };
  let hasCompleted = false;
  let isWriting = false;
  let isInitialized = false;

  // 初始化文件
  const initializeFile = async () => {
    if (isInitialized) return;
    isInitialized = true;

    try {
      // 创建XML文件头，使用占位符预留metadata位置
      const header = `<?xml version="1.0" encoding="utf-8"?>\n<?xml-stylesheet type="text/xsl" href="#s"?>\n<i>\n<!--METADATA_PLACEHOLDER-->\n<RecorderXmlStyle><z:stylesheet version="1.0" id="s" xml:id="s" xmlns:z="http://www.w3.org/1999/XSL/Transform"><z:output method="html"/><z:template match="/"><html><meta name="viewport" content="width=device-width"/><title>弹幕文件 <z:value-of select="/i/metadata/user_name/text()"/></title><style>body{margin:0}h1,h2,p,table{margin-left:5px}table{border-spacing:0}td,th{border:1px solid grey;padding:1px 5px}th{position:sticky;top:0;background:#4098de}tr:hover{background:#d9f4ff}div{overflow:auto;max-height:80vh;max-width:100vw;width:fit-content}</style><h1>弹幕XML文件</h1><p>本文件不支持在 IE 浏览器里预览，请使用 Chrome Firefox Edge 等浏览器。</p><p>文件用法参考文档 <a href="https://rec.danmuji.org/user/danmaku/">https://rec.danmuji.org/user/danmaku/</a></p><table><tr><td>房间号</td><td><z:value-of select="/i/metadata/room_id/text()"/></td></tr><tr><td>主播名</td><td><z:value-of select="/i/metadata/user_name/text()"/></td></tr><tr><td><a href="#d">弹幕</a></td><td>共<z:value-of select="count(/i/d)"/>条记录</td></tr><tr><td><a href="#guard">上船</a></td><td>共<z:value-of select="count(/i/guard)"/>条记录</td></tr><tr><td><a href="#sc">SC</a></td><td>共<z:value-of select="count(/i/sc)"/>条记录</td></tr><tr><td><a href="#gift">礼物</a></td><td>共<z:value-of select="count(/i/gift)"/>条记录</td></tr></table><h2 id="d">弹幕</h2><div id="dm"><table><tr><th>用户名</th><th>出现时间</th><th>用户ID</th><th>弹幕</th><th>参数</th></tr><z:for-each select="/i/d"><tr><td><z:value-of select="@user"/></td><td></td><td></td><td><z:value-of select="."/></td><td><z:value-of select="@p"/></td></tr></z:for-each></table></div><script>Array.from(document.querySelectorAll('#dm tr')).slice(1).map(t=>t.querySelectorAll('td')).forEach(t=>{let p=t[4].textContent.split(','),a=p[0];t[1].textContent=\`\u0024{(Math.floor(a/60/60)+'').padStart(2,0)}:\u0024{(Math.floor(a/60%60)+'').padStart(2,0)}:\u0024{(a%60).toFixed(3).padStart(6,0)}\`;t[2].innerHTML=\`&lt;a target=_blank rel="nofollow noreferrer" "&gt;\u0024{p[6]}&lt;/a&gt;\`})</script><h2 id="guard">舰长购买</h2><div><table><tr><th>用户名</th><th>用户ID</th><th>舰长等级</th><th>购买数量</th><th>出现时间</th></tr><z:for-each select="/i/guard"><tr><td><z:value-of select="@user"/></td><td><a rel="nofollow noreferrer"><z:attribute name="href"><z:text></z:text><z:value-of select="@uid" /></z:attribute><z:value-of select="@uid"/></a></td><td><z:value-of select="@level"/></td><td><z:value-of select="@count"/></td><td><z:value-of select="@ts"/></td></tr></z:for-each></table></div><h2 id="sc">SuperChat 醒目留言</h2><div><table><tr><th>用户名</th><th>用户ID</th><th>内容</th><th>显示时长</th><th>价格</th><th>出现时间</th></tr><z:for-each select="/i/sc"><tr><td><z:value-of select="@user"/></td><td><a rel="nofollow noreferrer"><z:attribute name="href"><z:text></z:text><z:value-of select="@uid" /></z:attribute><z:value-of select="@uid"/></a></td><td><z:value-of select="."/></td><td><z:value-of select="@time"/></td><td><z:value-of select="@price"/></td><td><z:value-of select="@ts"/></td></tr></z:for-each></table></div><h2 id="gift">礼物</h2><div><table><tr><th>用户名</th><th>用户ID</th><th>礼物名</th><th>礼物数量</th><th>出现时间</th></tr><z:for-each select="/i/gift"><tr><td><z:value-of select="@user"/></td><td><span rel="nofollow noreferrer"><z:attribute name="href"></z:attribute><z:value-of select="@uid"/></span></td><td><z:value-of select="@giftname"/></td><td><z:value-of select="@giftcount"/></td><td><z:value-of select="@ts"/></td></tr></z:for-each></table></div></html></z:template></z:stylesheet></RecorderXmlStyle>\n`;
      await fs.promises.writeFile(savePath, header);
    } catch (error) {
      console.error("初始化XML文件失败:", error);
      isInitialized = false;
      throw error;
    }
  };

  // 每10秒写入一次数据
  const scheduleWrite = asyncThrottle(() => writeToFile(), 10e3, {
    immediateRunWhenEndOfDefer: true,
  });

  const writeToFile = async () => {
    if (isWriting || hasCompleted || data.pendingMessages.length === 0) {
      return;
    }

    // 确保文件已初始化
    await initializeFile();

    isWriting = true;
    try {
      // 获取待写入的消息
      const messagesToWrite = [...data.pendingMessages];
      data.pendingMessages = [];

      // 生成XML内容
      const xmlContent = generateXmlContent(data.meta, messagesToWrite);

      // 追加写入文件
      await appendToXmlFile(savePath, xmlContent);
    } catch (error) {
      console.error("写入XML文件失败:", error);
      // 如果写入失败，将消息重新加入队列
      data.pendingMessages = [...data.pendingMessages];
    } finally {
      isWriting = false;
    }
  };

  const addMessage: XmlStreamController["addMessage"] = (message) => {
    if (hasCompleted) return;
    // if (!isInitialized) return;
    data.pendingMessages.push(message);
    // 确保文件已初始化
    initializeFile().catch(console.error);
    scheduleWrite();
  };

  const setMeta: XmlStreamController["setMeta"] = async (meta) => {
    if (hasCompleted) return;
    data.meta = {
      ...data.meta,
      ...meta,
    };

    // 确保文件已初始化，然后立即更新文件中的metadata
    await initializeFile().catch(console.error);
    await updateMetadataInFile(savePath, data.meta).catch(console.error);
  };

  const flush: XmlStreamController["flush"] = async () => {
    if (hasCompleted) return;
    hasCompleted = true;
    scheduleWrite.cancel();
    await initializeFile().catch(console.error);
    // 写入剩余的数据
    if (data.pendingMessages.length > 0) {
      await writeToFile();
    }

    // 完成XML文件（添加结束标签等）
    await finalizeXmlFile(savePath);

    // 清理内存
    data.pendingMessages = [];
  };

  return {
    data,
    addMessage,
    setMeta,
    flush,
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
      const data = {
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
        "@@rawData": ele.rawData ? JSON.stringify(ele.rawData) : undefined,
      };
      data["@@p"] = [
        data["@@progress"],
        data["@@mode"],
        data["@@fontsize"],
        data["@@color"],
        data["@@ctime"],
        data["@@pool"],
        data["@@midHash"],
        data["@@uid"],
        data["@@weight"],
      ].join(",");
      return pick(data, ["@@p", "#text", "@@user", "@@uid", "@@timestamp"]);
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

/**
 * 更新XML文件中的metadata
 */
async function updateMetadataInFile(
  filePath: string,
  metadata: XmlStreamData["meta"],
): Promise<void> {
  try {
    const builder = new XMLBuilder({
      ignoreAttributes: false,
      attributeNamePrefix: "@@",
      format: true,
    });

    // 生成metadata XML
    const metadataXml = builder.build({
      metadata: {
        platform: metadata.platform,
        video_start_time: metadata.recordStartTimestamp,
        live_start_time: metadata.liveStartTimestamp,
        room_title: metadata.title,
        user_name: metadata.user_name,
        room_id: metadata.room_id,
      },
    });

    // 读取文件内容
    const content = await fs.promises.readFile(filePath, "utf-8");

    // 替换占位符为实际的metadata
    const updatedContent = content.replace("<!--METADATA_PLACEHOLDER-->", metadataXml);

    // 写回文件
    await fs.promises.writeFile(filePath, updatedContent);
  } catch (error) {
    console.error(`更新XML文件metadata失败: ${filePath}`, error);
    throw error;
  }
}

/**
 * 完成XML文件写入
 */
async function finalizeXmlFile(filePath: string): Promise<void> {
  try {
    // 读取文件内容
    const content = await fs.promises.readFile(filePath, "utf-8");

    // 添加结束标签
    const finalContent = content + "</i>";

    // 写回文件
    await fs.promises.writeFile(filePath, finalContent);
  } catch (error) {
    console.error(`完成XML文件写入失败: ${filePath}`, error);
    throw error;
  }
}
