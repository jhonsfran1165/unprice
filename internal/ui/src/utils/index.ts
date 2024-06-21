import { clsx } from "clsx"
import type { ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const focusRing = [
  // base
  "outline outline-offset-2 outline-0 focus-visible:outline-2",
  // outline color
  "outline-primary",
]

export const focusInput = [
  // base
  "focus:ring-2",
  // ring color
  "focus:outline-primary",
  // border color
  "focus:outline-primary",
]
