import { EventEmitter } from "node:events";
import log from "@biliLive-tools/shared/utils/log.js";

import type { Options } from "../../types/webhook.js";

/**
 * 匹配的事件对
 */
export interface MatchedEventPair {
  open: Options;
  close: Options;
}

/**
 * 事件数据
 */
interface EventData {
  open?: Options;
  close?: Options;
  updatedAt: number;
}

const DEFAULT_EVENT_TTL = 6 * 60 * 60 * 1000;
const DEFAULT_MAX_EVENTS = 1000;

/**
 * 事件缓冲管理器
 * 负责匹配 FileOpening 和 FileClosed 事件
 */
export class EventBufferManager extends EventEmitter<{
  process: [MatchedEventPair];
}> {
  // 事件缓冲区,同时保存 open 和 close 事件
  private events: Map<string, EventData> = new Map();

  constructor(
    private readonly eventTtl = DEFAULT_EVENT_TTL,
    private readonly maxEvents = DEFAULT_MAX_EVENTS,
  ) {
    super();
  }

  /**
   * 添加事件到缓冲区
   */
  addEvent(event: Options): void {
    // 只处理 FileOpening 和 FileClosed 事件
    if (event.event === "FileOpening") {
      this.handleOpenEvent(event);
    } else if (event.event === "FileClosed") {
      this.handleCloseEvent(event);
    } else {
      log.warn(`[EventBuffer] 未知事件类型: ${event.event}`);
    }
  }

  /**
   * 设置事件
   */
  private setEvent(event: Options, type: "open" | "close"): void {
    const filePath = event.filePath;

    this.pruneExpiredEvents();

    // 获取或创建事件数据
    let eventData = this.events.get(filePath);
    if (!eventData) {
      eventData = { updatedAt: Date.now() };
    }
    eventData.updatedAt = Date.now();

    // 存储事件
    if (type === "open") {
      eventData.open = event;
      log.debug(`[EventBuffer] 存储 FileOpening: ${filePath}`);
    } else {
      eventData.close = event;
      log.debug(`[EventBuffer] 存储 FileClosed: ${filePath}`);
    }

    // 更新到 Map 中
    this.events.set(filePath, eventData);
    this.enforceCapacity();

    this.emitPair();
  }

  private pruneExpiredEvents(): void {
    const expireBefore = Date.now() - this.eventTtl;
    for (const [filePath, eventData] of this.events) {
      if (eventData.updatedAt <= expireBefore) {
        this.events.delete(filePath);
      }
    }
  }

  private enforceCapacity(): void {
    while (this.events.size > this.maxEvents) {
      const oldestFilePath = this.events.keys().next().value;
      if (oldestFilePath === undefined) break;
      this.events.delete(oldestFilePath);
    }
  }

  /**
   * 处理 FileOpening 事件
   */
  private handleOpenEvent(event: Options): void {
    this.setEvent(event, "open");
  }

  /**
   * 处理 FileClosed 事件
   */
  private handleCloseEvent(event: Options): void {
    this.setEvent(event, "close");
  }

  /**
   * 发射事件对
   */
  private emitPair(): void {
    // 遍历所有事件数据,找出同时有 open 和 close 的
    for (const [filePath, eventData] of this.events.entries()) {
      if (eventData.open && eventData.close) {
        const pair: MatchedEventPair = {
          open: eventData.open,
          close: eventData.close,
        };

        this.emit("process", pair);
        // 标记为待删除
        this.events.delete(filePath);
      }
    }
  }

  /**
   * 清理所有缓冲区
   */
  clear(): void {
    this.events.clear();
    log.info("[EventBuffer] 所有缓冲区已清理");
  }
  /**
   * 获取缓冲区状态（用于调试）
   */
  getBufferStatus(): number {
    return this.events.size;
  }
}
