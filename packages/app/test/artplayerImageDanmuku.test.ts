import { afterEach, describe, expect, it, vi } from "vitest";
import Artplayer from "artplayer";
import Danmuku from "../src/renderer/src/components/Artplayer/artplayer-plugin-danmuku/danmuku";

vi.mock(
  "../src/renderer/src/components/Artplayer/artplayer-plugin-danmuku/worker.js?worker&inline",
  () => ({ default: class {} }),
);

afterEach(() => vi.unstubAllGlobals());

class Element {
  style: Record<string, any> = {
    setProperty(name: string, value: string) {
      this[name] = value;
    },
  };
  dataset = {};
  children: Element[] = [];
  parent: Element | null = null;
  clientWidth = 90;
  clientHeight = 60;
  offsetTop = 0;
  private text = "";

  constructor(readonly tagName: string) {}

  get textContent() {
    return this.text;
  }
  set textContent(value: string) {
    this.replaceChildren();
    this.text = value;
  }
  replaceChildren(...children: Element[]) {
    this.children.forEach((child) => (child.parent = null));
    this.children = children;
    children.forEach((child) => (child.parent = this));
    this.text = "";
  }
  appendChild(child: Element) {
    this.children.push(child);
    child.parent = this;
  }
  replaceWith(child: Element) {
    if (!this.parent) return;
    const parent = this.parent;
    parent.children[parent.children.indexOf(this)] = child;
    child.parent = parent;
    this.parent = null;
  }
  getBoundingClientRect() {
    return { left: 0, top: 0 };
  }
}

function createPlayer() {
  let frame: (() => Promise<void>) | undefined;
  vi.stubGlobal("document", {
    createElement: (tag: string) => new Element(tag),
    createTextNode: (text: string) => Object.assign(new Element("#text"), { textContent: text }),
  });
  vi.stubGlobal("window", {
    requestAnimationFrame(callback) {
      frame = callback;
      return 1;
    },
  });
  const danmuku = Object.create(Danmuku.prototype);
  Object.assign(danmuku, {
    art: { currentTime: 5, playing: true, emit: vi.fn() },
    option: Danmuku.option,
    queue: [],
    states: { wait: [], ready: [], emit: [], stop: [] },
    index: 0,
    $refs: [],
    $player: Object.assign(new Element("div"), { clientWidth: 1280, clientHeight: 720 }),
    $danmuku: new Element("div"),
    utils: {
      clamp: (value, min, max) => Math.min(max, Math.max(min, value)),
      errorHandle: (valid, message) => {
        if (!valid) throw new Error(message);
      },
      setStyles: (element, styles) => Object.assign(element.style, styles),
    },
    validator: Artplayer.validator,
    isStop: false,
    isHide: false,
    postMessage: vi.fn(async () => ({ result: 10 })),
  });
  return {
    danmuku,
    async renderFrame() {
      danmuku.update();
      await frame!();
    },
  };
}

