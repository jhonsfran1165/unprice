const radixColors = require("@radix-ui/colors")
const colors = require("tailwindcss/colors")
const { fontFamily } = require("tailwindcss/defaultTheme")
const { toRadixVar } = require("windy-radix-palette/vars")

// https://tailwindcss.com/docs/theme#configuration-reference

/** @type {import('tailwindcss').Config} */
module.exports = {
  // mode: "jit", // mode just in time
  darkMode: ["class", '[data-theme="dark"]'],
  // prefix: 'builderai-', // activate to use prefixes here
  content: [
    "app/**/*.{ts,tsx}",
    "pages/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
  ],
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
      transparent: "transparent",
      current: "currentColor",
      black: "#000",
      white: "#fff",
      // slate: colors.slate,
      success: {
        DEFAULT: toRadixVar("green", 1),
        base: toRadixVar("green", 1),
        bgSubtle: toRadixVar("green", 2),
        bg: toRadixVar("green", 3),
        bgHover: toRadixVar("green", 4),
        bgActive: toRadixVar("green", 5),
        line: toRadixVar("green", 6),
        border: toRadixVar("green", 7),
        borderHover: toRadixVar("green", 8),
        solid: toRadixVar("green", 9),
        solidHover: toRadixVar("green", 10),
        text: toRadixVar("green", 11),
        textContrast: toRadixVar("green", 12),
      },
      danger: {
        DEFAULT: toRadixVar("red", 1),
        base: toRadixVar("red", 1),
        bgSubtle: toRadixVar("red", 2),
        bg: toRadixVar("red", 3),
        bgHover: toRadixVar("red", 4),
        bgActive: toRadixVar("red", 5),
        line: toRadixVar("red", 6),
        border: toRadixVar("red", 7),
        borderHover: toRadixVar("red", 8),
        solid: toRadixVar("red", 9),
        solidHover: toRadixVar("red", 10),
        text: toRadixVar("red", 11),
        textContrast: toRadixVar("red", 12),
      },
      warning: {
        DEFAULT: toRadixVar("yellow", 1),
        base: toRadixVar("yellow", 1),
        bgSubtle: toRadixVar("yellow", 2),
        bg: toRadixVar("yellow", 3),
        bgHover: toRadixVar("yellow", 4),
        bgActive: toRadixVar("yellow", 5),
        line: toRadixVar("yellow", 6),
        border: toRadixVar("yellow", 7),
        borderHover: toRadixVar("yellow", 8),
        solid: toRadixVar("yellow", 9),
        solidHover: toRadixVar("yellow", 10),
        text: toRadixVar("yellow", 11),
        textContrast: toRadixVar("yellow", 12),
      },
      info: {
        DEFAULT: toRadixVar("blue", 1),
        base: toRadixVar("blue", 1),
        bgSubtle: toRadixVar("blue", 2),
        bg: toRadixVar("blue", 3),
        bgHover: toRadixVar("blue", 4),
        bgActive: toRadixVar("blue", 5),
        line: toRadixVar("blue", 6),
        border: toRadixVar("blue", 7),
        borderHover: toRadixVar("blue", 8),
        solid: toRadixVar("blue", 9),
        solidHover: toRadixVar("blue", 10),
        text: toRadixVar("blue", 11),
        textContrast: toRadixVar("blue", 12),
      },
      error: {
        DEFAULT: toRadixVar("tomato", 1),
        base: toRadixVar("tomato", 1),
        bgSubtle: toRadixVar("tomato", 2),
        bg: toRadixVar("tomato", 3),
        bgHover: toRadixVar("tomato", 4),
        bgActive: toRadixVar("tomato", 5),
        line: toRadixVar("tomato", 6),
        border: toRadixVar("tomato", 7),
        borderHover: toRadixVar("tomato", 8),
        solid: toRadixVar("tomato", 9),
        solidHover: toRadixVar("tomato", 10),
        text: toRadixVar("tomato", 11),
        textContrast: toRadixVar("tomato", 12),
      },
      accent: {
        DEFAULT: toRadixVar("orange", 1),
        base: toRadixVar("orange", 1),
        bgSubtle: toRadixVar("orange", 2),
        bg: toRadixVar("orange", 3),
        bgHover: toRadixVar("orange", 4),
        bgActive: toRadixVar("orange", 5),
        line: toRadixVar("orange", 6),
        border: toRadixVar("orange", 7),
        borderHover: toRadixVar("orange", 8),
        solid: toRadixVar("orange", 9),
        solidHover: toRadixVar("orange", 10),
        text: toRadixVar("orange", 11),
        textContrast: toRadixVar("orange", 12),
      },
      muted: {
        DEFAULT: toRadixVar("gray", 1),
        base: toRadixVar("gray", 1),
        bgSubtle: toRadixVar("gray", 2),
        bg: toRadixVar("gray", 3),
        bgHover: toRadixVar("gray", 4),
        bgActive: toRadixVar("gray", 5),
        line: toRadixVar("gray", 6),
        border: toRadixVar("gray", 7),
        borderHover: toRadixVar("gray", 8),
        solid: toRadixVar("gray", 9),
        solidHover: toRadixVar("gray", 10),
        text: toRadixVar("gray", 11),
        textContrast: toRadixVar("gray", 12),
      },
      background: {
        DEFAULT: toRadixVar("sage", 1),
        base: toRadixVar("sage", 1),
        bgSubtle: toRadixVar("sage", 2),
        bg: toRadixVar("sage", 3),
        bgHover: toRadixVar("sage", 4),
        bgActive: toRadixVar("sage", 5),
        line: toRadixVar("sage", 6),
        border: toRadixVar("sage", 7),
        borderHover: toRadixVar("sage", 8),
        solid: toRadixVar("sage", 9),
        solidHover: toRadixVar("sage", 10),
        text: toRadixVar("sage", 11),
        textContrast: toRadixVar("sage", 12),
      },
      primary: {
        DEFAULT: toRadixVar("teal", 1),
        base: toRadixVar("teal", 1),
        bgSubtle: toRadixVar("teal", 2),
        bg: toRadixVar("teal", 3),
        bgHover: toRadixVar("teal", 4),
        bgActive: toRadixVar("teal", 5),
        line: toRadixVar("teal", 6),
        border: toRadixVar("teal", 7),
        borderHover: toRadixVar("teal", 8),
        solid: toRadixVar("teal", 9),
        solidHover: toRadixVar("teal", 10),
        text: toRadixVar("teal", 11),
        textContrast: toRadixVar("teal", 12),
      },
      secondary: {
        DEFAULT: toRadixVar("teal", 1),
        base: toRadixVar("teal", 1),
        bgSubtle: toRadixVar("teal", 2),
        bg: toRadixVar("teal", 3),
        bgHover: toRadixVar("teal", 4),
        bgActive: toRadixVar("teal", 5),
        line: toRadixVar("teal", 6),
        border: toRadixVar("teal", 7),
        borderHover: toRadixVar("teal", 8),
        solid: toRadixVar("teal", 9),
        solidHover: toRadixVar("teal", 10),
        text: toRadixVar("teal", 11),
        textContrast: toRadixVar("teal", 12),
      },
    },
    borderColor: (theme) => ({
      ...theme("colors"),
      DEFAULT: toRadixVar("sage", 7),
    }),
    // Modify the default ring color so that it matches the brand color:
    ringColor: (theme) => ({
      ...theme("colors"),
      DEFAULT: toRadixVar("teal", 7),
    }),
    ringOffsetColor: (theme) => ({
      ...theme("colors"),
      DEFAULT: toRadixVar("teal", 7),
    }),
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
      padding: "1.5rem",
      screens: {
        "2xl": "1536px",
      },
    },
    extend: {
      fontFamily: {
        satoshi: ["var(--font-satoshi)", ...fontFamily.sans],
        inter: ["var(--font-inter)", ...fontFamily.sans],
      },
      // fontSize: {
      //   xs: ["14px", { lineHeight: "24px", letterSpacing: "-0.03em" }],
      // },
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
  // tpyography is necessary next when we use content
  plugins: [
    require("tailwindcss-animate"),
    require("windy-radix-palette"),
    require("@tailwindcss/typography"),
    require("windy-radix-typography"),
    require("@tailwindcss/line-clamp"),
  ],
}
