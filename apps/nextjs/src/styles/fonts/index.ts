import { Inter } from "next/font/google"
import localFont from "next/font/local"

const inter = Inter({ subsets: ["latin"], variable: "--font-secondary" })

export const geist = localFont({
  src: "./GeistVF.woff2",
  variable: "--font-primary",
  weight: "300 900",
  display: "swap",
  style: "normal",
})

import { Crimson_Text, Inconsolata } from "next/font/google"

export const cal = localFont({
  src: "./CalSans-SemiBold.otf",
  variable: "--font-title",
})

export const crimsonBold = Crimson_Text({
  weight: "700",
  variable: "--font-title",
  subsets: ["latin"],
})

export const inconsolataBold = Inconsolata({
  weight: "700",
  variable: "--font-title",
  subsets: ["latin"],
})

export const crimson = Crimson_Text({
  weight: "400",
  variable: "--font-default",
  subsets: ["latin"],
})

export const inconsolata = Inconsolata({
  variable: "--font-default",
  subsets: ["latin"],
})

export const titleFontMapper = {
  Default: cal.variable,
  Serif: crimsonBold.variable,
  Mono: inconsolataBold.variable,
}

export const defaultFontMapper = {
  Default: inter.variable,
  Serif: crimson.variable,
  Mono: inconsolata.variable,
}

export const fontMapper = {
  "font-primary": geist.variable,
  "font-secondary": inter.variable,
  inter: inter.variable,
}
