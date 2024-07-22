import {
  defaultTheme,
  generateTheme,
  type generateVariantRadixColors,
} from "@unprice/tailwind-config"

const themeData = generateTheme(defaultTheme)

// you might wonder why we are using this function to define the color
// this is because we want to support dark mode and light mode out of the box with radix colors
const defineColor = (
  color: string,
  variant: keyof ReturnType<typeof generateVariantRadixColors>
) => {
  const colors = themeData.colors[color] as Record<string, string>
  const radixColor = colors[variant]
  return radixColor ?? color
}

export const TEXT_COLORS = [
  {
    name: "Default 1",
    option: defineColor("background", "text"),
  },
  {
    name: "Default 2",
    option: defineColor("background", "textContrast"),
  },
  {
    name: "Green",
    option: defineColor("success", "DEFAULT"),
  },
  {
    name: "Red",
    option: defineColor("error", "DEFAULT"),
  },
  {
    name: "Yellow",
    option: defineColor("warning", "DEFAULT"),
  },
  {
    name: "Blue",
    option: defineColor("info", "DEFAULT"),
  },
  {
    name: "Black",
    option: defineColor("black", "DEFAULT"),
  },
  {
    name: "White",
    option: defineColor("white", "DEFAULT"),
  },
  {
    name: "Gray",
    option: defineColor("gray", "DEFAULT"),
  },
  {
    name: "Transparent",
    option: "transparent",
  },
]

export const BACKGROUND_COLORS = [
  {
    name: "Default",
    option: defineColor("background", "bg"),
  },
  {
    name: "Green",
    option: defineColor("success", "bg"),
  },
  {
    name: "Red",
    option: defineColor("error", "bg"),
  },
  {
    name: "Yellow",
    option: defineColor("warning", "bg"),
  },
  {
    name: "Blue",
    option: defineColor("info", "bg"),
  },
  {
    name: "Black",
    option: defineColor("black", "DEFAULT"),
  },
  {
    name: "White",
    option: defineColor("white", "DEFAULT"),
  },
  {
    name: "Gray",
    option: defineColor("gray", "bg"),
  },
  {
    name: "Transparent",
    option: "transparent",
  },
]

export const weightDescription = (weight: number) =>
  weight === 400 ? "Regular" : weight === 500 ? "Medium" : "Bold"
