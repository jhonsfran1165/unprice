import { clsx } from "clsx"
import type { ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const focusRing = [
  // base
  "ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 focus:outline-none",
]

export const focusInput = [
  // base
  "focus:ring-1",
  // ring color
  "focus:outline-background-solid",
  // border color
  "focus:outline-background-solid",
]
