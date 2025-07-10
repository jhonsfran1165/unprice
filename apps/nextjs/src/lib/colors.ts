/**
 * Color utility functions for generating accessible text and border colors
 * from a background color using color theory and contrast calculations.
 */

interface HSL {
  h: number
  s: number
  l: number
}

interface RGB {
  r: number
  g: number
  b: number
}

/**
 * Converts a hex color to RGB
 */
function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) {
    throw new Error(`Invalid hex color: ${hex}`)
  }
  return {
    r: Number.parseInt(result[1]!, 16),
    g: Number.parseInt(result[2]!, 16),
    b: Number.parseInt(result[3]!, 16),
  }
}

/**
 * Converts RGB to hex
 */
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(n).toString(16)
    return hex.length === 1 ? `0${hex}` : hex
  }
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * Converts RGB to HSL
 */
function rgbToHsl(r: number, g: number, b: number): HSL {
  // biome-ignore lint/style/noParameterAssign: in cursor we trust
  r /= 255
  // biome-ignore lint/style/noParameterAssign: in cursor we trust
  g /= 255
  // biome-ignore lint/style/noParameterAssign: in cursor we trust
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }

  return { h: h * 360, s: s * 100, l: l * 100 }
}

/**
 * Converts HSL to RGB
 */
function hslToRgb(h: number, s: number, l: number): RGB {
  // biome-ignore lint/style/noParameterAssign: in cursor we trust
  h = h / 360
  // biome-ignore lint/style/noParameterAssign: in cursor we trust
  s = s / 100
  // biome-ignore lint/style/noParameterAssign: in cursor we trust
  l = l / 100

  const hue2rgb = (p: number, q: number, t: number) => {
    let temp = t
    if (temp < 0) temp += 1
    if (temp > 1) temp -= 1
    if (temp < 1 / 6) return p + (q - p) * 6 * temp
    if (temp < 1 / 2) return q
    if (temp < 2 / 3) return p + (q - p) * (2 / 3 - temp) * 6
    return p
  }

  let r: number
  let g: number
  let b: number

  if (s === 0) {
    r = g = b = l
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  }
}

/**
 * Calculates the relative luminance of a color
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((val) => {
    const c = val / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * rs! + 0.7152 * gs! + 0.0722 * bs!
}

/**
 * Calculates the contrast ratio between two colors
 */
function getContrastRatio(luminance1: number, luminance2: number): number {
  const lighter = Math.max(luminance1, luminance2)
  const darker = Math.min(luminance1, luminance2)
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Generates a text color that provides good contrast against the background
 */
export function generateTextColor(backgroundColor: string): string {
  const bgRgb = hexToRgb(backgroundColor)
  const bgLuminance = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b)

  // Try black first
  const blackLuminance = getLuminance(0, 0, 0)
  const blackContrast = getContrastRatio(bgLuminance, blackLuminance)

  // Try white
  const whiteLuminance = getLuminance(255, 255, 255)
  const whiteContrast = getContrastRatio(bgLuminance, whiteLuminance)

  // Use the color with better contrast (WCAG AA requires 4.5:1 for normal text)
  if (blackContrast >= 4.5) {
    return "#000000"
  }
  if (whiteContrast >= 4.5) {
    return "#ffffff"
  }
  // If neither meets the requirement, use the one with better contrast
  return blackContrast > whiteContrast ? "#000000" : "#ffffff"
}

/**
 * Generates a border color that provides subtle contrast against the background
 */
export function generateBorderColor(backgroundColor: string): string {
  const bgRgb = hexToRgb(backgroundColor)
  const bgHsl = rgbToHsl(bgRgb.r, bgRgb.g, bgRgb.b)

  // Create a darker version of the background for the border
  // Reduce lightness by 20-30% and slightly increase saturation
  const borderHsl: HSL = {
    h: bgHsl.h,
    s: Math.min(bgHsl.s + 10, 100),
    l: Math.max(bgHsl.l - 25, 10), // Ensure it's not too dark
  }

  const borderRgb = hslToRgb(borderHsl.h, borderHsl.s, borderHsl.l)
  return rgbToHex(borderRgb.r, borderRgb.g, borderRgb.b)
}

/**
 * Generates both text and border colors from a background color
 */
export function generateColorsFromBackground(backgroundColor: string): {
  text: string
  border: string
} {
  return {
    text: generateTextColor(backgroundColor),
    border: generateBorderColor(backgroundColor),
  }
}

/**
 * Validates if a hex color is valid
 */
export function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)
}
