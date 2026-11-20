import { describe, expect, it } from "vitest";
import { getVisibleSuperChats } from "../src/renderer/src/components/Artplayer/artplayer-plugin-sc";

describe("Artplayer SC timing", () => {
  const first = { time: 5, text: "first" };
  const second = { time: 8, text: "second" };

  it("shows a message for 20 seconds and follows seeking", () => {
    expect(getVisibleSuperChats([first], [], 4.9, 20)).toEqual([]);
    expect(getVisibleSuperChats([first], [], 5, 20)).toEqual([first]);
    expect(getVisibleSuperChats([first], [], 24.9, 20)).toEqual([first]);
    expect(getVisibleSuperChats([first], [], 25, 20)).toEqual([]);
    expect(getVisibleSuperChats([first], [], 10, 20)).toEqual([first]);
  });

  it("puts live messages first and limits the overlay to three cards", () => {
    const third = { time: 9, text: "third" };
    const live = { time: 9, text: "live" };
    const result = getVisibleSuperChats([first, second, third], [live], 10, 20);
    expect(result).toEqual([live, third, second]);
  });
});
