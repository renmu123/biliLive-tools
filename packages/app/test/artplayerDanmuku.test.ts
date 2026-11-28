import { describe, expect, it, vi } from "vitest";
import Danmuku from "../src/renderer/src/components/Artplayer/artplayer-plugin-danmuku/danmuku";
import Setting from "../src/renderer/src/components/Artplayer/artplayer-plugin-danmuku/setting";
import {
  getFontSize,
  getImageSize,
  normalizeFontSize,
} from "../src/renderer/src/components/Artplayer/artplayer-plugin-danmuku/fontSize";
import { normalizeSpeed } from "../src/renderer/src/components/Artplayer/artplayer-plugin-danmuku/speed";
import heatmap from "../src/renderer/src/components/Artplayer/artplayer-plugin-danmuku/heatmap";

vi.mock(
  "../src/renderer/src/components/Artplayer/artplayer-plugin-danmuku/worker.js?worker&inline",
  () => ({
    default: class {},
  }),
);

describe("Artplayer danmuku percentage size", () => {
  it("defaults to 100% and scales with the short side, bounded to an 18–36px base", () => {
    expect(Danmuku.option.fontSize).toBe(100);
    expect(getFontSize(1280, 720, 100)).toBe(29);
    expect(getFontSize(2560, 1440, 100)).toBe(36);
    expect(getFontSize(1440, 2560, 100)).toBe(36);
    expect(getFontSize(360, 640, 100)).toBe(18);
    expect(getFontSize(1280, 720, 50)).toBe(14);
    expect(getFontSize(1280, 720, 200)).toBe(58);
    expect(getFontSize(2560, 1440, 200)).toBe(72);
    expect(getFontSize(0, 0, 100)).toBe(29);
  });

  it("excludes letterboxing and pillarboxing from the size calculation", () => {
    expect(getFontSize(800, 800, 100)).toBe(32);
    expect(getFontSize(800, 800, 100, 1920, 1080)).toBe(18);
    expect(getFontSize(800, 800, 100, 1080, 1920)).toBe(18);
    expect(getFontSize(1280, 720, 100, 1080, 1920)).toBe(18);
    expect(getFontSize(1280, 720, 100, 0, 0)).toBe(29);
  });

  it("scales images with the same orientation and letterboxing rules", () => {
    expect(getImageSize(1280, 720, 100)).toBe(60);
    expect(getImageSize(2560, 1440, 100)).toBe(75);
    expect(getImageSize(1440, 2560, 100)).toBe(75);
    expect(getImageSize(360, 640, 100)).toBe(38);
    expect(getImageSize(1280, 720, 50)).toBe(30);
    expect(getImageSize(1280, 720, 200)).toBe(120);
    expect(getImageSize(800, 800, 100, 1920, 1080)).toBe(38);
    expect(getImageSize(800, 800, 100, 1080, 1920)).toBe(38);
    expect(getImageSize(0, 0, 100)).toBe(60);
  });

  it("updates visible comments after metadata loads and uses the selected aspect ratio", () => {
    const listeners = new Map<string, () => void>();
    const art = {
      constructor: {
        utils: {
          clamp: (value, min, max) => Math.min(max, Math.max(min, value)),
          errorHandle: vi.fn(),
        },
        validator: vi.fn(),
      },
      template: {
        $player: { clientWidth: 800, clientHeight: 800 },
        $danmuku: { style: {} },
      },
      video: { clientWidth: 800, clientHeight: 800, videoWidth: 0, videoHeight: 0 },
      aspectRatio: "default",
      on: (event, listener) => listeners.set(event, listener),
      off: vi.fn(),
      emit: vi.fn(),
      proxy: vi.fn(),
    };
    const danmuku = new Danmuku(art, { danmuku: [] });
    const playing = { mode: 1, $ref: { style: { setProperty: vi.fn() } } };
    danmuku.states.emit.push(playing);
    expect(danmuku.fontSize).toBe(32);
    Object.assign(art.video, { videoWidth: 1080, videoHeight: 1920 });
    listeners.get("video:loadedmetadata")!();
    expect(playing.$ref.style).toMatchObject({ fontSize: "18px" });

    art.aspectRatio = "4:3";
    Object.assign(art.video, { clientWidth: 800, clientHeight: 600 });
    listeners.get("aspectRatio")!();
    expect(playing.$ref.style).toMatchObject({ fontSize: "24px" });
    expect(art.proxy).toHaveBeenCalledWith(art.video, "resize", danmuku.resize);

    danmuku.stop = vi.fn();
    danmuku.worker.terminate = vi.fn();
    danmuku.destroy();
    for (const event of ["resize", "video:loadedmetadata", "aspectRatio"]) {
      expect(art.off).toHaveBeenCalledWith(event, danmuku.resize);
    }
  });

  it("keeps settings within 50–200% and recovers from invalid values", () => {
    expect(normalizeFontSize(10)).toBe(50);
    expect(normalizeFontSize(300)).toBe(200);
    expect(normalizeFontSize(NaN)).toBe(100);
    expect(normalizeFontSize(undefined)).toBe(100);
  });

  it("uses the saved percentage for the slider and writes percentages on change", () => {
    const setting = Object.create(Setting.prototype);
    setting.danmuku = { option: Danmuku.option, config: vi.fn() };
    setting.template = { $fontSizeValue: { textContent: "" } };
    setting.slider = {};
    setting.createSlider = (options) => options;
    setting.createSliders();

    const slider = setting.slider.fontSize;
    expect([slider.min, slider.max, slider.findIndex()]).toEqual([50, 200, 100]);
    slider.onChange(100);
    expect(setting.template.$fontSizeValue.textContent).toBe("100%");
    expect(setting.danmuku.config).not.toHaveBeenCalled();
    slider.onChange(200);
    expect(setting.template.$fontSizeValue.textContent).toBe("200%");
    expect(setting.danmuku.config).toHaveBeenCalledWith({ fontSize: 200 });
  });

  it("updates visible and paused comments after a fullscreen resize without changing the percentage", () => {
    const danmuku = Object.create(Danmuku.prototype);
    danmuku.option = { ...Danmuku.option, fontSize: 150 };
    danmuku.$player = { clientWidth: 1920, clientHeight: 1080 };
    const paused = { mode: 1, $ref: { style: { setProperty: vi.fn() } } };
    const playing = { mode: 2, $ref: { style: { setProperty: vi.fn() } } };
    danmuku.states = { stop: [paused], emit: [playing] };
    danmuku.resize();
    expect(paused.$ref.style).toMatchObject({ fontSize: "54px" });
    expect(playing.$ref.style).toMatchObject({ fontSize: "54px" });
    expect(danmuku.option.fontSize).toBe(150);
  });
});

