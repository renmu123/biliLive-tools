import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    typecheck: {
      tsconfig: "tsconfig.vitest.json",
    },
    globalSetup: "./test-globals.js",
    setupFiles: ["./test/setup-mocks.ts"],
    coverage: {
      provider: "istanbul", // or 'v8'
    },
  },
});
