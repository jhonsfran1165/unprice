import React from "react"

import { cn } from "@/lib/utils"

const Label = ({
  children,
  animateRerendering,
  color,
}: {
  children: React.ReactNode
  animateRerendering?: boolean
  color?: "default" | "pink" | "blue" | "violet" | "cyan" | "orange"
}) => {
  return (
    <div
      className={cn("rounded-full px-1.5 shadow-[0_0_1px_3px_black]", {
        "bg-gray-800 text-gray-300": color === "default",
        "bg-pink text-white": color === "pink",
        "bg-blue text-white": color === "blue",
        "bg-cyan text-white": color === "cyan",
        "bg-violet text-violet-100": color === "violet",
        "bg-orange-500 text-white": color === "orange",
        "animate-[highlight_1s_ease-in-out_1]": animateRerendering,
      })}
    >
      {children}
    </div>
  )
}
export const Boundary = ({
  children,
  labels = ["children"],
  size = "default",
  color = "default",
  animateRerendering = true,
}: {
  children: React.ReactNode
  labels?: string[]
  size?: "small" | "default" | "none"
  color?: "default" | "pink" | "blue" | "violet" | "cyan" | "orange"
  animateRerendering?: boolean
}) => {
  return (
    <div
      className={cn("relative rounded-lg border border-dashed", {
        "p-0 lg:p-0": size === "none",
        "p-3 lg:p-5": size === "small",
        "p-4 lg:p-9": size === "default",
        "border-gray-700": color === "default",
        "border-pink": color === "pink",
        "border-blue": color === "blue",
        "border-cyan": color === "cyan",
        "border-violet": color === "violet",
        "border-orange-500": color === "orange",
        "animate-[rerender_1s_ease-in-out_1] text-pink": animateRerendering,
      })}
    >
      <div
        className={cn(
          "absolute -top-2.5 flex gap-x-1 text-[9px] uppercase leading-4 tracking-widest",
          {
            "left-0 lg:left-0 z-20": size === "none",
            "left-3 lg:left-5": size === "small",
            "left-4 lg:left-9": size === "default",
          }
        )}
      >
        {labels.map((label) => {
          return (
            <Label
              key={label}
              color={color}
              animateRerendering={animateRerendering}
            >
              {label}
            </Label>
          )
        })}
      </div>

      {children}
    </div>
  )
}
