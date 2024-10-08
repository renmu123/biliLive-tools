import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    typecheck: {
      tsconfig: "tsconfig.vitest.json",
    },
    globalSetup: "./test-globals.js",
    globals: true,
  },
});
