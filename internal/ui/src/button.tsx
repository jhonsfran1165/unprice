import { Slot } from "@radix-ui/react-slot"
import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"
import * as React from "react"

import { cn } from "./utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "button-default",
        primary: "button-primary",
        destructive: "button-danger",
        outline: "border bg-background-bgSubtle text-background-text; border-input",
        secondary: "button-secondary",
        ghost: "button-ghost bg-transparent",
        link: "button-link hover:underline-none focus-visible:ring-none focus-visible:ring-ring focus-visible:ring-offset-none",
        custom:
          "hover:underline-none focus-visible:ring-offset-none focus-visible:ring-none focus-visible:ring-offset-0 focus-visible:ring-0",
      },
      size: {
        default: "h-9 rounded-md px-3",
        sm: "h-7 rounded-md px-2 text-xs",
        normal: "h-10 px-4 py-2",
        lg: "h-11 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
