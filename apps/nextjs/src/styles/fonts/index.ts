import { GeistMono } from "geist/font/mono"
import { GeistSans } from "geist/font/sans"
import localFont from "next/font/local"

export const cal = localFont({
  src: "CalSans-SemiBold.woff2",
  variable: "--font-primary",
})

export const fontMapper = {
  "font-primary": GeistSans.variable,
  "font-secondary": GeistSans.variable,
  "font-mono": GeistMono.variable,
}
