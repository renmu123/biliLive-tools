import type { ParsedDanmu } from "@renderer/apis/common";

export type DanmakuKind = "text" | "gift" | "sc" | "guard";
export type SearchField = "all" | "content" | "user";

export interface PreviewItem {
  key: string;
  type: DanmakuKind;
  ts: number;
  timestamp?: number;
  user: string;
  content: string;
}

export const danmakuLabels: Record<DanmakuKind, string> = {
  text: "弹幕",
  gift: "礼物",
  sc: "SC",
  guard: "上舰",
};

const timestampSeconds = (value?: number | null): number | undefined => {
  const timestamp = Number(value);
  if (!Number.isFinite(timestamp) || timestamp <= 0) return undefined;
  return timestamp > 10_000_000_000 ? timestamp / 1000 : timestamp;
};

/** 与 VideoCut 使用相同的解析结果，补齐展示字段并合并四类记录。 */
export function createPreviewItems(data: ParsedDanmu): PreviewItem[] {
  const start = timestampSeconds(data.metadata?.video_start_time);
  const result: PreviewItem[] = [];
  const groups = {
    text: data.danmu,
    gift: data.gift,
    sc: data.sc,
    guard: data.guard,
  };
  for (const type of Object.keys(groups) as DanmakuKind[]) {
    for (const [index, item] of (groups[type] ?? []).entries()) {
      const ts = Number(item.ts);
      let content = String(item.text ?? "");
      if (item.type === "gift" || item.type === "guard") {
        const name = String(item.gift_name || danmakuLabels[type]);
        const count = Number(item.gift_count);
        content = `${name}${Number.isFinite(count) && count > 0 ? ` × ${count}` : ""}${content ? ` · ${content}` : ""}`;
      } else if (type === "sc") {
        const price = Number(item.gift_price);
        if (Number.isFinite(price) && price > 0) content = `¥${price} ${content}`.trim();
      }
      result.push({
        key: `${type}-${index}`,
        type,
        ts,
        timestamp:
          timestampSeconds(item.timestamp) ??
          (start !== undefined && Number.isFinite(ts) && ts >= 0 ? start + ts : undefined),
        user: String(item.user ?? ""),
        content,
      });
    }
  }
  // 无效时间排在末尾；相同时间保留原有顺序，不按内容去重。
  const sortTime = (item: PreviewItem) =>
    Number.isFinite(item.ts) && item.ts >= 0 ? item.ts : Infinity;
  return result.sort((a, b) => sortTime(a) - sortTime(b));
}

export function filterPreviewItems(
  items: PreviewItem[],
  type: DanmakuKind | "all",
  keyword: string,
  field: SearchField,
): PreviewItem[] {
  const query = keyword.trim().toLocaleLowerCase();
  if (type === "all" && !query) return items;
  return items.filter((item) => {
    if (type !== "all" && item.type !== type) return false;
    if (!query) return true;
    return (
      (field !== "user" && item.content.toLocaleLowerCase().includes(query)) ||
      (field !== "content" && item.user.toLocaleLowerCase().includes(query))
    );
  });
}
