import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";

export default [
  {
    external: [
      "ntsuspend",
      "@napi-rs/canvas",
      "font-ls",
      "better-sqlite3",
      "shazamio-core",
      "music-segment-detector",
      "fsevents",
    ],
    input: "src/index.ts",
    output: [
      {
        dir: "lib",
        format: "cjs",
        entryFileNames: "[name].cjs",
        chunkFileNames: "[name]-[hash].cjs",
      },
    ],
    // inlineDynamicImports: true,
    plugins: [typescript(), nodeResolve({ browser: false }), commonjs(), json()],
  },
];
