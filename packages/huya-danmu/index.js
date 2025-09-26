import ws from "ws";
import events from "events";
import to_arraybuffer from "to-arraybuffer";
import socks_agent from "socks-proxy-agent";

import { Taf, TafMx, HUYA, List } from "./lib.js";
import { md5, intToHexColor } from "./utils.js";

const heartbeat_interval = 60000;
const fresh_gift_interval = 60 * 60 * 1000;
const retry_interval = 2000;

class huya_danmu extends events {
  constructor(opt) {
    super();
    if (typeof opt === "string") {
      this._roomid = opt;
      this._max_retries = 10;
    } else if (typeof opt === "object") {
      this._roomid = opt.roomid;
      this._max_retries = opt.maxRetries || 10;
      this.set_proxy(opt.proxy);
    }
    this._gift_info = {};
    this._chat_list = new List();
    this._emitter = new events.EventEmitter();
    this._retry_count = 0;
    this._is_manual_stop = false;
  }

  set_proxy(proxy) {
    this._agent = new socks_agent(proxy);
  }

  // 重试辅助函数
  async _retry_async(asyncFn, retries = 3, baseDelay = 1000) {
    let lastError;
    for (let i = 0; i <= retries; i++) {
      try {
        return await asyncFn();
      } catch (error) {
        console.log(error);
        lastError = error;
        if (i === retries) {
          throw lastError;
        }
        // 使用递增延迟：基础延迟 * (重试次数 + 1)
        const currentDelay = baseDelay * (i + 1);
        await new Promise((resolve) => setTimeout(resolve, currentDelay));
      }
    }
  }

  async _get_chat_info() {
    const fetchData = async () => {
      const response = await fetch(`https://m.huya.com/${this._roomid}`, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 5.1.1; Nexus 6 Build/LYZ28E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.84 Mobile Safari/537.36",
        },
        agent: this._agent,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.text();
    };

    const body = await fetchData();

    const info = {};
    // @deprecated
    // let subsid_array = body.match(/var SUBSID = '(.*)';/)
    // let topsid_array = body.match(/var TOPSID = '(.*)';/)
    // let yyuid_array = body.match(/ayyuid: '(.*)',/)

    // data structure updated of huya new version, see test_data_20210626.html
    const subsid_array = body.match(/"lSubChannelId"\s*:\s*([^,]*)/);
    const topsid_array = body.match(/"lChannelId"\s*:\s*([^,]*)/);
    const yyuid_array = body.match(/"lUid"\s*:\s*([^,]*)/);

    if (!subsid_array || !topsid_array || !yyuid_array) throw new Error("Fail to parse raw info");
    info.subsid = subsid_array[1] === "" ? 0 : parseInt(subsid_array[1]);
    info.topsid = topsid_array[1] === "" ? 0 : parseInt(topsid_array[1]);
    info.yyuid = parseInt(yyuid_array[1]);
    return info;
  }

  async start() {
    if (this._starting) return;
    this._starting = true;
    await this._try_connect();
  }

  async _try_connect() {
    try {
      this._info = await this._retry_async(() => this._get_chat_info(), 10, 3000);
      if (!this._info) return this.emit("error", new Error("Fail to parse info"));
    } catch (error) {
      this.emit("error", error);
      this._starting = false;
      return;
    }

    this._main_user_id = new HUYA.UserId();
    this._main_user_id.lUid = this._info.yyuid;
    this._main_user_id.sHuYaUA = "webh5&1.0.0&websocket";
    this._start_ws();
  }

  _start_ws() {
    this._client = new ws("ws://ws.api.huya.com", {
      perMessageDeflate: false,
      agent: this._agent,
    });
    this._client.on("open", () => {
      this._get_gift_list();
      this._bind_ws_info();
      this._heartbeat();
      this._heartbeat_timer = setInterval(this._heartbeat.bind(this), heartbeat_interval);
      this._fresh_gift_list_timer = setInterval(
        this._get_gift_list.bind(this),
        fresh_gift_interval,
      );
      this.emit("connect");
    });
    this._client.on("error", (err) => {
      this.emit("error", err);
      if (!this._is_manual_stop && this._retry_count < this._max_retries) {
        this._retry_count++;
        this.emit("retry", { count: this._retry_count, max: this._max_retries });
        setTimeout(() => this._try_connect(), retry_interval);
      }
    });
    this._client.on("close", async () => {
      this._stop();
      if (!this._is_manual_stop && this._retry_count < this._max_retries) {
        this._retry_count++;
        this.emit("retry", { count: this._retry_count, max: this._max_retries });
        setTimeout(() => this._try_connect(), retry_interval);
      } else {
        this.emit("close");
      }
    });
    this._client.on("message", this._on_mes.bind(this));
    this._emitter.on("8006", (msg) => {
      const msg_obj = {
        type: "online",
        time: new Date().getTime(),
        count: msg.iAttendeeCount,
      };
      this.emit("message", msg_obj);
    });
    this._emitter.on("1400", (msg) => {
      const originColor = msg.tBulletFormat.iFontColor;
      let color = "#ffffff";
      if (originColor > 0) {
        color = intToHexColor(originColor);
      }

      const msg_obj = {
        type: "chat",
        time: new Date().getTime(),
        from: {
          name: msg.tUserInfo.sNickName,
          rid: msg.tUserInfo.lUid + "",
        },
        id: md5(JSON.stringify(msg)),
        content: msg.sContent,
        color: color,
      };
      const can_emit = this._chat_list.push(msg_obj.from.rid + msg_obj.content, msg_obj.time);
      can_emit && this.emit("message", msg_obj);
    });
    this._emitter.on("6501", (msg) => {
      if (msg.lPresenterUid != this._info.yyuid) return;
      const gift = this._gift_info[msg.iItemType + ""] || { name: "未知礼物", price: 0 };
      const id = md5(JSON.stringify(msg));
      const msg_obj = {
        type: "gift",
        time: new Date().getTime(),
        name: gift.name,
        from: {
          name: msg.sSenderNick,
          rid: msg.lSenderUid + "",
        },
        count: msg.iItemCount,
        price: msg.iItemCount * gift.price,
        earn: msg.iItemCount * gift.price,
        id: id,
      };
      this.emit("message", msg_obj);
    });
    this._emitter.on("getPropsList", (msg) => {
      msg.vPropsItemList.value.forEach((item) => {
        this._gift_info[item.iPropsId + ""] = {
          name: item.sPropsName,
          price: item.iPropsYb / 100,
        };
      });
    });
  }

