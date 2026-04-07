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
   * 优先使用片段字幕，没有则使用全局字幕
   *
   * @param segments - segment 对象数组，需包含 id, start, end 字段
   * @returns SRT 格式的合并字幕字符串
   */
  const getCombinedForSegments = (segments: Array<{ id: string; start: number; end: number }>) => {
    const parser = new SrtParser();
    const allNodes: any[] = [];

    // 获取全局字幕（如果有）
    const globalSubtitles = getGlobal();
    const globalSubtitle = globalSubtitles.length > 0 ? globalSubtitles[0] : null;
    let globalNodes: any[] = [];

    if (globalSubtitle) {
      try {
        globalNodes = parser.fromSrt(globalSubtitle.content);
      } catch (error) {
        console.error("解析全局字幕失败:", error);
      }
    }

    for (const segment of segments) {
      // 1. 优先查找片段字幕
      const segmentSubtitles = getBySourceId(segment.id);
      let subtitle = segmentSubtitles.length > 0 ? segmentSubtitles[0] : null;

      // 2. 没有片段字幕则使用全局字幕
      if (!subtitle && globalSubtitle) {
        subtitle = globalSubtitle;
      }

      if (!subtitle) continue;

      try {
        // 3. 解析 SRT
        const nodes = subtitle === globalSubtitle ? globalNodes : parser.fromSrt(subtitle.content);

        // 4. 过滤时间范围内的字幕
        const filteredNodes = nodes.filter((node) => {
          return node.startSeconds >= segment.start && node.endSeconds <= segment.end;
        });

        // 5. 时间偏移（转换为相对时间，相对于当前片段的开始时间）
        const offsetNodes = filteredNodes.map((node) => ({
          ...node,
          startSeconds: node.startSeconds - segment.start,
          endSeconds: node.endSeconds - segment.start,
        }));

        allNodes.push(...offsetNodes);
      } catch (error) {
        console.error(`解析 segment ${segment.id} 的字幕失败:`, error);
      }
    }

    // 6. 生成最终 SRT
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
