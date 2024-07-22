import { Inter } from "next/font/google"
import localFont from "next/font/local"

// TODO: handle font loading and improve fonts mapper
const inter = Inter({ subsets: ["latin"], variable: "--font-secondary" })

import { GeistMono } from "geist/font/mono"
import { GeistSans } from "geist/font/sans"

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
  "font-primary": cal.variable,
  "font-secondary": GeistSans.variable,
  "font-mono": GeistMono.variable,
  inter: inter.variable,
}
