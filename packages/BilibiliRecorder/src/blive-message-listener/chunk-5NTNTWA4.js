// src/parser/HEARTBEAT.ts
var parser = (data) => {
  return {
    attention: data
  };
};
var HEARTBEAT = {
  parser,
  eventName: "heartbeat",
  handlerName: "onAttentionChange"
};

// src/parser/LIVE.ts
var parser2 = (data) => {
  return {
    live_platform: data.live_platform,
    room_id: data.roomid
  };
};
var LIVE = {
  parser: parser2,
  eventName: "LIVE",
  handlerName: "onLiveStart"
};

// src/parser/PREPARING.ts
var parser3 = (data) => {
  return {
    room_id: parseInt(data.roomid)
  };
};
var PREPARING = {
  parser: parser3,
  eventName: "PREPARING",
  handlerName: "onLiveEnd"
};

// src/parser/ANCHOR_LOT_AWARD.ts
var parser4 = (data, roomId) => {
  const rawData = data.data;
  return {
    id: rawData.id,
    award: {
      image: rawData.award_image,
      name: rawData.award_name,
      virtual: rawData.award_type === 1
    },
    winner: rawData.award_users.map((user) => ({
      uid: user.uid,
      uname: user.uname,
      face: user.face,
      level: user.level,
      num: user.num
    }))
  };
};
var ANCHOR_LOT_AWARD = {
  parser: parser4,
  eventName: "ANCHOR_LOT_AWARD",
  handlerName: "onAnchorLotteryEnd"
};

// src/parser/ANCHOR_LOT_START.ts
var parser5 = (data, roomId) => {
  const rawData = data.data;
  return {
    id: rawData.id,
    start_time: rawData.current_time,
    duration: rawData.max_time,
    award: {
      image: rawData.award_image,
      name: rawData.award_name,
      num: rawData.award_num,
      virtual: rawData.award_type === 1,
      price_text: rawData.award_price_text || ""
    },
    require: {
      danmu: rawData.danmu || "",
      gift: rawData.gift_id ? {
        id: `${rawData.gift_id}`,
        name: rawData.gift_name,
        num: rawData.gift_num,
        price: rawData.gift_price
      } : null,
      user: rawData.require_type ? {
        type: ["follow", "medal", "guard"][rawData.require_type - 1],
        value: rawData.require_value,
        text: rawData.require_text
      } : null
    }
  };
};
var ANCHOR_LOT_START = {
  parser: parser5,
  eventName: "ANCHOR_LOT_START",
  handlerName: "onAnchorLotteryStart"
};

// src/utils/color.ts
var intToColorHex = (int) => {
  const hex = int.toString(16);
  return `#${hex.padStart(6, "0")}`;
};

// src/parser/DANMU_MSG.ts
var parser6 = (data, roomId) => {
  const rawData = data.info;
  const content = rawData[1];
  const shouldParseInMessageEmoticon = /\[.*?\]/.test(content);
  let inMessageEmoticon;
  if (shouldParseInMessageEmoticon) {
    const messageExtraInfo = JSON.parse(rawData[0][15].extra);
    const emoctionDict = {};
    if (messageExtraInfo.emots) {
      inMessageEmoticon = Object.keys(messageExtraInfo.emots).reduce((acc, key) => {
        const emoticon = messageExtraInfo.emots[key];
        acc[key] = {
          id: emoticon.emoticon_unique,
          emoticon_id: emoticon.emoticon_id,
          height: emoticon.height,
          width: emoticon.width,
          url: emoticon.url,
          description: emoticon.descript
        };
        return acc;
      }, emoctionDict);
    }
  }
  return {
    user: {
      uid: rawData[2][0],
      uname: rawData[2][1],
      badge: rawData[3].length ? {
        active: rawData[3][7] !== 12632256,
        name: rawData[3][1],
        level: rawData[3][0],
        color: intToColorHex(rawData[3][4]),
        gradient: [
          intToColorHex(rawData[3][7]),
          intToColorHex(rawData[3][8]),
          intToColorHex(rawData[3][9])
        ],
        anchor: {
          uid: rawData[3][12],
          uname: rawData[3][2],
          room_id: rawData[3][3],
          is_same_room: rawData[3][3] === roomId
        }
      } : void 0,
      identity: {
        rank: rawData[4][4],
        guard_level: rawData[7],
        room_admin: rawData[2][2] === 1
      }
    },
    content,
    type: rawData[0][1],
    content_color: intToColorHex(rawData[0][3]),
    timestamp: rawData[0][4],
    lottery: rawData[0][9] !== 0,
    emoticon: rawData[0][13]?.emoticon_unique ? {
      id: rawData[0][13].emoticon_unique,
      height: rawData[0][13].height,
      width: rawData[0][13].width,
      url: rawData[0][13].url
    } : void 0,
    in_message_emoticon: inMessageEmoticon
  };
};
var DANMU_MSG = {
  parser: parser6,
  eventName: "DANMU_MSG",
  handlerName: "onIncomeDanmu"
};

