import { defineStore } from "pinia";
import { v4 as uuid } from "uuid";
import SrtParser from "srt-parser-2";

/**
 * 字幕数据项
 */
export interface SubtitleItem {
  /** 字幕唯一标识 */
  id: string;
  /** 关联的 segment ID，null 表示全局字幕 */
  sourceId: string | null;
  /** 完整的 SRT 格式内容 */
  content: string;
}

export const useSubtitles = defineStore("subtitles", () => {
  const items = ref<SubtitleItem[]>([]);

  // ==================== 查询方法 ====================

  /**
   * 获取所有全局字幕
   */
  const getGlobal = () => {
    return items.value.filter((s) => s.sourceId === null);
  };

  /**
   * 获取指定 segment 的字幕
   */
  const getBySourceId = (sourceId: string) => {
    return items.value.filter((s) => s.sourceId === sourceId);
  };

  /**
   * 根据 ID 获取字幕
   */
  const getById = (id: string) => {
    return items.value.find((s) => s.id === id);
  };

  // ==================== CRUD 方法 ====================

  /**
   * 添加字幕
   */
  const add = (subtitle: Omit<SubtitleItem, "id">) => {
    const newItem: SubtitleItem = {
      id: uuid(),
      ...subtitle,
    };
    items.value.push(newItem);
    return newItem;
  };

  /**
   * 更新字幕内容
   */
  const update = (id: string, content: string) => {
    const item = getById(id);
    if (item) {
      item.content = content;
    }
  };

  /**
   * 删除指定字幕
   */
  const remove = (id: string) => {
    items.value = items.value.filter((s) => s.id !== id);
  };

  /**
   * 删除指定 segment 的所有字幕
   */
  const removeBySourceId = (sourceId: string) => {
    items.value = items.value.filter((s) => s.sourceId !== sourceId);
  };

  /**
   * 清空所有字幕
   */
  const clear = () => {
    items.value = [];
  };

  /**
   * 为指定 segment 设置字幕（会先删除该 segment 的所有现有字幕）
   */
  const setForSegment = (segmentId: string, content: string) => {
    removeBySourceId(segmentId);
    return add({ sourceId: segmentId, content });
  };

  /**
   * 设置全局字幕（会先删除所有现有全局字幕）
   */
  const setGlobal = (content: string) => {
    // 删除所有全局字幕
    items.value = items.value.filter((s) => s.sourceId !== null);
    return add({ sourceId: null, content });
  };

  // ==================== 字幕合并逻辑 ====================

  /**
   * 获取指定 segments 的合并字幕（用于渲染和导出）
   * 首先加载全局字幕，然后用片段特定字幕替换对应时间段
   *
   * @param segments - segment 对象数组，需包含 id, start, end 字段
   * @returns SRT 格式的合并字幕字符串
   */
  const getCombinedForSegments = (segments: Array<{ id: string; start: number; end: number }>) => {
    const parser = new SrtParser();

    // 1. 以全局字幕为基础节点列表
    const globalSubtitles = getGlobal();
    const globalSubtitle = globalSubtitles.length > 0 ? globalSubtitles[0] : null;
    let mergedNodes: any[] = [];

    if (globalSubtitle) {
      try {
        mergedNodes = parser.fromSrt(globalSubtitle.content);
      } catch (error) {
        console.error("解析全局字幕失败:", error);
      }
    }

    // 2. 用片段字幕替换对应时段的全局字幕
    for (const segment of segments) {
      const segmentSubtitles = getBySourceId(segment.id);
      if (segmentSubtitles.length > 0) {
        // 移除该时段内的全局字幕
        mergedNodes = mergedNodes.filter(
          (node) => !(node.startSeconds >= segment.start && node.endSeconds <= segment.end),
        );
        // 添加片段字幕
        try {
          const nodes = parser.fromSrt(segmentSubtitles[0].content);
          const filteredNodes = nodes.filter(
            (node) => node.startSeconds >= segment.start && node.endSeconds <= segment.end,
          );
          mergedNodes.push(...filteredNodes);
        } catch (error) {
          console.error(`解析 segment ${segment.id} 的字幕失败:`, error);
        }
      }
    }

    // 3. 按开始时间排序
    mergedNodes.sort((a, b) => a.startSeconds - b.startSeconds);

    const allNodes = mergedNodes;

    // 生成最终 SRT
    if (allNodes.length === 0) {
      return "";
    }

    try {
      return parser.toSrt(allNodes);
    } catch (error) {
      console.error("生成合并字幕失败:", error);
      return "";
    }
  };

  return {
    items,
    // 查询
    getGlobal,
    getBySourceId,
    getById,
    // CRUD
    add,
    update,
    remove,
    removeBySourceId,
    clear,
    // 便捷方法
    setForSegment,
    setGlobal,
    // 合并逻辑
    getCombinedForSegments,
  };
});
