export type ColorUtility = "bg" | "stroke" | "fill" | "text"

export const chartColors = {
  info: {
    bg: "bg-info-solid",
    stroke: "stroke-info-solid",
    fill: "fill-info-solid",
    text: "text-info-solid",
  },
  danger: {
    bg: "bg-danger-solid",
    stroke: "stroke-danger-solid",
    fill: "fill-danger-solid",
    text: "text-danger-solid",
  },
  warning: {
    bg: "bg-warning-solid",
    stroke: "stroke-warning-solid",
    fill: "fill-warning-solid",
    text: "text-warning-solid",
  },
  primary: {
    bg: "bg-primary-solid",
    stroke: "stroke-primary-solid",
    fill: "fill-primary-solid",
    text: "text-primary-solid",
  },
  gray: {
    bg: "bg-gray-solid",
    stroke: "stroke-gray-solid",
    fill: "fill-gray-solid",
    text: "text-gray-solid",
  },
  secondary: {
    bg: "bg-secondary-solid",
    stroke: "stroke-secondary-solid",
    fill: "fill-secondary-solid",
    text: "text-secondary-solid",
  },
  success: {
    bg: "bg-success-solid",
    stroke: "stroke-success-solid",
    fill: "fill-success-solid",
    text: "text-success-solid",
  },
} as const satisfies {
  [color: string]: {
    [key in ColorUtility]: string
  }
}

export type AvailableChartColorsKeys = keyof typeof chartColors

export const AvailableChartColors: AvailableChartColorsKeys[] = Object.keys(
  chartColors
) as Array<AvailableChartColorsKeys>

export const constructCategoryColors = (
  categories: string[],
  colors: AvailableChartColorsKeys[]
): Map<string, AvailableChartColorsKeys> => {
  const categoryColors = new Map<string, AvailableChartColorsKeys>()
  categories.forEach((category, index) => {
    categoryColors.set(category, colors[index % colors.length]!)
  })
  return categoryColors
}

export const getColorClassName = (color: AvailableChartColorsKeys, type: ColorUtility): string => {
  const fallbackColor = {
    bg: "bg-gray",
    stroke: "stroke-gray",
    fill: "fill-gray",
    text: "text-gray",
  }
  return chartColors[color]?.[type] ?? fallbackColor[type]
}

// Tremor Raw getYAxisDomain [v0.0.0]

export const getYAxisDomain = (
  autoMinValue: boolean,
  minValue: number | undefined,
  maxValue: number | undefined
) => {
  const minDomain = autoMinValue ? "auto" : minValue ?? 0
  const maxDomain = maxValue ?? "auto"
  return [minDomain, maxDomain]
}

// Tremor Raw hasOnlyOneValueForKey [v0.1.0]

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function hasOnlyOneValueForKey(array: any[], keyToCheck: string): boolean {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const val: any[] = []

  for (const obj of array) {
    if (Object.prototype.hasOwnProperty.call(obj, keyToCheck)) {
      val.push(obj[keyToCheck])
      if (val.length > 1) {
        return false
      }
    }
  }

  return true
}
