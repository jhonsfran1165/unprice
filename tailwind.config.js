const { fontFamily } = require("tailwindcss/defaultTheme")
const { toRadixVar } = require("windy-radix-palette/vars")

const generateRadixColors = (color) => {
  return {
    DEFAULT: toRadixVar(color, 9),
    foreground: toRadixVar(color, 12),
    base: toRadixVar(color, 1),
    bgSubtle: toRadixVar(color, 2),
    bg: toRadixVar(color, 3),
    bgHover: toRadixVar(color, 4),
    bgActive: toRadixVar(color, 5),
    line: toRadixVar(color, 6),
    border: toRadixVar(color, 7),
    borderHover: toRadixVar(color, 8),
    solid: toRadixVar(color, 9),
    solidHover: toRadixVar(color, 10),
    text: toRadixVar(color, 11),
    textContrast: toRadixVar(color, 12),
  }
}

// https://tailwindcss.com/docs/theme#configuration-reference

/** @type {import('tailwindcss').Config} */
module.exports = {
  // mode: "jit", // mode just in time
  darkMode: ["class", '[data-theme="dark"]'],
  // prefix: 'builderai-', // activate to use prefixes here
  content: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}"],
  // disble hover on mobiles
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    screens: {
      sm: "640px", // mobile phones
      md: "768px", // tablets
      lg: "1024px", // desktops
      xl: "1280px", // large screens
      "2xl": "1536px", // extra large screens
    },
    colors: {
      border: toRadixVar("sand", 7),
      input: toRadixVar("sand", 6),
      ring: toRadixVar("sand", 1),
      background: toRadixVar("sand", 3),
      foreground: toRadixVar("sand", 11),
      destructive: {
        DEFAULT: toRadixVar("red", 9),
        foreground: toRadixVar("red", 3),
      },
      muted: {
        DEFAULT: toRadixVar("gray", 6),
        foreground: toRadixVar("gray", 11),
      },
      accent: {
        DEFAULT: toRadixVar("sand", 4),
        foreground: toRadixVar("sand", 12),
      },
      popover: {
        DEFAULT: toRadixVar("sand", 2),
        foreground: toRadixVar("sand", 11),
      },
      card: {
        DEFAULT: toRadixVar("sand", 2),
        foreground: toRadixVar("sand", 11),
      },
      transparent: "transparent",
      current: "currentColor",
      black: "#000",
      white: "#fff",
      gray: generateRadixColors("gray"),
      success: generateRadixColors("green"),
      danger: generateRadixColors("red"),
      warning: generateRadixColors("yellow"),
      info: generateRadixColors("blue"),
      error: generateRadixColors("red"),
      background: generateRadixColors("sand"),
      primary: generateRadixColors("amber"),
      secondary: generateRadixColors("crimson"),
    },
    // borderColor: (theme) => ({
    //   ...theme("colors"),
    //   DEFAULT: toRadixVar("sand", 7),
    // }),
    // // Modify the default ring color so that it matches the brand color:
    // ringColor: (theme) => ({
    //   ...theme("colors"),
    //   DEFAULT: toRadixVar("sand", 9),
    // }),
    // ringOffsetColor: (theme) => ({
    //   ...theme("colors"),
    //   DEFAULT: toRadixVar("sand", 9),
    // }),
    fontSize: {
      xs: ".75rem",
      sm: ".875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem",
      "5xl": "3rem",
      "6xl": "4rem",
    },
    letterSpacing: {
      tight: "-0.015em",
    },
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        satoshi: ["var(--font-satoshi)", ...fontFamily.sans],
        inter: ["var(--font-inter)", ...fontFamily.sans],
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  // https://www.youtube.com/watch?v=GEYkwfYytAM&ab_channel=TailwindLabs
  // tpyography is necessary later when we use contentlayer
  plugins: [
    require("tailwindcss-animate"),
    require("windy-radix-palette"),
    require("@tailwindcss/typography"),
    require("windy-radix-typography"),
    require("@tailwindcss/line-clamp"),
  ],
}
