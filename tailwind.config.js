const colors = require("tailwindcss/colors")
const { fontFamily } = require("tailwindcss/defaultTheme")

// fix opacity support in tailwind for background and text
// const makeVariantsColor = (v, l) => {
//   return ({ opacityValue }) => {
//     if (opacityValue === undefined) {
//       return `hsl(var(${v})deg 100% ${l}%)`
//     }
//     return `hsl(var(${v})deg 100% ${l}% / ${opacityValue})`
//   }
// }

const withOpacity = (v) => {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `rgb(var(${v}), ${opacityValue})`
    }
    return `rgb(var(${v}))`
  }
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  // mode: "jit", // mode just in time
  darkMode: ["class", '[data-theme="dark"]'],
  // darkMode: ["class", '[data-theme="dark"]'],
  // prefix: 'builderai-', // activate to use prefixes here
  content: [
    "app/**/*.{ts,tsx}",
    "pages/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
  ],
  theme: {
    screens: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
      // tablet: "960px",
      // desktop: "1024px",
    },
    colors: {
      transparent: "transparent",
      current: "currentColor",
      black: "#000",
      white: "#fff",
      gray: colors.gray,
      slate: colors.slate,
      neutral: colors.neutral,
      "gray-1100": "rgb(10,10,11)",
      "gray-1000": "rgb(17,17,19)",
      primary: {
        DEFAULT: withOpacity("--primary"),
        // 50: withOpacity("--primary"),
        // 100: makeVariantsColor("--color-primary-hue", 94),
        // 200: makeVariantsColor("--color-primary-hue", 86),
        // 300: makeVariantsColor("--color-primary-hue", 77),
        // 400: makeVariantsColor("--color-primary-hue", 66),
        // 500: makeVariantsColor("--color-primary-hue", 50),
        // 600: makeVariantsColor("--color-primary-hue", 45),
        // 700: makeVariantsColor("--color-primary-hue", 39),
        // 750: makeVariantsColor("--color-primary-hue", 35),
        // 800: makeVariantsColor("--color-primary-hue", 32),
        // 900: makeVariantsColor("--color-primary-hue", 10),
      },
      secondary: {
        DEFAULT: withOpacity("--secondary"),
      },
      base: withOpacity("--base"),
    },
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
      // Modify the default ring color so that it matches the brand color:
      // ringColor: {
      // 	DEFAULT: brandColor['500'],
      // },
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
    require("@tailwindcss/typography"),
    require("@tailwindcss/line-clamp"),
  ],
}
