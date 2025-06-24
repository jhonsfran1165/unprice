import type { Page } from "@unprice/db/validators"

export const colorPresets: { name: string; palette: Page["colorPalette"] }[] = [
  {
    name: "Nature Green",
    palette: {
      primary: "#22c55e",
      secondary: "#16a34a",
      accent: "#84cc16",
      background: "#f0fdf4",
      text: "#166534",
      border: "#166534",
    },
  },
  {
    name: "Ocean Blue",
    palette: {
      primary: "#3b82f6",
      secondary: "#1d4ed8",
      accent: "#06b6d4",
      background: "#eff6ff",
      text: "#1e3a8a",
      border: "#1e3a8a",
    },
  },
  {
    name: "Sunset Orange",
    palette: {
      primary: "#f97316",
      secondary: "#ea580c",
      accent: "#fbbf24",
      background: "#fff7ed",
      text: "#9a3412",
      border: "#9a3412",
    },
  },
  {
    name: "Purple Lavender",
    palette: {
      primary: "#a855f7",
      secondary: "#9333ea",
      accent: "#c084fc",
      background: "#faf5ff",
      text: "#6b21a8",
      border: "#6b21a8",
    },
  },
  {
    name: "Rose Pink",
    palette: {
      primary: "#ec4899",
      secondary: "#db2777",
      accent: "#f472b6",
      background: "#fdf2f8",
      text: "#be185d",
      border: "#be185d",
    },
  },
  {
    name: "Neutral Gray",
    palette: {
      primary: "#6b7280",
      secondary: "#4b5563",
      accent: "#9ca3af",
      background: "#f9fafb",
      text: "#374151",
      border: "#374151",
    },
  },
]
