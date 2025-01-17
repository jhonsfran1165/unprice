import { defineNitroConfig } from "nitropack/config"

export default defineNitroConfig({
  compatibilityDate: "2025-01-10",
  preset: "vercel-edge",
  output: {
    dir: ".output",
    publicDir: ".output/public",
  },
})
