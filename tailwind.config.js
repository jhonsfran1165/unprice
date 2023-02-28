const colors = require("tailwindcss/colors")
const { fontFamily } = require("tailwindcss/defaultTheme")

// fix opacity support in tailwind for background and text
/* https://github.com/adamwathan/tailwind-css-variable-text-opacity-demo */
const makeVariantsColor = (v, l) => {
  return ({ opacityValue }) => {
    if (opacityValue === undefined) {
      return `hsl(var(${v}) ${l}%)`
    }
    return `hsl(var(${v}) ${l}% / ${opacityValue})`
  }
}

const withOpacity = (v) => {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `rgba(var(${v}), ${opacityValue})`
    }
    return `rgb(var(${v}))`
  }
}

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
      amber: colors.amber,
      gray: colors.gray,
      red: colors.red,
      // TODO: mapped stale color to match my theme
      slate: colors.slate,
      orange: colors.orange,
      blue: colors.blue,
      yellow: colors.yellow,
      success: withOpacity("--color-success"),
      danger: withOpacity("--color-danger"),
      warning: withOpacity("--color-warning"),
      info: withOpacity("--color-info"),
      error: withOpacity("--color-error"),
      accent: withOpacity("--color-accent"),
      muted: withOpacity("--color-muted"),
      primary: {
        DEFAULT: withOpacity("--color-primary-default"),
        200: withOpacity("--color-primary-200"),
        900: withOpacity("--color-primary-900"),
      },
      secondary: {
        DEFAULT: withOpacity("--color-secondary-default"),
        200: withOpacity("--color-secondary-200"),
        900: withOpacity("--color-secondary-900"),
      },
      "base-skin": {
        DEFAULT: withOpacity("--color-bg-default"),
        200: withOpacity("--color-bg-200"),
        900: withOpacity("--color-bg-900"),
      },
      "base-text": {
        DEFAULT: withOpacity("--color-text-default"),
        200: withOpacity("--color-text-200"),
        900: withOpacity("--color-text-900"),
        inverted: withOpacity("--color-text-inverted"),
        muted: withOpacity("--color-text-muted"),
        hover: withOpacity("--color-text-hover"),
      },
    },
    // TODO: check if it is possible to configure variables here view config palette
    configViewer: {
      themeReplacements: {
        "var(--color-primary-default)": "#d09c00",
      },
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
      textColor: {
        skin: {
          base: withOpacity("--color-text-base"),
          muted: withOpacity("--color-text-muted"),
          inverted: withOpacity("--color-text-inverted"),
        },
      },
      backgroundColor: {
        skin: {
          fill: withOpacity("--color-fill"),
          "button-accent": withOpacity("--color-button-accent"),
          "button-accent-hover": withOpacity("--color-button-accent-hover"),
          "button-muted": withOpacity("--color-button-muted"),
        },
      },
      gradientColorStops: {
        skin: {
          hue: withOpacity("--color-fill"),
        },
      },
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
