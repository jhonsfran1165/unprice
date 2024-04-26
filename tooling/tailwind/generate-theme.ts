/**
 * Every original color has its corresponding saturated gray scale,
 * which can create a more colorful and harmonious vibe,
 * if used on the text against the original color background.
 *
 * @see https://www.radix-ui.com/docs/colors/palette-composition/composing-a-palette
 */
const grayScalePairs = {
  tomato: "mauvedark",
  red: "mauvedark",
  crimson: "mauvedark",
  pink: "mauvedark",
  plum: "mauvedark",
  purple: "mauvedark",
  violet: "mauvedark",
  mauve: "mauvedark",
  sky: "slate",
  indigo: "slatedark",
  blue: "slatedark",
  cyan: "slatedark",
  slate: "slatedark",
  mint: "sage",
  teal: "sagedark",
  green: "sagedark",
  sage: "sagedark",
  lime: "olive",
  grass: "olivedark",
  olive: "olivedark",
  yellow: "sand",
  amber: "sand",
  orange: "sanddark",
  brown: "sanddark",
  sand: "sanddark",
  white: "gray",
  gray: "graydark",
  gold: "graydark",
  bronze: "graydark",
  black: "graydark",
} as Record<string, string>

const foregroundPairs = {
  sky: "black",
  mint: "black",
  lime: "black",
  yellow: "black",
  amber: "black",
} as Record<string, string>

const themeNames = {
  sunset: {
    success: "green",
    destructive: "red",
    warning: "yellow",
    info: "blue",
    primary: "amber",
    secondary: "bronze",
  },
  slate: {
    success: "teal",
    destructive: "tomato",
    warning: "amber",
    info: "cyan",
    primary: "indigo",
    secondary: "blue",
  },
}

const generateVariantRadixColors = (color: string) => {
  // there are some colors that only works on especial foreground
  const foreground = foregroundPairs[color] ?? "white"
  return {
    DEFAULT: `var(--${color}-9)`,
    foreground: `${foreground}`,
    base: `var(--${color}-1)`,
    bgSubtle: `var(--${color}-2)`,
    bg: `var(--${color}-3)`,
    bgHover: `var(--${color}-4)`,
    bgActive: `var(--${color}-5)`,
    line: `var(--${color}-6)`,
    border: `var(--${color}-7)`,
    borderHover: `var(--${color}-8)`,
    solid: `var(--${color}-9)`,
    solidHover: `var(--${color}-10)`,
    text: `var(--${color}-11)`,
    textContrast: `var(--${color}-12)`,
  }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface RecursiveKeyValuePair<K extends keyof any = string, V = string> {
  [key: string]: V | RecursiveKeyValuePair<K, V>
}

export const generateTheme = (
  themeName: keyof typeof themeNames
): RecursiveKeyValuePair => {
  const theme = themeNames[themeName]
  const grayscale = grayScalePairs[theme.primary] ?? "gray"

  return {
    transparent: "transparent",
    current: "currentColor",
    black: "#000",
    white: "#FFF",
    gray: generateVariantRadixColors(grayscale),
    success: generateVariantRadixColors(theme.success),
    danger: generateVariantRadixColors(theme.destructive),
    warning: generateVariantRadixColors(theme.warning),
    info: generateVariantRadixColors(theme.info),
    error: generateVariantRadixColors(theme.destructive),
    // shadcn variables
    background: {
      ...generateVariantRadixColors(grayscale),
      DEFAULT: `var(--${grayscale}-2)`,
    },
    primary: generateVariantRadixColors(theme.primary),
    secondary: generateVariantRadixColors(theme.secondary),
    border: `var(--${grayscale}-6)`,
    input: `var(--${grayscale}-6)`,
    ring: `var(--${grayscale}-8)`,
    foreground: `var(--${grayscale}-11)`,
    destructive: {
      DEFAULT: `var(--${theme.destructive}-9)`,
      foreground: `var(--${theme.destructive}-3)`,
    },
    muted: {
      DEFAULT: `var(--${grayscale}-4)`,
      foreground: `var(--${grayscale}-11)`,
    },
    accent: {
      DEFAULT: `var(--${grayscale}-6)`,
      foreground: `var(--${grayscale}-12)`,
    },
    popover: {
      DEFAULT: `var(--${grayscale}-2)`,
      foreground: `var(--${grayscale}-11)`,
    },
    card: {
      DEFAULT: `var(--${grayscale}-2)`,
      foreground: `var(--${grayscale}-11)`,
    },
  }
}
