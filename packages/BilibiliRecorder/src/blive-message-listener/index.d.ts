import { KeepLiveTCP, WS_OP, TCPOptions } from 'tiny-bilibili-ws';
import { KeepLiveWS } from 'tiny-bilibili-ws/browser';

declare enum GuardLevel {
    /** 无 */
    None = 0,
    /** 总督 */
    Zongdu = 1,
    /** 提督 */
    Tidu = 2,
    /** 舰长 */
    Jianzhang = 3
}

interface User {
    /** 用户uid */
    uid: number;
    /** 用户名 */
    uname: string;
    /** 用户头像 */
    face?: string;
    /** 用户牌子·*/
    badge?: {
        /** 是否点亮 */
        active: boolean;
        /** 牌子名称 */
        name: string;
        /** 牌子等级 */
        level: number;
        /** 牌子颜色 */
        color: string;
        /** 渐变色牌子，当用户长时间未消费，则会变为灰色，即 `#c0c0c0` */
        gradient?: [string, string, string];
        /** 主播信息 */
        anchor: {
            /** 主播uid */
            uid: number;
            /** 主播用户名 */
            uname: string;
            /** 主播房间号 */
            room_id: number;
            /** 是否为本直播间 */
            is_same_room?: boolean;
        };
    };
    /** 用户身份 */
    identity?: {
        /** 直播榜单排名 */
        rank: 0 | 1 | 2 | 3;
        /** 大航海信息 */
        guard_level: GuardLevel;
        /** 房管 */
        room_admin: boolean;
    };
}
interface Message<T> {
    /** 消息id */
    id: string;
    /** 接收消息的时间，毫秒时间戳 */
    timestamp: number;
    /** 消息类型 */
    type: string;
    /** 消息内容 */
    body: T;
    /** 原始消息内容 */
    raw: any;
}

interface AttentionChangeMsg {
    /** 直播间热度 */
    attention: number;
}
type Handler$i = {
    /** 直播间热度变化 */
    onAttentionChange: (msg: Message<AttentionChangeMsg>) => void;
};

interface LiveStartMsg {
    /** 开播平台 */
    live_platform: string;
    /** 房间号 */
    room_id: number;
}
type Handler$h = {
    /** 直播开始消息 */
    onLiveStart: (msg: Message<LiveStartMsg>) => void;
};

interface LiveEndMsg {
    /** 房间号 */
    room_id: number;
}
type Handler$g = {
    /** 直播结束消息 */
    onLiveEnd: (msg: Message<LiveEndMsg>) => void;
};

interface AnchorLotteryEndMsg {
    /** 天选抽奖id */
    id: number;
    /** 天选奖品信息 */
    award: {
        /** 奖品图片 */
        image: string;
        /** 奖品名称 */
        name: string;
        /** 是否为虚拟礼物奖品 */
        virtual: boolean;
    };
    /** 中奖用户列表 */
    winner: ({
        /** 用户uid */
        uid: number;
        /** 用户昵称 */
        uname: string;
        /** 用户头像 */
        face: number;
        /** 用户粉丝勋章等级 */
        level: number;
        /** 中奖数量 */
        num: number;
    })[];
}
type Handler$f = {
    /** 主播天选时刻抽奖结果 */
    onAnchorLotteryEnd: (msg: Message<AnchorLotteryEndMsg>) => void;
};

interface AnchorLotteryStartMsg {
    /** 天选抽奖id */
    id: number;
    /** 开始时间，秒级时间戳 */
    start_time: number;
    /** 持续时间，秒 */
    duration: number;
    /** 天选奖品信息 */
    award: {
        /** 奖品图片 */
        image: string;
        /** 奖品名称 */
        name: string;
        /** 奖品数量 */
        num: number;
        /** 是否为虚拟礼物奖品 */
        virtual: boolean;
        /** 虚拟奖品价值描述，实物奖品为空 */
        price_text: string;
    };
    /** 抽奖要求 */
    require: {
        /** 口令弹幕内容，无需弹幕为空字符串 */
        danmu: string;
        /** 需送主播礼物，无需送礼为空 */
        gift: {
            /** 礼物id */
            id: string;
            /** 礼物名称 */
            name: string;
            /** 礼物数量 */
            num: number;
            /** 单个礼物价值，除以1000为RMB */
            price: number;
        } | null;
        /** 抽奖参与人群要求，无要求为空 */
        user: {
            /** 参与人群限制（关注/粉丝勋章/大航海） */
            type: 'follow' | 'medal' | 'guard';
            /** 参与人群限制等级，如粉丝勋章等级 */
            value: number;
            /** 参与人群限制描述 */
            text: string;
        } | null;
    };
}
type Handler$e = {
    /** 主播天选时刻抽奖开启 */
    onAnchorLotteryStart: (msg: Message<AnchorLotteryStartMsg>) => void;
};

