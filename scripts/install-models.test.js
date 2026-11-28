import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { installModel, verifyModel } from "./install-models.js";
import verifyPackagedModel from "../packages/app/build/verify-model.cjs";

let directory;
beforeEach(async () => {
  directory = await mkdtemp(path.join(os.tmpdir(), "yamnet-build-test-"));
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(async () => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  await rm(directory, { recursive: true, force: true });
});

it("fails after HTTP retries without leaving a model or partial file", async () => {
  const download = vi.fn(async () => new Response("unavailable", { status: 503 }));
  vi.stubGlobal("fetch", download);
  await expect(installModel(path.join(directory, "yamnet.onnx"))).rejects.toThrow("HTTP 503");
  expect(download).toHaveBeenCalledTimes(3);
  expect(await readdir(directory)).toEqual([]);
});

it("does not publish invalid downloads or overwrite an existing model before verification", async () => {
  const target = path.join(directory, "yamnet.onnx");
  await writeFile(target, "existing invalid model");
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("corrupt download")),
  );
  await expect(installModel(target)).rejects.toThrow("SHA-256");
  expect(await readFile(target, "utf8")).toBe("existing invalid model");
  expect(await readdir(directory)).toEqual(["yamnet.onnx"]);
  await expect(verifyModel(target)).rejects.toThrow("SHA-256");
});

it.each(["win32", "linux", "darwin"])(
  "rejects a %s package missing the unpacked model",
  async (platform) => {
    await expect(
      verifyPackagedModel({
        appOutDir: directory,
        electronPlatformName: platform,
        packager: { appInfo: { productFilename: "biliLive-tools" } },
      }),
    ).rejects.toThrow("打包产物中的 YAMNet 模型缺失或损坏");
  },
);