// src/parser/GUARD_BUY.ts
var parser7 = (data) => {
  const rawData = data.data;
  return {
    user: {
      uid: rawData.uid,
      uname: rawData.username
    },
    gift_id: rawData.gift_id,
    gift_name: rawData.gift_name,
    guard_level: rawData.guard_level,
    price: rawData.price,
    start_time: rawData.start_time,
    end_time: rawData.end_time
  };
};
var GUARD_BUY = {
  parser: parser7,
  eventName: "GUARD_BUY",
  handlerName: "onGuardBuy"
};

// src/parser/INTERACT_WORD_ENTRY_EFFECT.ts
var parserNormal = (data, roomId) => {
  const rawData = data.data;
  let actionType = "unknown";
  if (rawData.msg_type === 1) {
    actionType = "enter";
  } else if (rawData.msg_type === 2) {
    actionType = "follow";
  } else if (rawData.msg_type === 3) {
    actionType = "share";
  }
  return {
    user: {
      uid: rawData.uid,
      uname: rawData.uname,
      face: rawData?.face,
      badge: rawData.fans_medal?.target_id ? {
        active: !!rawData.fans_medal?.is_lighted,
        name: rawData.fans_medal?.medal_name,
        level: rawData.fans_medal?.medal_level,
        color: intToColorHex(rawData.fans_medal?.medal_color),
        gradient: [
          intToColorHex(rawData.fans_medal?.medal_color_start),
          intToColorHex(rawData.fans_medal?.medal_color_start),
          intToColorHex(rawData.fans_medal?.medal_color_end)
        ],
        anchor: {
          uid: rawData.fans_medal?.target_id,
          uname: "",
          room_id: rawData.fans_medal?.anchor_roomid,
          is_same_room: rawData.fans_medal?.anchor_roomid === roomId
        }
      } : void 0,
      identity: {
        rank: 0,
        guard_level: rawData.privilege_type,
        room_admin: false
      }
    },
    action: actionType,
    timestamp: Math.ceil(rawData.trigger_time / 1e6)
  };
};
var parserGuard = (data, roomId) => {
  const rawData = data.data;
  const uname = /<%(.*)%>/.exec(rawData.copy_writing)?.[1] || "";
  return {
    user: {
      uid: rawData.uid,
      uname,
      // 超长会有省略号
      identity: {
        rank: 0,
        guard_level: rawData.privilege_type,
        room_admin: false
      }
    },
    action: "enter",
    timestamp: Math.ceil(rawData.trigger_time / 1e6)
  };
};
var parserLike = (data, roomId) => {
  const rawData = data.data;
  return {
    user: {
      uid: rawData.uid,
      uname: rawData.uname,
      badge: rawData.fans_medal?.target_id ? {
        active: rawData.fans_medal?.is_lighted,
        name: rawData.fans_medal?.medal_name,
        level: rawData.fans_medal?.medal_level,
        color: intToColorHex(rawData.fans_medal?.medal_color),
        gradient: [
          intToColorHex(rawData.fans_medal?.medal_color_start),
          intToColorHex(rawData.fans_medal?.medal_color_start),
          intToColorHex(rawData.fans_medal?.medal_color_end)
        ],
        anchor: {
          uid: rawData.fans_medal?.target_id,
          uname: "",
          room_id: rawData.fans_medal?.anchor_roomid,
          // 返回为 0
          is_same_room: rawData.fans_medal?.anchor_roomid === roomId
        }
      } : void 0
    },
    action: "like",
    timestamp: Date.now()
  };
};
var parser8 = (data, roomId) => {
  const msgType = data.cmd;
  if (msgType === "ENTRY_EFFECT") {
    return parserGuard(data, roomId);
  }
  if (msgType === "LIKE_INFO_V3_CLICK") {
    return parserLike(data, roomId);
  }
  return parserNormal(data, roomId);
};
var INTERACT_WORD = {
  parser: parser8,
  eventName: "INTERACT_WORD",
  handlerName: "onUserAction"
};
var ENTRY_EFFECT = {
  parser: parser8,
  eventName: "ENTRY_EFFECT",
  handlerName: "onUserAction"
};
var LIKE_INFO_V3_CLICK = {
  parser: parser8,
  eventName: "LIKE_INFO_V3_CLICK",
  handlerName: "onUserAction"
};

