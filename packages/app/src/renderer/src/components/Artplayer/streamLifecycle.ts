import type Artplayer from "artplayer";

type StreamOwner = Pick<Artplayer, "isDestroy">;
type SwitchablePlayer = Pick<Artplayer, "isDestroy" | "playing" | "type" | "switchUrl" | "play">;
type RegisterCleanup = (dispose: () => void) => void;

export function createStreamLifecycle() {
  let disposeStream: (() => void) | undefined;
  let destroyed = false;
  let sourceVersion = 0;

  const clear = () => {
    const dispose = disposeStream;
    disposeStream = undefined;
    dispose?.();
  };

  return {
    replace(art: StreamOwner, setup: (onDispose: RegisterCleanup) => void) {
      // Artplayer defers customType callbacks until the next event loop turn.
      if (destroyed || art.isDestroy) return;
      clear();
      try {
        setup((dispose) => {
          disposeStream = dispose;
        });
      } catch (error) {
        clear();
        throw error;
      }
    },
    async switchUrl(art: SwitchablePlayer, url: string, type: string) {
      if (destroyed || art.isDestroy) return;
      const version = ++sourceVersion;
      const wasPlaying = art.playing;
      // Native sources bypass customType, so release the previous stream here too.
      clear();
      art.type = type;
      await art.switchUrl(url);
      if (wasPlaying && version === sourceVersion && !destroyed && !art.isDestroy && !art.playing) {
        await art.play();
      }
    },
    destroy() {
      destroyed = true;
      sourceVersion += 1;
      clear();
    },
  };
}
