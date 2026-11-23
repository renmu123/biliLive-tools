import { describe, expect, it, vi } from "vitest";
import { createStreamLifecycle } from "../src/renderer/src/components/Artplayer/streamLifecycle";

function createPlayer(playing = false) {
  const pending: (() => void)[] = [];
  const player = {
    isDestroy: false,
    playing,
    type: "flv",
    switchUrl: vi.fn(() => {
      player.playing = false;
      return new Promise<void>((resolve) => pending.push(resolve));
    }),
    play: vi.fn(async () => {
      player.playing = true;
    }),
  };
  return { player, pending };
}

describe("player stream lifecycle", () => {
  it("closes an active FLV before a native source loads and resumes only after canplay", async () => {
    const streams = createStreamLifecycle();
    const { player, pending } = createPlayer(true);
    let activeRequests = 0;
    streams.replace(player, (onDispose) => {
      activeRequests += 1;
      onDispose(() => {
        activeRequests -= 1;
        // mpegts.destroy() also pauses and detaches the media element.
        player.playing = false;
      });
    });
    const switching = streams.switchUrl(player, "next.mp4", "");
    expect(activeRequests).toBe(0);
    expect(player.type).toBe("");
    expect(player.switchUrl).toHaveBeenCalledWith("next.mp4");
    expect(player.play).not.toHaveBeenCalled();

    pending[0]();
    await switching;
    expect(player.play).toHaveBeenCalledOnce();
  });

  it("keeps a paused source paused when switching", async () => {
    const streams = createStreamLifecycle();
    const { player, pending } = createPlayer();
    const switching = streams.switchUrl(player, "next.mp4", "");
    pending[0]();
    await switching;
    expect(player.play).not.toHaveBeenCalled();
  });

  it("does not resume an obsolete or destroyed source when loading finishes late", async () => {
    const streams = createStreamLifecycle();
    const { player, pending } = createPlayer(true);
    const first = streams.switchUrl(player, "first.mp4", "");
    player.playing = true;
    const second = streams.switchUrl(player, "second.mp4", "");
    pending[0]();
    await first;
    expect(player.play).not.toHaveBeenCalled();

    streams.destroy();
    pending[1]();
    await second;
    expect(player.play).not.toHaveBeenCalled();
  });

  it.each(["component", "player"])(
    "does not create a stream from a delayed customType callback after %s destruction",
    async (destroyedOwner) => {
      const streams = createStreamLifecycle();
      const { player } = createPlayer();
      const createStream = vi.fn();
      const deferredCallback = Promise.resolve().then(() => streams.replace(player, createStream));
      if (destroyedOwner === "component") streams.destroy();
      else player.isDestroy = true;

      await deferredCallback;
      expect(createStream).not.toHaveBeenCalled();
    },
  );

  it("releases each refreshed stream exactly once, including the last one on unmount", () => {
    const streams = createStreamLifecycle();
    const { player } = createPlayer();
    let activeRequests = 0;
    const disposers = Array.from({ length: 3 }, () => vi.fn(() => (activeRequests -= 1)));
    for (const dispose of disposers) {
      streams.replace(player, (onDispose) => {
        activeRequests += 1;
        onDispose(dispose);
      });
      expect(activeRequests).toBe(1);
    }

    streams.destroy();
    streams.destroy();
    expect(activeRequests).toBe(0);
    for (const dispose of disposers) expect(dispose).toHaveBeenCalledOnce();
  });

  it("releases a newly created stream when attachment or loading throws", () => {
    const streams = createStreamLifecycle();
    const { player } = createPlayer();
    const dispose = vi.fn();
    expect(() =>
      streams.replace(player, (onDispose) => {
        onDispose(dispose);
        throw new Error("MediaSource attachment failed");
      }),
    ).toThrow("MediaSource attachment failed");
    streams.destroy();
    expect(dispose).toHaveBeenCalledOnce();
  });
});
