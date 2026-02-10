import { nodeRegistry } from "./nodeRegistry.js";

// 导入所有内置节点
import { FileInputNode } from "./nodes/triggers/FileInputNode.js";
import { NotificationNode } from "./nodes/actions/NotificationNode.js";
import { BilibiliUploadNode } from "./nodes/actions/BilibiliUploadNode.js";
import { FfmpegProcessNode } from "./nodes/processors/FfmpegProcessNode.js";
import { DanmuConvertNode } from "./nodes/processors/DanmuConvertNode.js";
import { ParallelSplitNode } from "./nodes/utils/ParallelSplitNode.js";

/**
 * 注册所有内置节点
 */
export function registerBuiltinNodes(): void {
  nodeRegistry.registerMany([
    FileInputNode,
    NotificationNode,
    BilibiliUploadNode,
    FfmpegProcessNode,
    DanmuConvertNode,
    ParallelSplitNode,
  ]);
}
