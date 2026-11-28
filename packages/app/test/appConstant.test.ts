import { afterEach, expect, it, vi } from "vitest";
import path from "node:path";

const mocks = vi.hoisted(() => ({ packaged: false }));
vi.mock("electron", () => ({
  app: {
    get isPackaged() {
      return mocks.packaged;
    },
    getAppPath: () => path.resolve("packages/app"),
    getPath: (key: string) => path.resolve("test-app", key),
  },
}));
vi.mock("fs-extra", () => ({ default: { pathExists: async () => false } }));
import { getConfigPath } from "../src/main/appConstant.js";

const resourcesDescriptor = Object.getOwnPropertyDescriptor(process, "resourcesPath");
afterEach(() => {
  if (resourcesDescriptor) Object.defineProperty(process, "resourcesPath", resourcesDescriptor);
  else delete (process as any).resourcesPath;
});

it("loads the development model from the app resource directory", async () => {
  mocks.packaged = false;
  expect((await getConfigPath()).YAMNET_MODEL_PATH).toBe(
    path.resolve("packages/app/resources/models/yamnet.onnx"),
  );
});

it("loads the installed model from unpacked resources", async () => {
  mocks.packaged = true;
  const resources = path.resolve("installed-app/resources");
  Object.defineProperty(process, "resourcesPath", { configurable: true, value: resources });
  expect((await getConfigPath()).YAMNET_MODEL_PATH).toBe(
    path.join(resources, "app.asar.unpacked/resources/models/yamnet.onnx"),
  );
});