// src/parser/LIKE_INFO_V3_UPDATE.ts
var parser9 = (data) => {
  const rawData = data.data;
  return {
    count: rawData.click_count
  };
};
var LIKE_INFO_V3_UPDATE = {
  parser: parser9,
  eventName: "LIKE_INFO_V3_UPDATE",
  handlerName: "onLikedChange"
};

// src/parser/ONLINE_RANK_COUNT.ts
var parser10 = (data) => {
  const rawData = data.data;
  return {
    count: rawData.count
  };
};
var ONLINE_RANK_COUNT = {
  parser: parser10,
  eventName: "ONLINE_RANK_COUNT",
  handlerName: "onRankCountChange"
};

// src/parser/POPULARITY_RED_POCKET_START.ts
var parser11 = (data, roomId) => {
  const rawData = data.data;
  return {
    id: rawData.lot_id,
    user: {
      uid: rawData.sender_uid,
      uname: rawData.sender_name,
      face: rawData.sender_face
    },
    start_time: rawData.start_time,
    end_time: rawData.end_time,
    duration: rawData.last_time,
    danmu: rawData.danmu,
    awards: rawData.awards,
    total_price: rawData.total_price,
    wait_num: rawData.wait_num
  };
};
var POPULARITY_RED_POCKET_START = {
  parser: parser11,
  eventName: "POPULARITY_RED_POCKET_START",
  handlerName: "onRedPocketStart"
};

// src/parser/POPULARITY_RED_POCKET_WINNER_LIST.ts
var parser12 = (data, roomId) => {
  const rawData = data.data;
  return {
    id: rawData.lot_id,
    total_num: rawData.total_num,
    winner: rawData.winner_info.map((item) => ({
      uid: item[0],
      uname: item[1],
      award_id: item[3],
      ...rawData.awards[item[3]]
    })),
    awards: rawData.awards
  };
};
var POPULARITY_RED_POCKET_WINNER_LIST = {
  parser: parser12,
  eventName: "POPULARITY_RED_POCKET_WINNER_LIST",
  handlerName: "onRedPocketEnd"
};

// src/parser/ROOM_ADMIN.ts
var parser13 = (data, roomId) => {
  const msgType = data.cmd;
  const rawData = data;
  return {
    type: msgType === "room_admin_entrance" ? "set" : "revoke",
    uid: rawData.uid
  };
};
var room_admin_entrance = {
  parser: parser13,
  eventName: "room_admin_entrance",
  handlerName: "onRoomAdminSet"
};
var ROOM_ADMIN_REVOKE = {
  parser: parser13,
  eventName: "ROOM_ADMIN_REVOKE",
  handlerName: "onRoomAdminSet"
};

// src/parser/ROOM_CHANGE.ts
var parser14 = (data) => {
  const rawData = data.data;
  return {
    title: rawData.title,
    parent_area_id: rawData.parent_area_id,
    parent_area_name: rawData.parent_area_name,
    area_id: rawData.area_id,
    area_name: rawData.area_name
  };
};
var ROOM_CHANGE = {
  parser: parser14,
  eventName: "ROOM_CHANGE",
  handlerName: "onRoomInfoChange"
};

