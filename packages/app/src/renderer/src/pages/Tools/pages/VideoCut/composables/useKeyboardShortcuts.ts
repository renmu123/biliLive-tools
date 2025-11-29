import { onActivated, onDeactivated, onUnmounted, type Ref } from "vue";
import hotkeys from "hotkeys-js";
import type Artplayer from "artplayer";

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
      // @ts-ignore
      if (event?.target?.tagName === "BUTTON") return;
      // @ts-ignore
      if (event?.target?.className.includes("artplayer")) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      event.stopPropagation();
      handlers.onTogglePlay();
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