describe("Artplayer image danmuku", () => {
  it("replaces inline emoticons while preserving surrounding text and repeated images", async () => {
    const { danmuku, renderFrame } = createPlayer();
    await danmuku.emit({
      text: "你好[dog] <img src=x>[dog]",
      emoticons: { "[dog]": "https://example.com/dog.png" },
      time: 5,
    });
    await renderFrame();
    const children = danmuku.queue[0].$ref.children;
    expect(children.map((child) => child.tagName)).toEqual(["#text", "img", "#text", "img"]);
    expect(children[0].textContent).toBe("你好");
    expect(children[2].textContent).toBe(" <img src=x>");
    for (const index of [1, 3]) {
      expect(children[index].src).toBe("https://example.com/dog.png");
      expect(children[index].referrerPolicy).toBe("no-referrer");
      expect(children[index].alt).toBe("[dog]");
    }
  });

  it("treats emoticon names literally and ignores invalid image addresses", () => {
    const { danmuku } = createPlayer();
    const ref = new Element("div");
    danmuku.renderContent({
      $ref: ref,
      text: "[a+b] [bad] [empty]",
      emoticons: { "[a+b]": "https://example.com/emote.png", "[bad]": 123, "[empty]": "" },
    });
    expect(ref.children[0].tagName).toBe("img");
    expect(ref.children[1].textContent).toBe(" [bad] [empty]");
  });

  it("accepts image-only messages in emit and load and ignores empty comments", async () => {
    const { danmuku } = createPlayer();
    await danmuku.emit({ img: " https://example.com/emote.png ", time: 5 });
    await danmuku.load([{ img: "https://example.com/second.gif", time: 5 }]);
    await danmuku.emit({ text: "  ", img: "  " });
    await danmuku.emit({});
    expect(danmuku.queue).toHaveLength(2);
    expect(danmuku.queue[0]).toMatchObject({ text: "", img: "https://example.com/emote.png" });
    await expect(danmuku.emit({ img: 123 })).rejects.toThrow();
  });

  it.each([0, 1, 2])(
    "renders an image in mode %s before loading and uses its measured size for layout",
    async (mode) => {
      const { danmuku, renderFrame } = createPlayer();
      await danmuku.emit({ img: "https://example.com/emote.png", text: "点赞", mode, time: 5 });
      await renderFrame();
      const item = danmuku.queue[0];
      const image = item.$ref.children[0];
      expect(image.tagName).toBe("img");
      expect(image.src).toBe("https://example.com/emote.png");
      expect(image.referrerPolicy).toBe("no-referrer");
      expect(image.alt).toBe("点赞");
      expect(image.style.cssText).toContain("width: var(--art-danmuku-image-size, 60px)");
      expect(item.$ref.style["--art-danmuku-image-size"]).toBe("60px");
      expect(image.style.cssText).toContain("object-fit: contain");
      expect(item.$state).toBe("emit");
      expect(item.$ref.style).toMatchObject({ visibility: "visible", fontSize: "29px" });
      expect(danmuku.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({ mode, height: 60 }),
          antiOverlap: true,
        }),
      );
      if (mode === 0) expect(item.$ref.style.transform).toBe("translateX(-1370px)");
      else expect(item.$ref.style.marginLeft).toBe("-45px");
    },
  );

  it("shows fallback text on failure and keeps recycled nodes safe from old image callbacks", async () => {
    const { danmuku, renderFrame } = createPlayer();
    await danmuku.emit({ img: "https://example.com/broken.png", text: "表情", time: 5 });
    await renderFrame();
    const item = danmuku.queue[0];
    const ref = item.$ref;
    const image = ref.children[0];
    image.onerror();
    expect(ref.children[0].tagName).toBe("span");
    expect(ref.children[0].textContent).toBe("表情");
    expect(ref.children[0].style.cssText).toContain("width: var(--art-danmuku-image-size, 60px)");

    danmuku.makeWait(item);
    const recycled = danmuku.$ref;
    danmuku.renderContent({ $ref: recycled, text: "<img src=x onerror=alert(1)>" });
    image.onerror();
    expect(recycled).toBe(ref);
    expect(recycled.children).toHaveLength(0);
    expect(recycled.textContent).toBe("<img src=x onerror=alert(1)>");
  });

  it("resizes visible and paused image comments and failure placeholders", async () => {
    const { danmuku, renderFrame } = createPlayer();
    await danmuku.emit({ img: "https://example.com/emote.png", mode: 1, time: 5 });
    await renderFrame();
    const item = danmuku.queue[0];
    const ref = item.$ref;
    expect(ref.style["--art-danmuku-image-size"]).toBe("60px");
    ref.clientWidth = 110;
    danmuku.$player.clientHeight = 1080;
    danmuku.resize();
    expect(ref.style.fontSize).toBe("36px");
    expect(ref.style["--art-danmuku-image-size"]).toBe("75px");
    expect(ref.style.marginLeft).toBe("-55px");

    ref.children[0].onerror();
    danmuku.setState(item, "stop");
    danmuku.$player.clientWidth = 360;
    danmuku.$player.clientHeight = 640;
    ref.clientWidth = 70;
    danmuku.resize();
    expect(ref.children[0].tagName).toBe("span");
    expect(ref.children[0].style.cssText).toContain(
      "line-height: var(--art-danmuku-image-size, 60px)",
    );
    expect(ref.style["--art-danmuku-image-size"]).toBe("38px");
    expect(ref.style.marginLeft).toBe("-35px");
    danmuku.option = { ...danmuku.option, fontSize: 200 };
    danmuku.resize();
    expect(ref.style["--art-danmuku-image-size"]).toBe("75px");
  });
});
