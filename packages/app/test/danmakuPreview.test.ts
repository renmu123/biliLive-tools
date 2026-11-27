import { describe, expect, it } from "vitest";
import {
  createPreviewItems,
  filterPreviewItems,
} from "../src/renderer/src/pages/DanmakuPreview/danmaku";
import type { ParsedDanmu } from "../src/renderer/src/apis/common";

const fixture = (): ParsedDanmu => ({
  danmu: [
    { type: "text", ts: 20, user: "Alice", text: "Hello world" },
    { type: "text", ts: 0, text: "开场" },
    { type: "text", ts: 20, user: "Alice", text: "Hello world" },
  ],
  sc: [{ type: "sc", ts: 10, user: "Bob", text: "支持", gift_price: 30 }],
  gift: [{ type: "gift", ts: 15, user: "Carol", gift_name: "小心心", gift_count: 10 }],
  guard: [{ type: "guard", ts: 30, user: "Dave", gift_name: "舰长", gift_count: 1 }],
  metadata: { video_start_time: 1_700_000_000 },
});

describe("弹幕预览", () => {
  it("合并四类记录并按时间排序，保留重复弹幕及唯一列表 key", () => {
    const items = createPreviewItems(fixture());
    expect(items.map((item) => item.ts)).toEqual([0, 10, 15, 20, 20, 30]);
    expect(new Set(items.map((item) => item.key)).size).toBe(6);
    expect(items[1].content).toBe("¥30 支持");
    expect(items[2].content).toBe("小心心 × 10");
    expect(items[5].content).toBe("舰长 × 1");
    expect(items[0].user).toBe("");
  });

  it("组合类型和关键词，支持内容、用户名以及清除筛选", () => {
    const items = createPreviewItems(fixture());
    expect(filterPreviewItems(items, "all", " aLiCe ", "user")).toHaveLength(2);
    expect(filterPreviewItems(items, "all", "Alice", "content")).toHaveLength(0);
    expect(filterPreviewItems(items, "gift", "小心心", "all")).toHaveLength(1);
    expect(filterPreviewItems(items, "sc", "小心心", "all")).toHaveLength(0);
    expect(filterPreviewItems(items, "sc", "30", "content")).toHaveLength(1);
    expect(filterPreviewItems(items, "all", "", "all")).toBe(items);
  });

  it("优先使用记录实际时间，支持秒/毫秒时间戳及录制开始时间回退", () => {
    const data = fixture();
    data.danmu[0].timestamp = 1_700_001_000_000;
    data.sc[0].timestamp = 1_700_000_500;
    const items = createPreviewItems(data);
    expect(items[0].timestamp).toBe(1_700_000_000);
    expect(items[1].timestamp).toBe(1_700_000_500);
    expect(items[3].timestamp).toBe(1_700_001_000);
    data.metadata.video_start_time = null;
    expect(createPreviewItems(data)[0].timestamp).toBeUndefined();
  });

  it("兼容缺失字段和无效时间，未知时间排在最后", () => {
    const data = fixture();
    data.danmu.push({ type: "text", ts: NaN });
    data.gift[0].gift_count = undefined;
    data.guard[0].gift_name = undefined;
    const items = createPreviewItems(data);
    expect(items.at(-1)?.timestamp).toBeUndefined();
    expect(items.at(-1)?.content).toBe("");
    expect(items.find((item) => item.type === "gift")?.content).toBe("小心心");
    expect(items.find((item) => item.type === "guard")?.content).toBe("上舰 × 1");
    expect(
      createPreviewItems({ danmu: [], sc: [], metadata: {} } as unknown as ParsedDanmu),
    ).toEqual([]);
  });

  it("十万条弹幕的搜索覆盖整个列表，包括末尾记录", () => {
    const data = fixture();
    data.danmu = Array.from({ length: 100_000 }, (_, index) => ({
      type: "text",
      ts: index,
      text: `弹幕 ${index}`,
    }));
    const items = createPreviewItems(data);
    const matches = filterPreviewItems(items, "text", "弹幕 99999", "content");
    expect(matches).toHaveLength(1);
    expect(matches[0].ts).toBe(99999);
  });
});