interface DanmuMsg {
    user: User;
    /** 弹幕内容 */
    content: string;
    /** 弹幕类型：1 2 3：普通弹幕；4：底部弹幕；5：顶部弹幕 */
    type: number;
    /** 弹幕颜色 */
    content_color: string;
    /** 发送时间，毫秒时间戳 */
    timestamp: number;
    /** 是否为天选抽奖弹幕 */
    lottery: boolean;
    /** 表情弹幕内容 */
    emoticon?: {
        id: string;
        height: number;
        width: number;
        url: string;
    };
    /** 弹幕内小表情映射，key为表情文字，如"[妙]" */
    in_message_emoticon?: Record<string, {
        id: string;
        emoticon_id: number;
        height: number;
        width: number;
        url: string;
        description: string;
    }>;
}
type Handler$d = {
    /** 收到普通弹幕消息 */
    onIncomeDanmu: (msg: Message<DanmuMsg>) => void;
};

interface GuardBuyMsg {
    user: User;
    /** 礼物id */
    gift_id: number;
    /** 礼物名称 */
    gift_name: string;
    /** 大航海信息 */
    guard_level: GuardLevel;
    /** 价格，RMB */
    price: number;
    /** 等级生效时间 */
    start_time: number;
    /** 等级过期时间 */
    end_time: number;
}
type Handler$c = {
    /** 舰长上舰消息 */
    onGuardBuy: (msg: Message<GuardBuyMsg>) => void;
};

type UserAction = 'enter' | 'follow' | 'share' | 'like' | 'unknown';
interface UserActionMsg {
    user: User;
    /** 事件类型 */
    action: UserAction;
    /** 事件时间，毫秒时间戳 */
    timestamp: number;
}
type Handler$b = {
    /** 用户进入、关注、分享、点赞直播间 */
    onUserAction: (msg: Message<UserActionMsg>) => void;
};

interface LikedChangeMsg {
    /** 直播间点赞人数 */
    count: number;
}
type Handler$a = {
    /** 累计点赞人数变化 */
    onLikedChange: (msg: Message<LikedChangeMsg>) => void;
};

interface RankCountChangeMsg {
    /** 高能用户人数 */
    count: number;
}
type Handler$9 = {
    /** 高能用户人数变化 */
    onRankCountChange: (msg: Message<RankCountChangeMsg>) => void;
};

interface RedPocketStartMsg {
    /** 红包抽奖id */
    id: number;
    /** 红包发送用户 */
    user: User;
    /** 开始时间，秒级时间戳 */
    start_time: number;
    /** 结束时间，秒级时间戳 */
    end_time: number;
    /** 持续时间，秒 */
    duration: number;
    /** 口令弹幕内容 */
    danmu: string;
    /** 红包奖品 */
    awards: RedPocketStartAward[];
    /** 奖品总价值，除以1000为RMB */
    total_price: number;
    /** 剩余等待的红包数 */
    wait_num: number;
}
interface RedPocketStartAward {
    /** 奖品id */
    gift_id: number;
    /** 奖品名称 */
    gift_name: string;
    /** 奖品图片 */
    gift_pic: string;
    /** 奖品数量 */
    num: number;
}
type Handler$8 = {
    /** 红包抽奖开始 */
    onRedPocketStart: (msg: Message<RedPocketStartMsg>) => void;
};

interface RedPocketEndMsg {
    /** 红包抽奖id */
    id: number;
    /** 中奖人数 */
    total_num: number;
    /** 中奖用户列表 */
    winner: ({
        /** 用户uid */
        uid: number;
        /** 用户昵称 */
        uname: string;
        /** 奖品id */
        award_id: number;
    } & RedPocketEndAward)[];
    /** 红包奖品列表 */
    awards: Record<string, RedPocketEndAward>;
}
interface RedPocketEndAward {
    /** 奖品类型，待补充 */
    award_type: number;
    /** 奖品名称 */
    award_name: string;
    /** 奖品图片 */
    award_pic: string;
    /** 奖品图片大图 */
    award_big_pic: string;
    /** 奖品价值，除以1000为RMB */
    award_price: number;
}
type Handler$7 = {
    /** 红包抽奖结果 */
    onRedPocketEnd: (msg: Message<RedPocketEndMsg>) => void;
};

interface RoomAdminSetMsg {
    /** 类型（设立、撤销） */
    type: 'set' | 'revoke';
    /** 用户uid */
    uid: number;
}
type Handler$6 = {
    /** 房间设立、撤销房管 */
    onRoomAdminSet: (msg: Message<RoomAdminSetMsg>) => void;
};

interface RoomInfoChangeMsg {
    /** 直播间标题 */
    title: string;
    /** 一级分区id */
    parent_area_id: number;
    /** 一级分区名 */
    parent_area_name: string;
    /** 二级分区id */
    area_id: number;
    /** 二级分区名 */
    area_name: string;
}
type Handler$5 = {
    /** 直播间信息修改 */
    onRoomInfoChange: (msg: Message<RoomInfoChangeMsg>) => void;
};

