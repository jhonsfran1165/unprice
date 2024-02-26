import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

import { Spinner } from "./icons"
import { cn } from "./utils"

const loadingVariants = cva(
  "animate-pulse rounded-full direction-alternate duration-700",
  {
    variants: {
      variant: {
        // we might want to inverse both styles
        default: "bg-primary-textContrast",
        inverse: "bg-foreground",
        destructive: "bg-destructive",
        outline: "bg-transparent",
        secondary: "bg-secondary",
        ghost: "bg-transparent",
        link: "bg-transparent",
      },
      size: {
        default: "h-1 w-1",
        lg: "h-1.5 w-1.5",
      },
      component: {
        default: "default",
        spinner: "spinner",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface Props
  extends React.ComponentProps<"div">,
    VariantProps<typeof loadingVariants> {}

export function LoadingAnimation({
  className,
  variant,
  size,
  component,
  ...props
}: Props) {
  if (component === "spinner") {
    return (
      <div
        className={cn("m-auto flex justify-center align-middle", className)}
        {...props}
      >
        <Spinner className="h-4 w-4 animate-spin" />
      </div>
    )
  }

  return (
    <div
      className={cn("flex items-center justify-center gap-1", className)}
      {...props}
    >
      <div className={cn(loadingVariants({ variant, size }))} />
      <div className={cn(loadingVariants({ variant, size }), "delay-150")} />
      <div className={cn(loadingVariants({ variant, size }), "delay-300")} />
    </div>
  )
}
