import { Inter, Lora, Work_Sans } from "next/font/google"
import localFont from "next/font/local"

export const satoshi = localFont({
  src: "./Satoshi-Variable.woff2",
  variable: "--font-satoshi",
  weight: "300 900",
  display: "swap",
  style: "normal",
})

export const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
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

export const lora = Lora({
  variable: "--font-title",
  subsets: ["latin"],
  weight: "600",
  display: "swap",
})

export const work = Work_Sans({
  variable: "--font-title",
  weight: "600",
  subsets: ["latin"],
  display: "swap",
})

export const fontMapper = {
  "font-inter": inter.variable,
  "font-sato": satoshi.variable,
  "font-cal": calTitle.variable,
  "font-lora": lora.variable,
  "font-work": work.variable,
}
