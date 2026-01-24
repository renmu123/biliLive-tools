import { expect, describe, it, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "node:path";
import { PathResolver } from "../src/services/webhook/PathResolver.js";

const tempDir = path.join(process.cwd(), "temp-test-path-resolver");

describe("PathResolver", () => {
  beforeEach(async () => {
    // 创建临时测试目录
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    // 清理临时测试目录
    await fs.remove(tempDir);
  });

  describe("getDanmuPath", () => {
    it("如果提供了 danmuPath 参数，应该返回该路径", () => {
      const videoPath = path.join("path", "to", "video.mp4");
      const danmuPath = path.join("path", "to", "custom-danmu.xml");

      const result = PathResolver.getDanmuPath(videoPath, danmuPath);

      expect(result).toBe(danmuPath);
    });

    it("如果没有提供 danmuPath，应该将视频路径的扩展名替换为 .xml", () => {
      const videoPath = path.join("path", "to", "video.mp4");

      const result = PathResolver.getDanmuPath(videoPath);

      expect(result).toBe(path.join("path", "to", "video.xml"));
    });

    it("应该正确处理不同的视频格式", () => {
      expect(PathResolver.getDanmuPath(path.join("path", "to", "video.flv"))).toBe(
        path.join("path", "to", "video.xml"),
      );
      expect(PathResolver.getDanmuPath(path.join("path", "to", "video.mkv"))).toBe(
        path.join("path", "to", "video.xml"),
      );
      expect(PathResolver.getDanmuPath(path.join("path", "to", "video.avi"))).toBe(
        path.join("path", "to", "video.xml"),
      );
    });
  });

  describe("getCoverPath", () => {
    it("如果提供了存在的 coverPath，应该返回该路径", async () => {
      const coverPath = path.join(tempDir, "custom-cover.jpg");
      await fs.writeFile(coverPath, "test");
      const videoPath = path.join(tempDir, "video.mp4");

      const result = await PathResolver.getCoverPath(videoPath, coverPath);

      expect(result).toBe(coverPath);
    });

    it("如果提供的 coverPath 不存在，应该尝试查找默认封面", async () => {
      const videoPath = path.join(tempDir, "video.mp4");
      const coverPath = path.join(tempDir, "video.cover.jpg");
      await fs.writeFile(coverPath, "test");

      const result = await PathResolver.getCoverPath(videoPath, "/non-existent.jpg");

      expect(result).toBe(coverPath);
    });

    it("应该优先返回 .cover.jpg 格式的封面", async () => {
      const videoPath = path.join(tempDir, "video.mp4");
      const coverWithSuffix = path.join(tempDir, "video.cover.jpg");
      const coverJpg = path.join(tempDir, "video.jpg");

      await fs.writeFile(coverWithSuffix, "cover-suffix");
      await fs.writeFile(coverJpg, "jpg");

      const result = await PathResolver.getCoverPath(videoPath);

      expect(result).toBe(coverWithSuffix);
    });

    it("如果 .cover.jpg 不存在，应该返回 .jpg 格式的封面", async () => {
      const videoPath = path.join(tempDir, "video.mp4");
      const coverJpg = path.join(tempDir, "video.jpg");

      await fs.writeFile(coverJpg, "jpg");

      const result = await PathResolver.getCoverPath(videoPath);

      expect(result).toBe(coverJpg);
    });

    it("如果没有找到封面，应该返回 undefined", async () => {
      const videoPath = path.join(tempDir, "video.mp4");

      const result = await PathResolver.getCoverPath(videoPath);

      expect(result).toBe("");
    });
  });

  describe("getOutputPath", () => {
    it("应该正确生成输出文件路径", () => {
      const inputPath = path.join("path", "to", "input.flv");
      const suffix = "弹幕版";
      const ext = ".mp4";

      const result = PathResolver.getOutputPath(inputPath, suffix, ext);

      expect(result).toBe(path.join("path", "to", "input-弹幕版.mp4"));
    });

    it("应该处理不同的后缀和扩展名", () => {
      const inputPath = path.join("path", "to", "video.mp4");

      expect(PathResolver.getOutputPath(inputPath, "后处理", ".mp4")).toBe(
        path.join("path", "to", "video-后处理.mp4"),
      );
      expect(PathResolver.getOutputPath(inputPath, "转码", ".mkv")).toBe(
        path.join("path", "to", "video-转码.mkv"),
      );
    });

    it("应该正确处理 Windows 路径", () => {
      const inputPath = "C:\\Users\\test\\video.flv";
      const suffix = "弹幕版";
      const ext = ".mp4";

      const result = PathResolver.getOutputPath(inputPath, suffix, ext);

      expect(result).toBe("C:\\Users\\test\\video-弹幕版.mp4");
    });
  });

  describe("tryMp4Fallback", () => {
    it("如果原始文件存在，应该返回原始路径", async () => {
      const originalPath = path.join(tempDir, "video.flv");
      await fs.writeFile(originalPath, "test");

      const result = await PathResolver.tryMp4Fallback(originalPath);

      expect(result).toBe(originalPath);
    });

    it("如果原始文件不存在但 mp4 文件存在，应该返回 mp4 路径", async () => {
      const originalPath = path.join(tempDir, "video.flv");
      const mp4Path = path.join(tempDir, "video.mp4");
      await fs.writeFile(mp4Path, "test");

      const result = await PathResolver.tryMp4Fallback(originalPath);

      expect(result).toBe(mp4Path);
    });

    it("如果两个文件都不存在，应该返回原始路径", async () => {
      const originalPath = path.join(tempDir, "non-existent.flv");

      const result = await PathResolver.tryMp4Fallback(originalPath);

      expect(result).toBe(originalPath);
    });
  });

  describe("getFileType", () => {
    it('应该识别包含 "弹幕版" 的文件为 danmaku 类型', () => {
      const filePath = "/path/to/video-弹幕版.mp4";

      const result = PathResolver.getFileType(filePath);

      expect(result).toBe("danmaku");
    });

    it('应该识别包含 "后处理" 的文件为 danmaku 类型', () => {
      const filePath = "/path/to/video-后处理.mp4";

      const result = PathResolver.getFileType(filePath);

      expect(result).toBe("danmaku");
    });

    it("应该识别普通文件为 source 类型", () => {
      const filePath = "/path/to/video.mp4";

      const result = PathResolver.getFileType(filePath);

      expect(result).toBe("source");
    });

    it("应该正确处理文件路径中同时包含多个关键词的情况", () => {
      const filePath = "/path/to/弹幕版-后处理/video.mp4";

      const result = PathResolver.getFileType(filePath);

      expect(result).toBe("danmaku");
    });
  });

  describe("formatFolderStructure", () => {
    it("应该正确格式化文件夹结构", () => {
      const template = "{{platform}}/{{user}}/{{year}}/{{month}}";
      const params = {
        platform: "bilibili",
        user: "testuser",
        liveStartTime: new Date("2024-03-15T10:30:00Z"),
      };

      const result = PathResolver.formatFolderStructure(template, params);

      expect(result).toBe("bilibili/testuser/2024/03");
    });

    it("应该支持所有占位符", () => {
      const template = "{{platform}}/{{user}}/{{software}}/{{yyyy}}-{{MM}}-{{dd}}/{{now}}";
      const params = {
        platform: "douyu",
        user: "streamer123",
        software: "blrec",
        liveStartTime: new Date("2024-01-05T08:00:00Z"),
      };

      const result = PathResolver.formatFolderStructure(template, params);

      expect(result).toBe("douyu/streamer123/blrec/2024-01-05/2024.01.05");
    });

    it("应该正确补零月份和日期", () => {
      const template = "{{year}}/{{month}}/{{date}}";
      const params = {
        platform: "test",
        user: "test",
        liveStartTime: new Date("2024-01-05T00:00:00Z"),
      };

      const result = PathResolver.formatFolderStructure(template, params);

      expect(result).toBe("2024/01/05");
    });

    it("应该处理不包含占位符的模板", () => {
      const template = "static/path/to/folder";
      const params = {
        platform: "test",
        user: "test",
        liveStartTime: new Date("2024-01-01T00:00:00Z"),
      };

      const result = PathResolver.formatFolderStructure(template, params);

      expect(result).toBe("static/path/to/folder");
    });

    it("应该处理同一个占位符出现多次的情况", () => {
      const template = "{{user}}/{{year}}/{{user}}";
      const params = {
        platform: "test",
        user: "testuser",
        liveStartTime: new Date("2024-01-01T00:00:00Z"),
      };

      const result = PathResolver.formatFolderStructure(template, params);

      expect(result).toBe("testuser/2024/testuser");
    });

    it("应该正确处理 12 月的日期", () => {
      const template = "{{year}}/{{month}}/{{date}}";
      const params = {
        platform: "test",
        user: "test",
        liveStartTime: new Date(2024, 11, 31, 23, 59, 59), // 使用本地时间
      };

      const result = PathResolver.formatFolderStructure(template, params);

      expect(result).toBe("2024/12/31");
    });

    it("如果没有提供 software，应该使用默认值 'custom'", () => {
      const template = "{{platform}}/{{software}}/{{user}}";
      const params = {
        platform: "bilibili",
        user: "testuser",
        liveStartTime: new Date("2024-01-01T00:00:00Z"),
      };

      const result = PathResolver.formatFolderStructure(template, params);

      expect(result).toBe("bilibili/custom/testuser");
    });
  });
});
