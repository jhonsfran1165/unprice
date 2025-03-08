import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    reporters: ["default"],
    alias: {
      "@/": new URL("./src/", import.meta.url).pathname,
    },
    include: [
      "src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "src/**/__tests__/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
    ],
  },
})
