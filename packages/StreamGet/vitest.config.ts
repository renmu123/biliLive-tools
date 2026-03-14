import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    typecheck: {
      tsconfig: "tsconfig.vitest.json",
    },
    globals: true,
    environment: "node",
    setupFiles: ["./test-setup.ts"],
  },
});
