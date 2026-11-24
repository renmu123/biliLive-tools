import { describe, expect, it, vi } from "vitest";
import { attachFlvSeekRecovery } from "../src/renderer/src/components/Artplayer/flvSeekRecovery";

class Media extends EventTarget {
  currentTime = 600;
  readyState = 1;
  paused = false;
  ranges: [number, number][] = [];
  play = vi.fn();

  get buffered(): TimeRanges {
    return {
      length: this.ranges.length,
      start: (index) => this.ranges[index][0],
      end: (index) => this.ranges[index][1],
    };
  }
}

describe("FLV seek recovery", () => {
  it("recovers once both tracks become playable after a seek without another drag", () => {
    const video = new Media();
    attachFlvSeekRecovery(video);
    video.dispatchEvent(new Event("waiting"));
    expect(video.currentTime).toBe(600);

    video.ranges = [[600.05, 630]];
    video.dispatchEvent(new Event("progress"));
    expect(video.currentTime).toBeCloseTo(600.051, 6);
    video.dispatchEvent(new Event("progress"));
    expect(video.currentTime).toBeCloseTo(600.051, 6);
    expect(video.play).not.toHaveBeenCalled();
  });

  it("can recover subsequent forward and backward seeks", () => {
    const video = new Media();
    attachFlvSeekRecovery(video);
    for (const target of [600, 900, 120]) {
      video.currentTime = target;
      video.ranges = [[target + 0.05, target + 30]];
      video.dispatchEvent(new Event("waiting"));
      expect(video.currentTime).toBeCloseTo(target + 0.051, 6);
    }
  });

  it("preserves an intentional pause when correcting a seek", () => {
    const video = new Media();
    video.paused = true;
    video.ranges = [[600.05, 630]];
    attachFlvSeekRecovery(video);
    video.dispatchEvent(new Event("progress"));
    expect(video.currentTime).toBeGreaterThan(600.05);
    expect(video.paused).toBe(true);
    expect(video.play).not.toHaveBeenCalled();
  });

  it.each<{ reason: string; ranges: [number, number][] }>([
    { reason: "large gap", ranges: [[601, 630]] },
    { reason: "gap just over the limit", ranges: [[600.251, 630]] },
    { reason: "position already buffered", ranges: [[590, 620]] },
    { reason: "only older data", ranges: [[580, 590]] },
    {
      reason: "position inside an earlier range",
      ranges: [
        [599, 601],
        [601.1, 630],
      ],
    },
    { reason: "no data yet", ranges: [] },
  ])("does not adjust the position for $reason", ({ ranges }) => {
    const video = new Media();
    video.ranges = ranges;
    attachFlvSeekRecovery(video);
    video.dispatchEvent(new Event("progress"));
    expect(video.currentTime).toBe(600);
  });

  it("handles the gap limit and stays inside a very short playable range", () => {
    const video = new Media();
    video.ranges = [
      [590, 599],
      [600.25, 600.2505],
    ];
    attachFlvSeekRecovery(video);
    video.dispatchEvent(new Event("progress"));
    expect(video.currentTime).toBeGreaterThan(600.25);
    expect(video.currentTime).toBeLessThan(600.2505);
  });

  it("does not intervene while the current position has playable data", () => {
    const video = new Media();
    video.readyState = 4;
    video.ranges = [[600.05, 630]];
    attachFlvSeekRecovery(video);
    video.dispatchEvent(new Event("progress"));
    expect(video.currentTime).toBe(600);
  });

  it("stops correcting positions after switching away from the FLV", () => {
    const video = new Media();
    const dispose = attachFlvSeekRecovery(video);
    dispose();
    dispose();
    video.ranges = [[600.05, 630]];
    video.dispatchEvent(new Event("waiting"));
    video.dispatchEvent(new Event("progress"));
    expect(video.currentTime).toBe(600);
  });
});
