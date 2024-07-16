"use client"

import * as ProgressPrimitive from "@radix-ui/react-progress"
import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"
import * as React from "react"

import { cn } from "./utils"

const progressVariants = cva("", {
  variants: {
    variant: {
      default: "default",
      primary: "primary",
      destructive: "danger",
      secondary: "secondary",
    },
  },
  defaultVariants: {
    variant: "primary",
  },
})

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> &
    VariantProps<typeof progressVariants>
>(({ className, variant, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full",
      className,
      progressVariants({ variant, className })
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
