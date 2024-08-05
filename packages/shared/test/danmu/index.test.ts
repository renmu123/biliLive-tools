import { expect, describe, it } from "vitest";

import { paeseMetadata } from "../../src/danmu/index";

describe("paeseMetadata", () => {
  it("should parse BililiveRecorderRecordInfo from XML object", () => {
    const jObj = {
      i: {
        BililiveRecorderRecordInfo: {
          "@_roomid": "27183290",
          "@_shortid": "0",
          "@_name": "雪糕cheese",
          "@_title": "和塔宝妮妮一起玩恐怖游戏",
          "@_areanameparent": "虚拟主播",
          "@_areanamechild": "虚拟Gamer",
          "@_start_time": "2024-07-31T19:02:41.6685322+08:00",
        },
      },
    };

    const metadata = paeseMetadata(jObj);

    expect(metadata).toEqual({
      streamer: "雪糕cheese",
      room_id: "27183290",
      live_title: "和塔宝妮妮一起玩恐怖游戏",
      live_start_time: new Date(jObj.i.BililiveRecorderRecordInfo["@_start_time"]).getTime() / 1000,
    });
  });

  it("should parse metadata from XML object", () => {
    const jObj = {
      i: {
        metadata: {
          user_name: "JohnDoe",
          room_id: "123456",
          room_title: "Test Room",
          live_start_time: "2022-01-01T00:00:00Z",
        },
      },
    };

    const metadata = paeseMetadata(jObj);

    expect(metadata).toEqual({
      streamer: "JohnDoe",
      room_id: "123456",
      live_title: "Test Room",
      live_start_time: 1640995200,
    });
  });

  it("should handle missing metadata", () => {
    const jObj = {
      i: {},
    };

    const metadata = paeseMetadata(jObj);

    expect(metadata).toEqual({
      streamer: undefined,
      room_id: undefined,
      live_title: undefined,
      live_start_time: undefined,
    });
  });
});
