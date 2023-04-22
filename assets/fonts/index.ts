import localFont from "next/font/local"

export const satoshi = localFont({
  src: "./Satoshi-Variable.woff2",
  variable: "--font-satoshi",
  weight: "300 900",
  display: "swap",
  style: "normal",
})

export const inter = localFont({
  src: "./Inter-Regular.ttf",
  variable: "--font-inter",
  weight: "400",
  display: "swap",
})

export const cal = localFont({
  src: "./CalSans-SemiBold.woff2",
  variable: "--font-cal",
  weight: "600",
  display: "swap",
})

export const calTitle = localFont({
  src: "./CalSans-SemiBold.woff2",
  variable: "--font-title",
  weight: "600",
  display: "swap",
})

export const fontMapper = {
  "font-inter": inter.variable,
  "font-sato": satoshi.variable,
  "font-cal": calTitle.variable,
}