// src/parser/ROOM_SILENT.ts
var parser15 = (data, roomId) => {
  const msgType = data.cmd;
  const rawData = data.data;
  return {
    type: msgType === "ROOM_SILENT_OFF" ? "off" : rawData.type,
    level: rawData.level,
    second: rawData.second
  };
};
var ROOM_SILENT_ON = {
  parser: parser15,
  eventName: "ROOM_SILENT_ON",
  handlerName: "onRoomSilent"
};
var ROOM_SILENT_OFF = {
  parser: parser15,
  eventName: "ROOM_SILENT_OFF",
  handlerName: "onRoomSilent"
};

// src/parser/SEND_GIFT.ts
var parser16 = (data) => {
  const rawData = data.data;
  return {
    user: {
      uid: rawData.uid,
      uname: rawData.uname,
      face: rawData.face,
      badge: rawData.medal_info?.medal_level ? {
        active: rawData.medal_info.is_lighted === 1,
        name: rawData.medal_info.medal_name,
        level: rawData.medal_info.medal_level,
        color: intToColorHex(rawData.medal_info.medal_color),
        gradient: [
          intToColorHex(rawData.medal_info.medal_color_start),
          intToColorHex(rawData.medal_info.medal_color_start),
          intToColorHex(rawData.medal_info.medal_color_end)
        ],
        anchor: {
          uid: rawData.medal_info.target_id,
          uname: rawData.medal_info.anchor_uname,
          // maybe ''
          room_id: rawData.medal_info.anchor_roomid
          // maybe 0
        }
      } : void 0,
      identity: {
        rank: 0,
        guard_level: rawData.guard_level,
        room_admin: false
      }
    },
    gift_id: rawData.giftId,
    gift_name: rawData.giftName,
    coin_type: rawData.coin_type,
    price: rawData.price,
    amount: rawData.num,
    send_master: rawData.send_master?.uid ? {
      uid: rawData.send_master.uid,
      uname: rawData.send_master.uname,
      room_id: rawData.send_master.room_id
    } : void 0,
    // 礼物连击：
    // data.combo_send 仅首次连击不为空；data.batch_combo_send 速度过快时可能为空；data.batch_combo_id 常驻存在
    combo: rawData.batch_combo_id ? {
      batch_id: rawData.batch_combo_id,
      combo_num: rawData.super_batch_gift_num,
      total_price: rawData.combo_total_coin
    } : void 0
  };
};
var SEND_GIFT = {
  parser: parser16,
  eventName: "SEND_GIFT",
  handlerName: "onGift"
};

// src/parser/SUPER_CHAT_MESSAGE.ts
var parser17 = (data, roomId) => {
  const rawData = data.data;
  const { medal_info, user_info } = data.data;
  return {
    id: rawData.id,
    user: {
      uid: rawData.uid,
      uname: rawData.user_info.uname,
      badge: medal_info ? {
        active: medal_info.is_lighted === 1,
        name: medal_info.medal_name,
        level: medal_info.medal_level,
        color: medal_info.medal_color,
        anchor: {
          uid: medal_info.target_id,
          uname: medal_info.anchor_uname,
          room_id: medal_info.anchor_roomid,
          is_same_room: medal_info.anchor_roomid === roomId
        }
      } : void 0,
      identity: {
        rank: 0,
        guard_level: user_info.guard_level || 0,
        room_admin: user_info.manager === 1
      }
    },
    content: rawData.message,
    content_color: rawData.background_price_color,
    price: rawData.price,
    time: rawData.time
  };
};
var SUPER_CHAT_MESSAGE = {
  parser: parser17,
  eventName: "SUPER_CHAT_MESSAGE",
  handlerName: "onIncomeSuperChat"
};

// src/parser/WARNING_CUT_OFF.ts
var parser18 = (data, roomId) => {
  const msgType = data.cmd;
  const rawData = data;
  return {
    type: msgType === "WARNING" ? "warning" : "cut",
    msg: rawData.msg
  };
};
var WARNING = {
  parser: parser18,
  eventName: "WARNING",
  handlerName: "onRoomWarn"
};
var CUT_OFF = {
  parser: parser18,
  eventName: "CUT_OFF",
  handlerName: "onRoomWarn"
};

