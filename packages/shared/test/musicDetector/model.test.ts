import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { ensureModel } from "../../src/musicDetector/yamnet/model.js";

let directory: string;
const download = vi.fn();
beforeEach(async () => {
  directory = await mkdtemp(path.join(os.tmpdir(), "yamnet-model-test-"));
  vi.stubEnv("BILILIVE_YAMNET_MODEL", "");
  download.mockClear();
  vi.stubGlobal("fetch", download);
});
afterEach(async () => {
  expect(download).not.toHaveBeenCalled();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  await rm(directory, { recursive: true, force: true });
});
it("reports the missing bundled model without downloading or creating files", async () => {
  const target = path.join(directory, "yamnet.onnx");
  await expect(ensureModel(target)).rejects.toThrow(target);
  expect(await readdir(directory)).toEqual([]);
});
it("rejects a corrupt bundled model without changing it", async () => {
  const target = path.join(directory, "yamnet.onnx");
  await writeFile(target, "invalid model");
  await expect(ensureModel(target)).rejects.toThrow("SHA-256");
  expect(await readFile(target, "utf8")).toBe("invalid model");
  expect(await readdir(directory)).toEqual(["yamnet.onnx"]);
});
it("checks the explicit offline override instead of the default path", async () => {
  const target = path.join(directory, "override.onnx");
  vi.stubEnv("BILILIVE_YAMNET_MODEL", target);
  await expect(ensureModel(path.join(directory, "yamnet.onnx"))).rejects.toThrow(target);
  expect(await readdir(directory)).toEqual([]);
});
