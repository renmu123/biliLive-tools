import { describe, expect, it, vi } from "vitest";
import Danmuku from "../src/renderer/src/components/Artplayer/artplayer-plugin-danmuku/danmuku";
import Setting from "../src/renderer/src/components/Artplayer/artplayer-plugin-danmuku/setting";
import {
  getFontSize,
  migrateFontSize,
  normalizeFontSize,
} from "../src/renderer/src/components/Artplayer/artplayer-plugin-danmuku/fontSize";
import { migrateSpeed } from "../src/renderer/src/components/Artplayer/artplayer-plugin-danmuku/speed";

vi.mock(
  "../src/renderer/src/components/Artplayer/artplayer-plugin-danmuku/worker.js?worker&inline",
  () => ({
    default: class {},
  }),
);

describe("Artplayer danmuku percentage size", () => {
  it("defaults to 100% and scales with the player height", () => {
    expect(Danmuku.option.fontSize).toBe(100);
    expect(getFontSize(720, 100)).toBe(29);
    expect(getFontSize(1080, 100)).toBe(43);
    expect(getFontSize(720, 50)).toBe(14);
    expect(getFontSize(720, 200)).toBe(58);
    expect(getFontSize(0, 100)).toBe(29);
  });

  it("keeps settings within 50–200% and recovers from invalid values", () => {
    expect(normalizeFontSize(10)).toBe(50);
    expect(normalizeFontSize(300)).toBe(200);
    expect(normalizeFontSize(NaN)).toBe(100);
    expect(normalizeFontSize(undefined)).toBe(100);
  });

  it("resets all legacy sizes to 100% and preserves saved percentages after migration", () => {
    for (const value of [undefined, 12, 25, 120, "4%", "8%", "invalid%"])
      expect(migrateFontSize(value)).toBe(100);
    expect(migrateFontSize(50, 2)).toBe(50);
    expect(migrateFontSize(150, 2)).toBe(150);
    expect(migrateFontSize(200, 2)).toBe(200);
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
    const paused = { mode: 1, $ref: { style: {} } };
    const playing = { mode: 2, $ref: { style: {} } };
    danmuku.states = { stop: [paused], emit: [playing] };
    danmuku.resize();
    expect(paused.$ref.style).toMatchObject({ fontSize: "65px" });
    expect(playing.$ref.style).toMatchObject({ fontSize: "65px" });
    expect(danmuku.option.fontSize).toBe(150);
  });
});

describe("Artplayer danmuku speed", () => {
  it("uses 7.5 seconds as moderate and migrates each saved tier once", () => {
    const setting = Object.create(Setting.prototype);
    setting.danmuku = { option: Danmuku.option };
    const steps = setting.SPEED.steps;
    expect(steps.find((step) => step.name === "适中")?.value).toBe(7.5);
    expect(Danmuku.option.speed).toBe(7.5);

    const previousSpeeds = [10, 7.5, 5, 2.5, 1];
    previousSpeeds.forEach((previousSpeed, index) => {
      const migrated = migrateSpeed(previousSpeed);
      expect(migrated).toBe(steps[index].value);
      expect(migrateSpeed(previousSpeed / 2, 2)).toBe(migrated);
      expect(migrateSpeed(migrated, 3)).toBe(migrated);
    });
    expect(migrateSpeed(undefined)).toBe(7.5);
  });

  it("selects the saved tier and applies the fastest tier with playback rate synchronization", () => {
    const setting = Object.create(Setting.prototype);
    const danmuku = Object.create(Danmuku.prototype);
    danmuku.option = { ...Danmuku.option, speed: migrateSpeed(2.5) };
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
