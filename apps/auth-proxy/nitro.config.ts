import { defineNitroConfig } from "nitropack/config"

export default defineNitroConfig({
  compatibilityDate: "2025-01-10",
  output: {
    dir: ".vercel",
    publicDir: ".vercel/public",
  },
})