  _get_gift_list() {
    const prop_req = new HUYA.GetPropsListReq();
    prop_req.tUserId = this._main_user_id;
    prop_req.iTemplateType = HUYA.EClientTemplateType.TPL_MIRROR;
    this._send_wup("PropsUIServer", "getPropsList", prop_req);
  }

  _bind_ws_info() {
    const ws_user_info = new HUYA.WSUserInfo();
    ws_user_info.lUid = this._info.yyuid;
    ws_user_info.bAnonymous = 0 == this._info.yyuid;
    ws_user_info.sGuid = this._main_user_id.sGuid;
    ws_user_info.sToken = "";
    ws_user_info.lTid = this._info.topsid;
    ws_user_info.lSid = this._info.subsid;
    ws_user_info.lGroupId = this._info.yyuid;
    ws_user_info.lGroupType = 3;
    let jce_stream = new Taf.JceOutputStream();
    ws_user_info.writeTo(jce_stream);
    const ws_command = new HUYA.WebSocketCommand();
    ws_command.iCmdType = HUYA.EWebSocketCommandType.EWSCmd_RegisterReq;
    ws_command.vData = jce_stream.getBinBuffer();
    jce_stream = new Taf.JceOutputStream();
    ws_command.writeTo(jce_stream);
    this._client.send(jce_stream.getBuffer());
  }

  _heartbeat() {
    if (this._client.readyState !== ws.OPEN) {
      return;
    }
    const heart_beat_req = new HUYA.UserHeartBeatReq();
    const user_id = new HUYA.UserId();
    user_id.sHuYaUA = "webh5&1.0.0&websocket";
    heart_beat_req.tId = user_id;
    heart_beat_req.lTid = this._info.topsid;
    heart_beat_req.lSid = this._info.subsid;
    heart_beat_req.lPid = this._info.yyuid;
    heart_beat_req.eLineType = 1;
    this._send_wup("onlineui", "OnUserHeartBeat", heart_beat_req);
  }

  _on_mes(data) {
    try {
      data = to_arraybuffer(data);
      let stream = new Taf.JceInputStream(data);
      const command = new HUYA.WebSocketCommand();
      command.readFrom(stream);
      switch (command.iCmdType) {
        case HUYA.EWebSocketCommandType.EWSCmd_WupRsp: {
          const wup = new Taf.Wup();
          wup.decode(command.vData.buffer);
          const map = new TafMx.WupMapping[wup.sFuncName]();
          wup.readStruct("tRsp", map, TafMx.WupMapping[wup.sFuncName]);
          this._emitter.emit(wup.sFuncName, map);
          break;
        }
        case HUYA.EWebSocketCommandType.EWSCmdS2C_MsgPushReq: {
          stream = new Taf.JceInputStream(command.vData.buffer);
          const msg = new HUYA.WSPushMessage();
          msg.readFrom(stream);
          stream = new Taf.JceInputStream(msg.sMsg.buffer);
          if (TafMx.UriMapping[msg.iUri]) {
            const map = new TafMx.UriMapping[msg.iUri]();
            map.readFrom(stream);
            this._emitter.emit(msg.iUri, map);
          }
          break;
        }
        default:
          break;
      }
    } catch (e) {
      this.emit("error", e);
    }
  }

  _send_wup(action, callback, req) {
    try {
      if (this._client.readyState !== ws.OPEN) return;

      const wup = new Taf.Wup();
      wup.setServant(action);
      wup.setFunc(callback);
      wup.writeStruct("tReq", req);
      const command = new HUYA.WebSocketCommand();
      command.iCmdType = HUYA.EWebSocketCommandType.EWSCmd_WupReq;
      command.vData = wup.encode();
      const stream = new Taf.JceOutputStream();
      command.writeTo(stream);
      this._client.send(stream.getBuffer());
    } catch (err) {
      this.emit("error", err);
    }
  }

  _stop() {
    this._starting = false;
    this._emitter.removeAllListeners();
    clearInterval(this._heartbeat_timer);
    clearInterval(this._fresh_gift_list_timer);
    this._client && this._client.terminate();
  }

  stop() {
    this._is_manual_stop = true;
    this.removeAllListeners();
    this._stop();
  }
}

export default huya_danmu;
