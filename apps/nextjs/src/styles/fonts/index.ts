import { Inter } from "next/font/google"
import localFont from "next/font/local"

export const satoshi = localFont({
  src: "./Satoshi-Variable.woff2",
  variable: "--font-primary",
  weight: "300 900",
  display: "swap",
  style: "normal",
})

const inter = Inter({ subsets: ["latin"], variable: "--font-secondary" })

export const cal = localFont({
  src: "./CalSans-SemiBold.woff2",
  variable: "--font-primary",
  weight: "600",
  display: "swap",
})

export const fontMapper = {
  "font-primary": cal.variable,
  "font-secondary": inter.variable,
}