describe("Artplayer danmuku speed", () => {
  it("uses 7.5 seconds as moderate and preserves valid saved durations", () => {
    const setting = Object.create(Setting.prototype);
    setting.danmuku = { option: Danmuku.option };
    const steps = setting.SPEED.steps;
    expect(steps.find((step) => step.name === "适中")?.value).toBe(7.5);
    expect(Danmuku.option.speed).toBe(7.5);

    steps.forEach(({ value }) => {
      expect(normalizeSpeed(value)).toBe(value);
    });
    expect(normalizeSpeed(undefined)).toBe(7.5);
    expect(normalizeSpeed(NaN)).toBe(7.5);
    expect(normalizeSpeed(0)).toBe(1.5);
    expect(normalizeSpeed(20)).toBe(15);
  });

  it("selects the saved tier and applies the fastest tier with playback rate synchronization", () => {
    const setting = Object.create(Setting.prototype);
    const danmuku = Object.create(Danmuku.prototype);
    danmuku.option = { ...Danmuku.option, speed: 3.75 };
    danmuku.utils = { clamp: (value, min, max) => Math.min(max, Math.max(min, value)) };
    danmuku.art = { template: {}, emit: vi.fn(), playbackRate: 2 };
    danmuku.validator = vi.fn();
    danmuku.$danmuku = { style: {} };
    setting.danmuku = danmuku;
    setting.template = { $speedValue: { textContent: "" } };
    setting.slider = {};
    setting.createSlider = (options) => options;
    setting.createSliders();

    const slider = setting.slider.speed;
    expect(slider.findIndex()).toBe(3);
    slider.onChange(4);
    expect(setting.template.$speedValue.textContent).toBe("极快");
    expect(danmuku.option.speed).toBe(1.5);
    expect(danmuku.speed).toBe(1.5);
    danmuku.config({ synchronousPlayback: true });
    expect(danmuku.speed).toBe(0.75);
  });
});

