import { afterEach, describe, expect, it, vi } from "vitest";
import artplayerPluginSC, {
  getVisibleSuperChats,
} from "../src/renderer/src/components/Artplayer/artplayer-plugin-sc";
import type Artplayer from "artplayer";

afterEach(() => vi.unstubAllGlobals());

class FakeElement {
  children: FakeElement[] = [];
  dataset: Record<string, string> = {};
  className = "";
  textContent = "";

  setAttribute() {}
  remove() {}
  appendChild(child: FakeElement) {
    this.children.push(child);
  }
  append(...children: (FakeElement | string)[]) {
    for (const child of children) {
      if (child instanceof FakeElement) this.appendChild(child);
    }
  }
  replaceChildren(...children: FakeElement[]) {
    this.children = children;
  }
}

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

  it("hides immediately and restores SC at the current playback position", () => {
    vi.stubGlobal("document", { createElement: () => new FakeElement() });
    const host = new FakeElement();
    const art = {
      currentTime: 10,
      template: { $video: { parentElement: host } },
      on: vi.fn(),
      off: vi.fn(),
    } as unknown as Artplayer;

    const plugin = artplayerPluginSC({ data: [first], visible: false })(art);
    const overlay = host.children[0];
    expect(overlay.children).toHaveLength(0);

    plugin.setVisible(true);
    expect(overlay.children).toHaveLength(1);
    plugin.setVisible(false);
    expect(overlay.children).toHaveLength(0);

    plugin.destroy();
  });
});

describe("Artplayer SC price tiers", () => {
  it.each([
    [undefined, "blue"],
    [30, "blue"],
    [30.01, "cyan"],
    [50, "cyan"],
    [50.01, "yellow"],
    [100, "yellow"],
    [100.01, "orange"],
    [500, "orange"],
    [500.01, "red"],
    [1000, "red"],
    [1000.01, "dark-red"],
    [2000, "dark-red"],
    [2000.01, "dark-red"],
  ] as const)("renders price %s using the %s tier", (price, tier) => {
    vi.stubGlobal("document", { createElement: () => new FakeElement() });
    const host = new FakeElement();
    const art = {
      currentTime: 10,
      template: { $video: { parentElement: host } },
      on: vi.fn(),
      off: vi.fn(),
    } as unknown as Artplayer;
    const plugin = artplayerPluginSC({ data: [{ time: 5, text: "SC", price }] })(art);
    expect(host.children[0].children[0].dataset.tier).toBe(tier);
    plugin.destroy();
  });
});
