import type { Page } from "@unprice/db/validators"

export const colorPresets: { name: string; palette: Page["colorPalette"] }[] = [
  {
    name: "Nature Green",
    palette: {
      primary: "#22c55e",
    },
  },
  {
    name: "Ocean Blue",
    palette: {
      primary: "#3b82f6",
    },
  },
  {
    name: "Sunset Orange",
    palette: {
      primary: "#f97316",
    },
  },
  {
    name: "Purple Lavender",
    palette: {
      primary: "#a855f7",
    },
  },
  {
    name: "Rose Pink",
    palette: {
      primary: "#ec4899",
    },
  },
  {
    name: "Neutral Gray",
    palette: {
      primary: "#6b7280",
    },
  },
]
