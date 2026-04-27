import { type Ref, watch } from "vue";
import { useSegmentStore } from "@renderer/stores";
import { generateDistinctColor } from "@renderer/utils";
import type Artplayer from "artplayer";
import type { Segment } from "@renderer/stores";

export function useChapter(videoInstance: Ref<Artplayer | null>) {
  let segmentEventHandler: ((data: any) => void) | null = null;

  const segmentToChapter = (segment: Segment) => ({
    start: segment.start,
    end: segment.end ?? 0,
    title: segment.name,
    color: generateDistinctColor(segment.index, segment.checked),
  });

  const updateAllChapters = () => {
    if (!videoInstance.value) return;
    // @ts-ignore
    const chapterPlugin = videoInstance.value?.artplayerPluginChapter as
      | { update: (opts: { chapters: any[] }) => void }
      | undefined;
    if (!chapterPlugin) return;

    const segmentStore = useSegmentStore();
    const chapters = segmentStore.cuts.map(segmentToChapter);
    console.log("Updating chapters:", chapters);
    chapterPlugin.update({ chapters });
  };

  const setupChapterSync = () => {
    if (!videoInstance.value) return;

    const segmentStore = useSegmentStore();

    // 初始化现有 segments
    updateAllChapters();

    // 监听 segment store 事件
    segmentEventHandler = () => {
      updateAllChapters();
    };

    segmentStore.on(segmentEventHandler);
  };

  const cleanupChapterSync = () => {
    if (segmentEventHandler) {
      const segmentStore = useSegmentStore();
      segmentStore.off(segmentEventHandler);
      segmentEventHandler = null;
    }
  };

  // 当 videoInstance 就绪时自动设置同步
  watch(
    videoInstance,
    (instance) => {
      if (instance) {
        // 等待 duration 可用后再同步
        instance.on("video:loadedmetadata", () => {
          setupChapterSync();
        });
        // 如果 duration 已经有值，直接同步
        if (instance.duration) {
          setupChapterSync();
        }
      } else {
        cleanupChapterSync();
      }
    },
    { immediate: true },
  );

  return {
    updateAllChapters,
    setupChapterSync,
    cleanupChapterSync,
  };
}
