import type { Config } from "tailwindcss"
import { fontFamily } from "tailwindcss/defaultTheme"

import { generateTheme } from "./generate-theme"

export default {
  darkMode: ["class"],
  content: ["src/**/*.{ts,tsx}", "components/**/*.{ts,tsx}"],
  // disble hover on mobiles
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        sm: "640px", // mobile phones
        md: "768px", // tablets
        lg: "1024px", // desktops
        xl: "1280px", // large screens
        "2xl": "1536px", // extra large screens
        "4xl": "1920px", // extra large screens
      },
    },
    extend: {
      borderColor: {
        DEFAULT: "hsl(var(--border) / <alpha-value>)",
      },
      colors: {
        ...generateTheme("sunset"),
      },
      borderRadius: {
        lg: `var(--radius)`,
        md: `calc(var(--radius) - 2px)`,
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        primary: ["var(--font-primary)", ...fontFamily.sans],
        secondary: ["var(--font-secondary)", ...fontFamily.sans],
      },
      keyframes: {
        "fade-up": {
          "0%": {
            opacity: "0",
            transform: "translateY(10px)",
          },
          "80%": {
            opacity: "0.6",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0px)",
          },
        },
        "fade-down": {
          "0%": {
            opacity: "0",
            transform: "translateY(-10px)",
          },
          "80%": {
            opacity: "0.6",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0px)",
          },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s",
        "fade-down": "fade-down 0.5s",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config
