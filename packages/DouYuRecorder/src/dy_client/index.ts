/**
 * 本来打算直接用 douyudm 这个库，但有比较多的地方不符合我的需求，
 * 所以参考着这个库以及斗鱼的代码进行了重新实现。
 * reference: https://github.com/flxxyz/douyudm
 */
import WebSocket from "ws";
import mitt, { Emitter } from "mitt";
import { BufferCoder } from "./buffer_coder.js";
import { STT } from "./stt.js";

interface Message$Chat {
  type: "chatmsg";
  gid: string; // 弹幕组 id
  rid: string; // 房间 id
  uid: string; // 发送者 uid
  nn: string; // 发送者昵称
  txt: string; // 弹幕文本内容
  cid: string; // 弹幕唯一 ID
  level: string; // 用户等级
  gt: string; // 礼物头衔: 默认值 0（表示没有头衔）
  col: string; // 颜色: 默认值 0（表示默认颜色弹幕）
  ct: string; // 客户端类型: 默认值 0（表示 web 用户）
  rg: string; // 房间权限组: 默认值 1（表示普通权限用户）
  pg: string; // 平台权限组: 默认值 1（表示普通权限用户）
  dlv: string; // 酬勤等级: 默认值 0（表示没有酬勤）
  dc: string; // 酬勤数量: 默认值 0（表示没有酬勤数量）
  bdlv: string; // 最高酬勤等级: 默认值 0（表示全站都没有酬勤）
  ic: string; // 头像地址
  cst: string; // 弹幕发送时间
}

interface Message$Gift {
  type: "dgb";
  rid: string; // 房间 ID
  gid: string; // 弹幕分组 ID
  gfid: string; // 礼物 id
  gs: string; // 礼物显示样式
  uid: string; // 用户 id
  nn: string; // 用户昵称
  str: string; // 用户战斗力
  level: string; // 用户等级
  dw: string; // 主播体重
  gfcnt: string; // 礼物个数:默认值 1(表示 1 个礼物)
  hits: string; // 礼物连击次数:默认值 1(表示 1 连击)
  dlv: string; // 酬勤头衔:默认值 0(表示没有酬勤)
  dc: string; // 酬勤个数:默认值 0(表示没有酬勤数量)
  bdl: string; // 全站最高酬勤等级:默认值 0(表示全站都没有酬勤)
  rg: string; // 房间身份组:默认值 1(表示普通权限用户)
  pg: string; // 平台身份组:默认值 1(表示普通权限用户)
  rpid: string; // 红包 id:默认值 0(表示没有红包)
  slt: string; // 红包开启剩余时间:默认值 0(表示没有红包)
  elt: string; // 红包销毁剩余时间:默认值 0(表示没有红包)
  ic: string; // 头像地址
  bnn: string; // 用户牌子名？
  gfn: string; // 礼物名称
}

// 开通钻粉
interface Message$ODFBC {
  type: "odfbc";
  uid: string; // 用户 id
  rid: string; // 房间 ID
  nick: string; // 用户昵称
  price: string; // 价格，单位分
}

// 续费钻粉
interface Message$RNDFBC {
  type: "rndfbc";
  uid: string; // 用户 id
  rid: string; // 房间 ID
  nick: string; // 用户昵称
  price: string; // 价格，单位分
}

interface Message$CommChatPandora {
  type: "comm_chatmsg";
  rid: string; // 房间 ID
  vrid: string;
  btype: "pandora"; // voiceDanmu: 语音弹幕; pandora: 好像是开盒子礼物
  range: string;
  cprice: string; // 价格，单位分
  crealPrice: string; // 价格，单位分，不知道和 cprice 有什么区别
  cmgType: string;
  gbtemp: string;
  uid: string; // 用户 id
  cet: string; // 持续时间？
  now: string; // 发送时间
  csuperScreen: string;
  danmucr: string;
}

