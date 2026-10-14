import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import ffmpeg from "@renmu/fluent-ffmpeg";
import { appConfig } from "../../src/config.js";
import { APP_DEFAULT_CONFIG } from "../../src/enum.js";
import { DANMU_DEAFULT_CONFIG } from "../../src/presets/danmuPreset.js";
import { burn } from "../../src/task/video.js";
import { taskQueue } from "../../src/task/task.js";
import * as danmu from "../../src/task/danmu.js";
import * as utils from "../../src/utils/index.js";

describe("burn - 无弹幕压制", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(appConfig, "getAll").mockReturnValue({
      ...APP_DEFAULT_CONFIG,
      customExecPath: true,
      ffmpegPath: "ffmpeg",
      ffprobePath: "ffprobe",
    });
    vi.spyOn(ffmpeg, "ffprobe").mockImplementation((...args: any[]) => {
      args.at(-1)(null, {
        streams: [{ codec_type: "video", width: 1920, height: 1080 }],
        format: { duration: 60 },
      });
    });
    vi.spyOn(utils, "pathExists").mockResolvedValue(true);
  });

  it.each(["empty.xml", "missing.xml", "missing.ass"])(
    "忽略弹幕时仍创建压制任务，并保留空 XML 的录制时间戳: %s",
    async (subtitleFilePath) => {
      vi.spyOn(utils, "pathExists").mockImplementation(
        async (filePath) => !filePath.startsWith("missing."),
      );
      const timestamp = "2024-08-20T09:48:07.7164935+08:00";
      const readLinesSpy = vi
        .spyOn(utils, "readLines")
        .mockResolvedValue([`<video_start_time>${timestamp}</video_start_time>`]);
      const addTaskSpy = vi.spyOn(taskQueue, "addTask").mockImplementation(() => {});
      const emptySpy = vi.spyOn(danmu, "isEmptyDanmu");
      const convertSpy = vi.spyOn(danmu, "convertXml2Ass");
      const hotProgressSpy = vi.spyOn(danmu, "genHotProgress");

      const task = await burn({ videoFilePath: "input.mp4", subtitleFilePath }, "output.mp4", {
        danmaOptions: DANMU_DEAFULT_CONFIG,
        ffmpegOptions: {
          encoder: "libx264",
          audioCodec: "copy",
          fps: 30,
          addTimestamp: true,
          timestampFollowDanmu: true,
        },
        hasHotProgress: true,
        ignoreDanmu: true,
        hotProgressOptions: { interval: 30, height: 60, color: "#fff", fillColor: "#000" },
        override: true,
        saveType: 2,
        savePath: "output",
        limitTime: ["01:00:00", "05:00:00"],
      });

      expect(addTaskSpy).toHaveBeenCalledWith(task, false);
      expect(task.limitTime).toEqual(["01:00:00", "05:00:00"]);
      const command = task.command._getArguments().join(" ");
      expect(command).toContain("-c:v libx264");
      expect(command).toContain("fps=30");
      expect(command).not.toContain("subtitles=");
      expect(emptySpy).not.toHaveBeenCalled();
      expect(convertSpy).not.toHaveBeenCalled();
      expect(hotProgressSpy).not.toHaveBeenCalled();
      if (subtitleFilePath === "empty.xml") {
        expect(readLinesSpy).toHaveBeenCalledWith(subtitleFilePath, 0, 30);
        expect(command).toContain("drawtext=");
        expect(command).toContain(String(Math.floor(new Date(timestamp).getTime() / 1000)));
        expect(command).toContain(`:font=${DANMU_DEAFULT_CONFIG.fontname}`);
      } else {
        expect(readLinesSpy).not.toHaveBeenCalled();
        expect(command).not.toContain("drawtext=");
      }
    },
  );

  it("未传入忽略参数时仍拒绝空弹幕", async () => {
    vi.spyOn(danmu, "isEmptyDanmu").mockResolvedValue(true);
    await expect(
      burn({ videoFilePath: "input.mp4", subtitleFilePath: "empty.xml" }, "output.mp4", {
        danmaOptions: DANMU_DEAFULT_CONFIG,
        ffmpegOptions: { encoder: "libx264", audioCodec: "copy" },
        hasHotProgress: false,
        hotProgressOptions: { interval: 30, height: 60, color: "#fff", fillColor: "#000" },
      }),
    ).rejects.toThrow("弹幕文件为空，无需压制");
  });
});
