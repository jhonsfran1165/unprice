import { clsx } from "clsx"
import type { ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const focusRing = [
  // base
  "outline outline-offset-1 outline-0 focus-visible:outline-1",
  // outline color
  "outline-background-solid",
]

export const focusInput = [
  // base
  "focus:ring-1",
  // ring color
  "focus:outline-background-solid",
  // border color
  "focus:outline-background-solid",
]
