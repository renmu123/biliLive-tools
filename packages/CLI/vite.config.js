import { defineConfig } from "vite";

const external = [
  "ntsuspend",
  "@napi-rs/canvas",
  "font-ls",
  "better-sqlite3",
  "shazamio-core",
  "music-segment-detector",
  "fsevents",
  "electron",
];

export default defineConfig({
  ssr: {
    external,
    noExternal: true,
  },
  build: {
    ssr: "src/index.ts",
    outDir: "lib",
    rolldownOptions: {
      external,
      output: {
        format: "cjs",
        entryFileNames: "[name].cjs",
        chunkFileNames: "[name]-[hash].cjs",
      },
    },
  },
});
