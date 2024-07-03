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

export const fontMapper = {
  "font-primary": geist.variable,
  "font-secondary": inter.variable,
  inter: inter.variable,
}
