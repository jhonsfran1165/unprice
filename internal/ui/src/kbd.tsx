import { type VariantProps, cva } from "class-variance-authority"
import * as React from "react"

import { cn } from "./utils"

const kbdVariants = cva(
  "select-none rounded border font-mono font-normal shadow-sm disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-accent text-accent-foreground",
        outline: "bg-background-bgSubtle text-background-text",
      },
      size: {
        default: "px-1.5 py-px text-xs",
        sm: "px-0 py-px text-[0.6rem] size-4 flex items-center justify-center",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface KbdProps
  extends React.ComponentPropsWithoutRef<"kbd">,
    VariantProps<typeof kbdVariants> {
  /**
   * The title of the `abbr` element inside the `kbd` element.
   * @default undefined
   * @type string | undefined
   * @example title="Command"
   */
  abbrTitle?: string
}

const Kbd = React.forwardRef<HTMLUnknownElement, KbdProps>(
  ({ abbrTitle, children, className, variant, size, ...props }, ref) => {
    return (
      <kbd className={cn(kbdVariants({ variant, className, size }))} ref={ref} {...props}>
        {abbrTitle ? (
          <abbr title={abbrTitle} className="px-0 py-0 no-underline">
            {children}
          </abbr>
        ) : (
          children
        )}
      </kbd>
    )
  }
)
Kbd.displayName = "Kbd"

export { Kbd }
