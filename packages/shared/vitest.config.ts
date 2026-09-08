import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export const __dirname = dirname(fileURLToPath(import.meta.url));
const globalSetupPath = path.resolve(__dirname, "./test-globals.js");
const setupFilesPath = path.resolve(__dirname, "./test/setup-mocks.ts");

export default defineConfig({
  test: {
    typecheck: {
      tsconfig: "tsconfig.vitest.json",
    },
    globalSetup: globalSetupPath,
    setupFiles: [setupFilesPath],
    globals: true,
  },
});