// src/parser/WATCHED_CHANGE.ts
var parser19 = (data) => {
  const rawData = data.data;
  return {
    num: rawData.num,
    text_small: rawData.text_small
  };
};
var WATCHED_CHANGE = {
  parser: parser19,
  eventName: "WATCHED_CHANGE",
  handlerName: "onWatchedChange"
};

// src/utils/message.ts
var normalizeDanmu = (msgType, body, rawBody) => {
  const timestamp = Date.now();
  const randomText = Math.floor(Math.random() * 1e4).toString();
  const id = `${timestamp}:${msgType}:${body.user?.uid}:${randomText}`;
  return {
    id,
    timestamp,
    type: msgType,
    body,
    raw: rawBody
  };
};

// src/listener/index.ts
var listenAll = (instance, roomId, handler) => {
  if (!handler) return;
  const rawHandler = handler.raw || {};
  const rawHandlerNames = new Set(Object.keys(rawHandler));
  const isHandleRaw = rawHandlerNames.size > 0;
  if (handler.onOpen) {
    instance.on("open", () => {
      handler.onOpen?.();
    });
  }
  if (handler.onClose) {
    instance.on("close", () => {
      handler.onClose?.();
    });
  }
  if (handler.onStartListen) {
    instance.on("live", () => {
      handler.onStartListen?.();
    });
  }
  if (handler[HEARTBEAT.handlerName] || rawHandlerNames.has(HEARTBEAT.eventName)) {
    rawHandlerNames.delete(HEARTBEAT.eventName);
    instance.on(HEARTBEAT.eventName, (data) => {
      isHandleRaw && rawHandler[HEARTBEAT.eventName]?.(data);
      const parsedData = HEARTBEAT.parser(data);
      handler[HEARTBEAT.handlerName]?.(normalizeDanmu(HEARTBEAT.eventName, parsedData, data));
    });
  }
  if (handler[LIVE.handlerName] || rawHandlerNames.has(LIVE.eventName)) {
    rawHandlerNames.delete(LIVE.eventName);
    instance.on(LIVE.eventName, (data) => {
      isHandleRaw && rawHandler[LIVE.eventName]?.(data.data);
      const parsedData = LIVE.parser(data.data);
      handler[LIVE.handlerName]?.(normalizeDanmu(LIVE.eventName, parsedData, data.data));
    });
  }
  if (handler[PREPARING.handlerName] || rawHandlerNames.has(PREPARING.eventName)) {
    rawHandlerNames.delete(LIVE.eventName);
    instance.on(PREPARING.eventName, (data) => {
      isHandleRaw && rawHandler[PREPARING.eventName]?.(data.data);
      const parsedData = PREPARING.parser(data.data);
      handler[PREPARING.handlerName]?.(normalizeDanmu(PREPARING.eventName, parsedData, data.data));
    });
  }
  if (handler[ANCHOR_LOT_AWARD.handlerName] || rawHandlerNames.has(ANCHOR_LOT_AWARD.eventName)) {
    rawHandlerNames.delete(ANCHOR_LOT_AWARD.eventName);
    instance.on(ANCHOR_LOT_AWARD.eventName, (data) => {
      isHandleRaw && rawHandler[ANCHOR_LOT_AWARD.eventName]?.(data.data);
      const parsedData = ANCHOR_LOT_AWARD.parser(data.data, roomId);
      handler[ANCHOR_LOT_AWARD.handlerName]?.(normalizeDanmu(ANCHOR_LOT_AWARD.eventName, parsedData, data.data));
    });
  }
  if (handler[ANCHOR_LOT_START.handlerName] || rawHandlerNames.has(ANCHOR_LOT_START.eventName)) {
    rawHandlerNames.delete(ANCHOR_LOT_START.eventName);
    instance.on(ANCHOR_LOT_START.eventName, (data) => {
      isHandleRaw && rawHandler[ANCHOR_LOT_START.eventName]?.(data.data);
      const parsedData = ANCHOR_LOT_START.parser(data.data, roomId);
      handler[ANCHOR_LOT_START.handlerName]?.(normalizeDanmu(ANCHOR_LOT_START.eventName, parsedData, data.data));
    });
  }
  if (handler[DANMU_MSG.handlerName] || rawHandlerNames.has(DANMU_MSG.eventName)) {
    rawHandlerNames.delete(DANMU_MSG.eventName);
    instance.on(DANMU_MSG.eventName, (data) => {
      isHandleRaw && rawHandler[DANMU_MSG.eventName]?.(data.data);
      const parsedData = DANMU_MSG.parser(data.data, roomId);
      handler[DANMU_MSG.handlerName]?.(normalizeDanmu(DANMU_MSG.eventName, parsedData, data.data));
    });
  }
  if (handler[GUARD_BUY.handlerName] || rawHandlerNames.has(GUARD_BUY.eventName)) {
    rawHandlerNames.delete(GUARD_BUY.eventName);
    instance.on(GUARD_BUY.eventName, (data) => {
      isHandleRaw && rawHandler[GUARD_BUY.eventName]?.(data.data);
      const parsedData = GUARD_BUY.parser(data.data);
      handler[GUARD_BUY.handlerName]?.(normalizeDanmu(GUARD_BUY.eventName, parsedData, data.data));
    });
  }
  if (handler[INTERACT_WORD.handlerName] || handler[ENTRY_EFFECT.handlerName] || handler[LIKE_INFO_V3_CLICK.handlerName] || rawHandlerNames.has(INTERACT_WORD.eventName) || rawHandlerNames.has(ENTRY_EFFECT.eventName) || rawHandlerNames.has(LIKE_INFO_V3_CLICK.eventName)) {
    rawHandlerNames.delete(INTERACT_WORD.eventName);
    rawHandlerNames.delete(ENTRY_EFFECT.eventName);
    rawHandlerNames.delete(LIKE_INFO_V3_CLICK.eventName);
    instance.on(INTERACT_WORD.eventName, (data) => {
      isHandleRaw && rawHandler[INTERACT_WORD.eventName]?.(data.data);
      const parsedData = INTERACT_WORD.parser(data.data, roomId);
      handler[INTERACT_WORD.handlerName]?.(normalizeDanmu(INTERACT_WORD.eventName, parsedData, data.data));
    });
    instance.on(ENTRY_EFFECT.eventName, (data) => {
      isHandleRaw && rawHandler[ENTRY_EFFECT.eventName]?.(data.data);
      const parsedData = ENTRY_EFFECT.parser(data.data, roomId);
      handler[ENTRY_EFFECT.handlerName]?.(normalizeDanmu(ENTRY_EFFECT.eventName, parsedData, data.data));
    });
    instance.on(LIKE_INFO_V3_CLICK.eventName, (data) => {
      isHandleRaw && rawHandler[LIKE_INFO_V3_CLICK.eventName]?.(data.data);
      const parsedData = LIKE_INFO_V3_CLICK.parser(data.data, roomId);
      handler[LIKE_INFO_V3_CLICK.handlerName]?.(normalizeDanmu(LIKE_INFO_V3_CLICK.eventName, parsedData, data.data));
    });
  }
  if (handler[LIKE_INFO_V3_UPDATE.handlerName] || rawHandlerNames.has(LIKE_INFO_V3_UPDATE.eventName)) {
    rawHandlerNames.delete(LIKE_INFO_V3_UPDATE.eventName);
    instance.on(LIKE_INFO_V3_UPDATE.eventName, (data) => {
      isHandleRaw && rawHandler[LIKE_INFO_V3_UPDATE.eventName]?.(data.data);
      const parsedData = LIKE_INFO_V3_UPDATE.parser(data.data);
      handler[LIKE_INFO_V3_UPDATE.handlerName]?.(normalizeDanmu(LIKE_INFO_V3_UPDATE.eventName, parsedData, data.data));
    });
  }
  if (handler[ONLINE_RANK_COUNT.handlerName] || rawHandlerNames.has(ONLINE_RANK_COUNT.eventName)) {
    rawHandlerNames.delete(ONLINE_RANK_COUNT.eventName);
    instance.on(ONLINE_RANK_COUNT.eventName, (data) => {
      isHandleRaw && rawHandler[ONLINE_RANK_COUNT.eventName]?.(data.data);
      const parsedData = ONLINE_RANK_COUNT.parser(data.data);
      handler[ONLINE_RANK_COUNT.handlerName]?.(normalizeDanmu(ONLINE_RANK_COUNT.eventName, parsedData, data.data));
    });
  }
  if (handler[POPULARITY_RED_POCKET_START.handlerName] || rawHandlerNames.has(POPULARITY_RED_POCKET_START.eventName)) {
    rawHandlerNames.delete(POPULARITY_RED_POCKET_START.eventName);
    instance.on(POPULARITY_RED_POCKET_START.eventName, (data) => {
      isHandleRaw && rawHandler[POPULARITY_RED_POCKET_START.eventName]?.(data.data);
      const parsedData = POPULARITY_RED_POCKET_START.parser(data.data, roomId);
      handler[POPULARITY_RED_POCKET_START.handlerName]?.(normalizeDanmu(POPULARITY_RED_POCKET_START.eventName, parsedData, data.data));
    });
  }
  if (handler[POPULARITY_RED_POCKET_WINNER_LIST.handlerName] || rawHandlerNames.has(POPULARITY_RED_POCKET_WINNER_LIST.eventName)) {
    rawHandlerNames.delete(POPULARITY_RED_POCKET_WINNER_LIST.eventName);
    instance.on(POPULARITY_RED_POCKET_WINNER_LIST.eventName, (data) => {
      isHandleRaw && rawHandler[POPULARITY_RED_POCKET_WINNER_LIST.eventName]?.(data.data);
      const parsedData = POPULARITY_RED_POCKET_WINNER_LIST.parser(data.data, roomId);
      handler[POPULARITY_RED_POCKET_WINNER_LIST.handlerName]?.(normalizeDanmu(POPULARITY_RED_POCKET_WINNER_LIST.eventName, parsedData, data.data));
    });
  }
  if (handler[room_admin_entrance.handlerName] || handler[ROOM_ADMIN_REVOKE.handlerName] || rawHandlerNames.has(room_admin_entrance.eventName) || rawHandlerNames.has(ROOM_SILENT_OFF.eventName)) {
    rawHandlerNames.delete(room_admin_entrance.eventName);
    rawHandlerNames.delete(ROOM_ADMIN_REVOKE.eventName);
    instance.on(room_admin_entrance.eventName, (data) => {
      isHandleRaw && rawHandler[room_admin_entrance.eventName]?.(data.data);
      const parsedData = room_admin_entrance.parser(data.data, roomId);
      handler[room_admin_entrance.handlerName]?.(normalizeDanmu(room_admin_entrance.eventName, parsedData, data.data));
    });
    instance.on(ROOM_ADMIN_REVOKE.eventName, (data) => {
      isHandleRaw && rawHandler[ROOM_ADMIN_REVOKE.eventName]?.(data.data);
      const parsedData = ROOM_ADMIN_REVOKE.parser(data.data, roomId);
      handler[ROOM_ADMIN_REVOKE.handlerName]?.(normalizeDanmu(ROOM_ADMIN_REVOKE.eventName, parsedData, data.data));
    });
  }
  if (handler[ROOM_CHANGE.handlerName] || rawHandlerNames.has(ROOM_CHANGE.eventName)) {
    rawHandlerNames.delete(ROOM_CHANGE.eventName);
    instance.on(ROOM_CHANGE.eventName, (data) => {
      isHandleRaw && rawHandler[ROOM_CHANGE.eventName]?.(data.data);
      const parsedData = ROOM_CHANGE.parser(data.data);
      handler[ROOM_CHANGE.handlerName]?.(normalizeDanmu(ROOM_CHANGE.eventName, parsedData, data.data));
    });
  }
  if (handler[ROOM_SILENT_ON.handlerName] || handler[ROOM_SILENT_OFF.handlerName] || rawHandlerNames.has(ROOM_SILENT_ON.eventName) || rawHandlerNames.has(ROOM_SILENT_OFF.eventName)) {
    rawHandlerNames.delete(ROOM_SILENT_ON.eventName);
    rawHandlerNames.delete(ROOM_SILENT_OFF.eventName);
    instance.on(ROOM_SILENT_ON.eventName, (data) => {
      isHandleRaw && rawHandler[ROOM_SILENT_ON.eventName]?.(data.data);
      const parsedData = ROOM_SILENT_ON.parser(data.data, roomId);
      handler[ROOM_SILENT_ON.handlerName]?.(normalizeDanmu(ROOM_SILENT_ON.eventName, parsedData, data.data));
    });
    instance.on(ROOM_SILENT_OFF.eventName, (data) => {
      isHandleRaw && rawHandler[ROOM_SILENT_OFF.eventName]?.(data.data);
      const parsedData = ROOM_SILENT_OFF.parser(data.data, roomId);
      handler[ROOM_SILENT_OFF.handlerName]?.(normalizeDanmu(ROOM_SILENT_OFF.eventName, parsedData, data.data));
    });
  }
  if (handler[SEND_GIFT.handlerName] || rawHandlerNames.has(SEND_GIFT.eventName)) {
    rawHandlerNames.delete(SEND_GIFT.eventName);
    instance.on(SEND_GIFT.eventName, (data) => {
      isHandleRaw && rawHandler[SEND_GIFT.eventName]?.(data.data);
      const parsedData = SEND_GIFT.parser(data.data);
      handler[SEND_GIFT.handlerName]?.(normalizeDanmu(SEND_GIFT.eventName, parsedData, data.data));
    });
  }
  if (handler[SUPER_CHAT_MESSAGE.handlerName] || rawHandlerNames.has(SUPER_CHAT_MESSAGE.eventName)) {
    rawHandlerNames.delete(SUPER_CHAT_MESSAGE.eventName);
    instance.on(SUPER_CHAT_MESSAGE.eventName, (data) => {
      isHandleRaw && rawHandler[SUPER_CHAT_MESSAGE.eventName]?.(data.data);
      const parsedData = SUPER_CHAT_MESSAGE.parser(data.data, roomId);
      handler[SUPER_CHAT_MESSAGE.handlerName]?.(normalizeDanmu(SUPER_CHAT_MESSAGE.eventName, parsedData, data.data));
    });
  }
  if (handler[WARNING.handlerName] || handler[CUT_OFF.handlerName] || rawHandlerNames.has(WARNING.eventName) || rawHandlerNames.has(CUT_OFF.eventName)) {
    rawHandlerNames.delete(WARNING.eventName);
    rawHandlerNames.delete(CUT_OFF.eventName);
    instance.on(WARNING.eventName, (data) => {
      isHandleRaw && rawHandler[WARNING.eventName]?.(data.data);
      const parsedData = WARNING.parser(data.data, roomId);
      handler[WARNING.handlerName]?.(normalizeDanmu(WARNING.eventName, parsedData, data.data));
    });
    instance.on(CUT_OFF.eventName, (data) => {
      isHandleRaw && rawHandler[CUT_OFF.eventName]?.(data.data);
      const parsedData = CUT_OFF.parser(data.data, roomId);
      handler[CUT_OFF.handlerName]?.(normalizeDanmu(CUT_OFF.eventName, parsedData, data.data));
    });
  }
  if (handler[WATCHED_CHANGE.handlerName] || rawHandlerNames.has(WATCHED_CHANGE.eventName)) {
    rawHandlerNames.delete(WATCHED_CHANGE.eventName);
    instance.on(WATCHED_CHANGE.eventName, (data) => {
      isHandleRaw && rawHandler[WATCHED_CHANGE.eventName]?.(data.data);
      const parsedData = WATCHED_CHANGE.parser(data.data);
      handler[WATCHED_CHANGE.handlerName]?.(normalizeDanmu(WATCHED_CHANGE.eventName, parsedData, data.data));
    });
  }
  for (const eventName of rawHandlerNames) {
    instance.on(eventName, (data) => {
      rawHandler[eventName]?.(data.data);
    });
  }
};

export {
  listenAll
};
