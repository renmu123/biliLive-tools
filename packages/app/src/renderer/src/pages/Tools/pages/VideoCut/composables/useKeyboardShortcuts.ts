import { onActivated, onDeactivated, onUnmounted, type Ref } from "vue";
import hotkeys from "hotkeys-js";
import type Artplayer from "artplayer";

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];
const PLAYBACK_RATE_EPSILON = 0.001;

export interface KeyboardShortcutsHandlers {
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onExport: () => void;
  onTogglePlay: () => void;
  onBackward?: (amount: number) => void;
  onForward?: (amount: number) => void;
}

export function useKeyboardShortcuts(
  handlers: KeyboardShortcutsHandlers,
  videoInstance: Ref<Artplayer | null>,
) {
  const shouldIgnoreMediaShortcut = (event?: KeyboardEvent) => {
    const target = event?.target as HTMLElement | null;

    if (!target) return false;
    if (target.tagName === "BUTTON") return true;
    if (target.className?.includes?.("artplayer")) return true;
    if (target.isContentEditable) return true;

    return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
  };

  const updatePlaybackRate = (step: -1 | 1) => {
    if (!videoInstance.value?.url) return;

    const currentRate = videoInstance.value.playbackRate;
    const currentIndex = PLAYBACK_RATES.findIndex((rate) => {
      return Math.abs(rate - currentRate) < PLAYBACK_RATE_EPSILON;
    });
    let nextIndex = currentIndex;

    if (currentIndex === -1) {
      if (step > 0) {
        nextIndex = PLAYBACK_RATES.findIndex((rate) => currentRate < rate);
        if (nextIndex === -1) nextIndex = PLAYBACK_RATES.length - 1;
      } else {
        nextIndex = 0;
        for (let index = PLAYBACK_RATES.length - 1; index >= 0; index -= 1) {
          if (currentRate > PLAYBACK_RATES[index]) {
            nextIndex = index;
            break;
          }
        }
      }
    } else {
      nextIndex = Math.max(0, Math.min(PLAYBACK_RATES.length - 1, currentIndex + step));
    }

    videoInstance.value.playbackRate = PLAYBACK_RATES[nextIndex];
  };

  const registerShortcuts = () => {
    // 撤销
    hotkeys("ctrl+z", handlers.onUndo);

    // 重做
    hotkeys("ctrl+shift+z", handlers.onRedo);

    // 保存
    hotkeys("ctrl+s", (event) => {
      event.preventDefault();
      handlers.onSave();
    });

    // 另存为
    hotkeys("ctrl+shift+s", (event) => {
      event.preventDefault();
      handlers.onSaveAs();
    });

    // 导出
    hotkeys("ctrl+enter", handlers.onExport);

    // 播放/暂停
    hotkeys("space", (event) => {
      if (shouldIgnoreMediaShortcut(event)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      event.stopPropagation();
      handlers.onTogglePlay();
    });

    // 减速
    hotkeys("j", (event) => {
      if (shouldIgnoreMediaShortcut(event)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      event.stopPropagation();
      updatePlaybackRate(-1);
    });

    // 暂停
    hotkeys("k", (event) => {
      if (shouldIgnoreMediaShortcut(event)) return;
      if (!videoInstance.value?.url) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      event.stopPropagation();
      videoInstance.value.pause();
    });

    // 加速
    hotkeys("l", (event) => {
      if (shouldIgnoreMediaShortcut(event)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      event.stopPropagation();
      updatePlaybackRate(1);
    });

    // 慢速快进
    hotkeys("ctrl+left", () => {
      if (!videoInstance.value) return;
      videoInstance.value.backward = 1;
      handlers.onBackward?.(1);
    });

    // 慢速后退
    hotkeys("ctrl+right", () => {
      if (!videoInstance.value) return;
      videoInstance.value.forward = 1;
      handlers.onForward?.(1);
    });
  };

  const unregisterShortcuts = () => {
    hotkeys.unbind();
  };

  onActivated(() => {
    registerShortcuts();
  });

  onDeactivated(() => {
    unregisterShortcuts();
  });

  onUnmounted(() => {
    unregisterShortcuts();
  });

  return {
    registerShortcuts,
    unregisterShortcuts,
  };
}
