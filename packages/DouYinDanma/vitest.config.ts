import { defineConfig } from "vitest/config";

export default defineConfig({
  root: import.meta.dirname,
  test: {
    name: "DouYinDanma",
    typecheck: {
      tsconfig: "tsconfig.vitest.json",
    },
  },
});