interface Message$CommChatVoiceDanmu {
  type: "comm_chatmsg";
  rid: string; // 房间 ID
  vrid: string;
  btype: "voiceDanmu"; // voiceDanmu: 语音弹幕; pandora: 好像是开盒子礼物
  range: string;
  cprice: string; // 价格，单位分
  crealPrice: string; // 价格，单位分，不知道和 cprice 有什么区别
  cmgType: string;
  gbtemp: string;
  uid: string; // 用户 id
  cet: string; // 持续时间？
  now: string; // 发送时间
  csuperScreen: string;
  danmucr: string;
  chatmsg: {
    nn: string; // 用户昵称
    bnn: string; // 粉丝牌
    level: string; // 粉丝牌等级
    brid: string; // 粉丝牌房间号
    ail: string; // 未知
    bl: string; // 未知
    type: "chatmsg"; // 弹幕类型
    rid: string; // 房间号
    gag: string; // 未知
    uid: string; // 用户 id
    txt: string; // 弹幕文本
    hidenick: string; // 是否匿名
    nc: string; // 未知
    ifs: string; // 未知
    ic: string; // 头像地址
    nl: string; // 未知
    tbid: string; // 未知
    tbl: string; // 未知
    tbvip: string; // 未知
  };
}

type Message$CommChat = Message$CommChatPandora | Message$CommChatVoiceDanmu;
export type Message =
  | Message$Chat
  | Message$Gift
  | Message$CommChat
  | Message$ODFBC
  | Message$RNDFBC;

export interface DYClient
  extends Emitter<{
    message: Message;
    error: unknown;
  }> {
  start: () => void;
  stop: () => void;
  send: (message: Record<string, unknown>) => void;
}

export function createDYClient(
  channelId: number,
  opts: {
    notAutoStart?: boolean;
  } = {},
): DYClient {
  let ws: WebSocket | null = null;
  let maxRetry = 10;
  let coder = new BufferCoder();
  let heartbeatTimer: NodeJS.Timer | null = null;

  const send = (message: Record<string, unknown>) => ws?.send(coder.encode(STT.serialize(message)));

  const sendLogin = () => send({ type: "loginreq", roomid: channelId });
  const sendJoinGroup = () => send({ type: "joingroup", rid: channelId, gid: -9999 });
  const sendHeartbeat = () => {
    if (ws?.readyState !== WebSocket.OPEN) {
      return;
    }
    send({ type: "mrkl" });
  };
  const sendLogout = () => send({ type: "logout" });

  const onOpen = () => {
    sendLogin();
    sendJoinGroup();
    heartbeatTimer = setInterval(sendHeartbeat, 45e3);
  };

  const onClose = () => {
    sendLogout();
    if (heartbeatTimer) {
      // @ts-ignore
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  };

  const onError = (err: unknown) => {
    if (maxRetry > 0) {
      maxRetry -= 1;
      stop();
      setTimeout(() => {
        start();
      }, 3e3);
    } else {
      client.emit("error", err);
      client.emit("error", new Error("重连次数过多，停止重连"));
    }
  };

  const onMessage = (message: unknown) => {
    if (typeof message != "object" || message == null || !("type" in message)) {
      console.warn("Unexpected message format", { message });
      return;
    }

    client.emit(
      "message",
      // TODO: 不太好验证 schema，先强制转了
      message as Message,
    );
  };

  const start = () => {
    if (ws != null) return;

    ws = new WebSocket(getRandomPortWSURL());
    coder = new BufferCoder();

    ws.binaryType = "arraybuffer";
    ws.on("open", onOpen);
    ws.on("error", onError);
    ws.on("close", onClose);
    ws.on("message", (data) => {
      if (!(data instanceof ArrayBuffer)) {
        throw new Error("Do not meet the types of ws.binaryType expected");
      }

      coder.decode(data, (messageText) => {
        try {
          const message = STT.deserialize(messageText);
          // @ts-ignore
          if (message?.type === "comm_chatmsg" && message?.chatmsg) {
            // @ts-ignore
            message.chatmsg = STT.deserialize(message?.chatmsg);
          }
          onMessage(message);
        } catch (error) {
          client.emit("error", error);
        }
      });
    });
  };

  const stop = () => {
    if (ws == null) return;

    onClose();
    ws = null;
  };

  if (!opts.notAutoStart) {
    start();
  }

  const client: DYClient = {
    // @ts-ignore
    ...mitt(),
    start,
    stop,
    send,
  };

  return client;
}

function getRandomPortWSURL(): string {
  const port = 8500 + ((min, max) => Math.floor(Math.random() * (max - min + 1) + min))(1, 6);
  return `wss://danmuproxy.douyu.com:${port}/`;
}