interface RoomSilentMsg {
    /** 禁言类型（按用户等级、勋章等级、全员、关闭） */
    type: 'level' | 'medal' | 'member' | 'off';
    /** 禁言等级 */
    level: number;
    /** 禁言结束时间，秒级时间戳，-1 为无限 */
    second: number;
}
type Handler$4 = {
    /** 房间开启、关闭全局禁言 */
    onRoomSilent: (msg: Message<RoomSilentMsg>) => void;
};

interface GiftMsg {
    user: User;
    /** 礼物id */
    gift_id: number;
    /** 礼物名称 */
    gift_name: string;
    /** 礼物价格类型 */
    coin_type: 'silver' | 'gold';
    /** 礼物价格，除以1000为RMB */
    price: number;
    /** 礼物数量 */
    amount: number;
    /** 送礼指向主播信息，多人直播间可指定要送给的主播，单人直播间为空 */
    send_master?: {
        uid: number;
        uname: string;
        room_id: number;
    };
    /** 礼物连击 */
    combo?: {
        /** 连击id */
        batch_id: string;
        /** 当前连击数（礼物总数） */
        combo_num: number;
        /** 连击礼物总价格，除以1000为RMB */
        total_price: number;
    };
}
type Handler$3 = {
    /** 收到礼物 */
    onGift: (msg: Message<GiftMsg>) => void;
};

interface SuperChatMsg {
    /** 消息id */
    id: number;
    /** 发送用户 */
    user: User;
    /** 弹幕内容 */
    content: string;
    /** 弹幕颜色 */
    content_color: string;
    /** 价格，RMB */
    price: number;
    /** 持续时间，秒 */
    time: number;
}
type Handler$2 = {
    /** 收到醒目留言 */
    onIncomeSuperChat: (msg: Message<SuperChatMsg>) => void;
};

interface RoomWarnMsg {
    /** 处理类型 */
    type: 'warning' | 'cut';
    /** 处理原因 */
    msg: string;
}
type Handler$1 = {
    /** 房间被超管警告、切断 */
    onRoomWarn: (msg: Message<RoomWarnMsg>) => void;
};

interface WatchedChangeMsg {
    /** 累计入场人数 */
    num: number;
    /** 累计入场人数，格式化输出 */
    text_small: string;
}
type Handler = {
    /** 累计看过人数变化 */
    onWatchedChange: (msg: Message<WatchedChangeMsg>) => void;
};

type MsgHandler = Partial<{
    /** 连接成功 */
    onOpen: () => void;
    /** 连接关闭 */
    onClose: () => void;
    /** 连接错误 */
    onError: (e: Error) => void;
    /** 开始监听消息 */
    onStartListen: () => void;
} & Handler$i & Handler$h & Handler$g & Handler$f & Handler$e & Handler$d & Handler$c & Handler$b & Handler$a & Handler$9 & Handler$8 & Handler$7 & Handler$6 & Handler$5 & Handler$4 & Handler$3 & Handler$2 & Handler$1 & Handler & {
    /** 原始消息 */
    raw: Record<'msg' | string, (msg: any) => void>;
}>;

interface MessageListener {
    /** tiny-bilibili-ws 实例 */
    live: KeepLiveTCP | KeepLiveWS;
    /** 直播间房间号 */
    roomId: number;
    /** 人气值 */
    online: number;
    /** 是否关闭 */
    closed: boolean;
    /** 关闭连接 */
    close: () => void;
    /** 刷新当前直播间热度 */
    getAttention: () => Promise<number>;
    /** 刷新当前直播间热度 */
    getOnline: () => Promise<number>;
    /** 重新连接 */
    reconnect: () => void;
    /** 发送心跳 */
    heartbeat: () => void;
    /** 发送消息 */
    send: (op: WS_OP, data?: Record<string, any> | string) => void;
}
interface MessageListenerTCPOptions {
    /**
     * tiny-bilibili-ws 连接选项
     *
     * @see https://github.com/starknt/tiny-bilibili-ws
     */
    ws?: TCPOptions;
}
declare const startListen: (roomId: number, handler: MsgHandler, options?: MessageListenerTCPOptions) => MessageListener;

export { type AnchorLotteryEndMsg, type AnchorLotteryStartMsg, type AttentionChangeMsg, type DanmuMsg, type GiftMsg, type GuardBuyMsg, GuardLevel, type LikedChangeMsg, type LiveEndMsg, type LiveStartMsg, type Message, type MessageListener, type MsgHandler, type RankCountChangeMsg, type RedPocketEndMsg, type RedPocketStartMsg, type RoomAdminSetMsg, type RoomInfoChangeMsg, type RoomSilentMsg, type RoomWarnMsg, type SuperChatMsg, type User, type UserActionMsg, type WatchedChangeMsg, startListen };
