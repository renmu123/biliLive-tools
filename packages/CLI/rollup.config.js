import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
// import nativePlugin from "rollup-plugin-natives";

export default [
  {
    external: ["ntsuspend", "@napi-rs/canvas"],
    input: "src/index.ts",
    output: [
      // {
      //   format: "es",
      //   dir: "lib",
      // },
      {
        // file: "lib/index.cjs",
        dir: "lib",
        format: "cjs",
        entryFileNames: "[name].cjs",
      },
    ],
    // inlineDynamicImports: true,
    plugins: [
      typescript(),
      nodeResolve({ browser: false }),
      commonjs(),
      json(),
      // nativePlugin({
      //   // Where we want to physically put the extracted .node files
      //   copyTo: "lib",

      //   // Path to the same folder, relative to the output bundle js

      //   // Use `dlopen` instead of `require`/`import`.
      //   // This must be set to true if using a different file extension that '.node'
      //   dlopen: false,

      //   // Generate sourcemap
      //   sourcemap: true,

      //   // If the target is ESM, so we can't use `require` (and .node is not supported in `import` anyway), we will need to use `createRequire` instead.
      //   targetEsm: true,
      // }),
    ],
  },
];
