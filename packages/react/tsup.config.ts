import { defineConfig } from "tsup"

export default defineConfig([
  {
    entry: {
      index: "src/index.ts",
    },
    format: ["esm", "cjs"],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    treeshake: true,
    minify: true,
    banner: {
      js: `"use client"`,
    },
  },
  {
    entry: {
      server: "src/server.ts",
    },
    format: ["esm", "cjs"],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: false, // don't wipe `dist/` after first build
    treeshake: true,
    minify: true,
    // NO banner here
  },
])