describe("Artplayer danmuku heatmap", () => {
  function createPlayer() {
    const handlers = new Map<string, ((...args: any[]) => void)[]>();
    const element = { style: { display: "" }, innerHTML: "", offsetWidth: 80, offsetHeight: 100 };
    const utils = {
      clamp: (value, min, max) => Math.min(max, Math.max(min, value)),
      query: () => ({ setAttribute: vi.fn() }),
    };
    const art = {
      constructor: { utils },
      template: { $player: { dataset: {} }, $controlsCenter: {} },
      option: { isLive: false },
      duration: 100,
      played: 0.5,
      controls: {
        add: vi.fn((options) => options.mounted(element)),
      },
      on(name, callback) {
        handlers.set(name, [...(handlers.get(name) ?? []), callback]);
      },
      emit(name, ...args) {
        for (const callback of handlers.get(name) ?? []) callback(...args);
      },
      proxy: vi.fn(),
    };
    const danmuku = Object.create(Danmuku.prototype);
    Object.assign(danmuku, {
      option: Danmuku.option,
      utils,
      validator: vi.fn(),
      art,
      queue: [{ time: 1 }, { time: 2 }],
      $danmuku: { style: {} },
    });
    return { art, danmuku, element };
  }

  it("creates the progress bar on demand, hides it, and reuses it when enabled again", () => {
    const { art, danmuku, element } = createPlayer();
    heatmap(art, danmuku);
    expect(art.controls.add).not.toHaveBeenCalled();
    danmuku.config({ heatmap: true });
    expect(art.controls.add).toHaveBeenCalledTimes(1);
    expect(element.innerHTML).toContain("<svg");
    danmuku.config({ heatmap: false });
    expect(element.style.display).toBe("none");
    expect(element.innerHTML).toBe("");
    danmuku.config({ heatmap: true });
    expect(element.style.display).toBe("");
    expect(element.innerHTML).toContain("<svg");
    expect(art.controls.add).toHaveBeenCalledTimes(1);
  });

  it("forces heatmap off when heatmapEnable is false, including subsequent config updates", () => {
    const { art, danmuku, element } = createPlayer();
    danmuku.config({ heatmapEnable: false, heatmap: { opacity: 0.5 } }, true);
    expect(danmuku.option.heatmap).toBe(false);
    heatmap(art, danmuku);
    danmuku.config({ heatmap: true });
    expect(danmuku.option.heatmap).toBe(false);
    expect(art.controls.add).not.toHaveBeenCalled();
    danmuku.config({ heatmapEnable: true, heatmap: true });
    expect(element.innerHTML).toContain("<svg");
    danmuku.config({ heatmapEnable: false });
    expect(danmuku.option.heatmap).toBe(false);
    expect(element.style.display).toBe("none");
    art.emit("resize");
    expect(element.innerHTML).toBe("");
  });

  it("preserves custom point data across resizing and toggling", () => {
    const { art, danmuku, element } = createPlayer();
    heatmap(art, danmuku);
    danmuku.config({ heatmap: { sampling: 0 } });
    const points = [
      [0, 1],
      [80, 10],
    ];
    art.emit("artplayerPluginDanmuku:points", points);
    const rendered = element.innerHTML;
    art.emit("resize");
    expect(element.innerHTML).toBe(rendered);
    danmuku.config({ heatmap: false });
    danmuku.config({ heatmap: true });
    expect(element.innerHTML).toBe(rendered);
    expect(points).toEqual([
      [0, 1],
      [80, 10],
    ]);
  });

  it("toggles the setting, preserves heatmap options, and hides and blocks the disabled setting", () => {
    const { art, danmuku } = createPlayer();
    const setting = Object.create(Setting.prototype);
    setting.art = art;
    setting.danmuku = danmuku;
    setting.template = {
      $heatmapConfig: { style: {} },
      $heatmap: {},
      $mount: art.template.$controlsCenter,
      $controlsCenter: art.template.$controlsCenter,
    };
    setting.heatmapOptions = true;
    art.on("artplayerPluginDanmuku:config", () => setting.syncHeatmap());
    setting.createEvents();
    const click = art.proxy.mock.calls.find(([target]) => target === setting.template.$heatmap)![2];
    danmuku.config({ heatmap: { opacity: 0.5 } });
    click();
    expect(danmuku.option.heatmap).toBe(false);
    click();
    expect(danmuku.option.heatmap).toEqual({ opacity: 0.5 });
    expect(art.template.$player.dataset).toMatchObject({ danmukuHeatmap: true });
    danmuku.config({ heatmapEnable: false });
    expect(setting.template.$heatmapConfig.style.display).toBe("none");
    click();
    expect(danmuku.option.heatmap).toBe(false);
    danmuku.config({ heatmapEnable: true });
    expect(setting.template.$heatmapConfig.style.display).toBe("flex");
  });
});
