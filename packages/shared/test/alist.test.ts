import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { Alist } from "../src/sync/alist.js";
import fs from "fs-extra";
import path from "node:path";
import os from "node:os";

// 这些测试是跳过的，因为它们需要真实的AList服务器
// 如果你想运行这些测试，请取消跳过并配置正确的服务器信息
describe.skip("Alist 上传器测试", () => {
  let alist: Alist;
  let tempDir: string;
  let testFile: string;

  beforeAll(async () => {
    // 创建临时目录和测试文件
    tempDir = path.join(os.tmpdir(), "alist-test-" + Date.now());
    await fs.ensureDir(tempDir);
    testFile = path.join(tempDir, "test-file.txt");
    await fs.writeFile(testFile, "这是测试文件内容");

    // 创建Alist实例
    alist = new Alist({
      server: "http://localhost:5244", // 替换为你的AList服务器地址
      username: "admin", // 替换为你的用户名
      password: "password", // 替换为你的密码
      remotePath: "/测试", // 替换为你想要上传到的路径
    });
  });

  afterAll(async () => {
    // 清理临时文件
    await fs.remove(tempDir);
  });

  it("应该能够登录到AList服务器", async () => {
    const result = await alist.login();
    expect(result).toBe(true);
    expect(alist.isLoggedIn()).toBe(true);
  });

  it("应该能够创建远程目录", async () => {
    const result = await alist.mkdir("test-dir");
    expect(result).toBe(true);
  });

  it("应该能够列出远程目录", async () => {
    const files = await alist.listFiles();
    expect(Array.isArray(files)).toBe(true);
  });

  it("应该能够上传文件", async () => {
    // 监听进度事件
    const progressSpy = vi.fn();
    alist.on("progress", progressSpy);

    // 监听成功事件
    const successSpy = vi.fn();
    alist.on("success", successSpy);

    await alist.uploadFile(testFile, "test-dir");

    expect(successSpy).toHaveBeenCalled();
    expect(progressSpy).toHaveBeenCalled();
  });
});

// 使用示例
describe.skip("Alist上传器使用示例", () => {
  it("基本使用示例", async () => {
    // 创建Alist上传器实例
    const alist = new Alist({
      server: "http://localhost:5244", // 替换为你的AList服务器地址
      username: "admin", // 替换为你的用户名
      password: "password", // 替换为你的密码
      remotePath: "/录播", // 替换为你想要上传到的路径
    });

    // 监听进度事件
    alist.on("progress", (progress) => {
      console.log(
        `上传进度: ${progress.percentage}%, ${progress.uploaded}/${progress.total}, 速度: ${progress.speed}`,
      );
    });

    // 监听错误事件
    alist.on("error", (error) => {
      console.error("上传错误:", error.message);
    });

    // 监听成功事件
    alist.on("success", (message) => {
      console.log("上传成功:", message);
    });

    // 登录到AList服务器
    await alist.login();

    // 创建远程目录
    await alist.mkdir("测试目录");

    // 上传文件
    await alist.uploadFile("/path/to/your/file.mp4", "测试目录");
  });
});
