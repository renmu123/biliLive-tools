# 简介

抖音弹幕录制

# 安装

node>=18

```sh
npm install douyin-danma-listener
```

# 使用

```javascript
import DouYinDanmaClient from "douyin-danma-listener";

// roomId并非是你看到的房间号，你可以在 https://live.douyin.com/webcast/room/web/enter/ 中找到id_str参数
const client = new DouYinDanmaClient("id_str");
client.on("chat", (message) => {
  console.log("收到弹幕:", message);
});
client.connect();
```

## 参数

配置项如下：

- `autoStart` (boolean): 是否自动开始连接，默认为 `false`
- `autoReconnect` (number): 自动重连次数，默认为 `10`
- `heartbeatInterval` (number): 心跳包发送间隔，单位为毫秒，默认为 `10000`
- `cookie` (string): 可选的 Cookie 字符串，某些直播间可能需要？
- `timeoutInterval` (number): 没有数据返回但`ws`未被主动关闭时超时后重新连接，单位为秒，默认`100`
- `reconnectInterval`： 重连等待时间

## 事件

只支持了部分事件的解析

- `open`: 连接成功时触发
- `close`: 连接关闭时触发
- `reconnect`: 重连时触发，参数为重连次数
- `heartbeat`: 心跳包发送时触发
- `error`: 发生错误时触发，参数为错误对象
- `chat`: 收到弹幕消息时触发，参数为弹幕消息对象
- `member`: 用户进入房间时触发，参数为用户信息对象
- `like`: 收到点赞消息时触发，参数为点赞消息对象
- `social`: 收到社交消息时触发，参数为社交消息对象
- `gift`: 收到礼物消息时触发，参数为礼物消息对象
- `roomUserSeq`: 收到房间用户序列消息时触发，参数为房间用户序列消息对象
- `roomStats`: 收到房间统计消息时触发，参数为房间统计消息对象
- `roomRank`: 收到房间排名消息时触发，参数为房间排名消息对象
- `message`: 收到任意消息时触发，参数为消息对象

# 协议

GPLV3
